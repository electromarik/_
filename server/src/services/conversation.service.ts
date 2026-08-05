import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";

const PARTICIPANT_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarColor: true,
  isOnline: true,
  lastSeenAt: true,
} as const;

const CONVERSATION_SUMMARY_INCLUDE = {
  participants: { include: { user: { select: PARTICIPANT_USER_SELECT } } },
  messages: { orderBy: { createdAt: "desc" }, take: 1 },
} satisfies Prisma.ConversationInclude;

type ConversationWithSummary = Prisma.ConversationGetPayload<{
  include: typeof CONVERSATION_SUMMARY_INCLUDE;
}>;

function formatConversation(c: ConversationWithSummary) {
  return {
    id: c.id,
    isGroup: c.isGroup,
    name: c.name,
    updatedAt: c.updatedAt,
    participants: c.participants.map((p) => p.user),
    lastMessage: c.messages[0] ?? null,
  };
}

export async function getConversationSummary(conversationId: string) {
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
    include: CONVERSATION_SUMMARY_INCLUDE,
  });
  return formatConversation(conversation);
}

export async function listConversations(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    orderBy: { updatedAt: "desc" },
    include: CONVERSATION_SUMMARY_INCLUDE,
  });

  return conversations.map(formatConversation);
}

export async function getOrCreateDirectConversation(userId: string, otherUserId: string) {
  if (userId === otherUserId) {
    throw new HttpError(400, "Cannot start a conversation with yourself");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: { participants: true },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      isGroup: false,
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    include: { participants: true },
  });
}

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    throw new HttpError(403, "Not a participant of this conversation");
  }
}

export async function getMessages(
  conversationId: string,
  userId: string,
  cursor?: string,
  limit = 30,
) {
  await assertParticipant(conversationId, userId);

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarColor: true } },
    },
  });

  return messages.reverse();
}

export async function createMessage(conversationId: string, senderId: string, content: string) {
  await assertParticipant(conversationId, senderId);

  const message = await prisma.message.create({
    data: { conversationId, senderId, content },
    include: {
      sender: { select: { id: true, username: true, displayName: true, avatarColor: true } },
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return message;
}

export async function getParticipantIds(conversationId: string): Promise<string[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId);
}
