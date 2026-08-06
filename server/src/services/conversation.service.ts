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

const MESSAGE_SENDER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarColor: true,
} as const;

const MESSAGE_INCLUDE = {
  sender: { select: MESSAGE_SENDER_SELECT },
  attachments: true,
} satisfies Prisma.MessageInclude;

type MessageWithRelations = Prisma.MessageGetPayload<{ include: typeof MESSAGE_INCLUDE }>;

function formatMessage(m: MessageWithRelations) {
  if (m.deletedAt) {
    return { ...m, content: "", attachments: [] };
  }
  return m;
}

const CONVERSATION_SUMMARY_INCLUDE = {
  participants: { include: { user: { select: PARTICIPANT_USER_SELECT } } },
  messages: { orderBy: { createdAt: "desc" }, take: 1, include: MESSAGE_INCLUDE },
} satisfies Prisma.ConversationInclude;

type ConversationWithSummary = Prisma.ConversationGetPayload<{
  include: typeof CONVERSATION_SUMMARY_INCLUDE;
}>;

function formatConversation(c: ConversationWithSummary) {
  return {
    id: c.id,
    isGroup: c.isGroup,
    name: c.name,
    createdById: c.createdById,
    updatedAt: c.updatedAt,
    participants: c.participants.map((p) => p.user),
    lastMessage: c.messages[0] ? formatMessage(c.messages[0]) : null,
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

export async function createGroupConversation(
  creatorId: string,
  name: string,
  memberIds: string[],
) {
  const uniqueMemberIds = Array.from(new Set([creatorId, ...memberIds]));
  if (uniqueMemberIds.length < 3) {
    throw new HttpError(400, "A group needs at least 2 other members");
  }

  const conversation = await prisma.conversation.create({
    data: {
      isGroup: true,
      name: name.trim(),
      createdById: creatorId,
      participants: { create: uniqueMemberIds.map((userId) => ({ userId })) },
    },
    include: CONVERSATION_SUMMARY_INCLUDE,
  });

  return formatConversation(conversation);
}

async function assertParticipant(conversationId: string, userId: string) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) {
    throw new HttpError(403, "Not a participant of this conversation");
  }
}

export async function addParticipant(
  conversationId: string,
  requesterId: string,
  newUserId: string,
) {
  await assertParticipant(conversationId, requesterId);
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
  });
  if (!conversation.isGroup) {
    throw new HttpError(400, "Cannot add members to a direct conversation");
  }

  await prisma.conversationParticipant.upsert({
    where: { conversationId_userId: { conversationId, userId: newUserId } },
    update: {},
    create: { conversationId, userId: newUserId },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return getConversationSummary(conversationId);
}

export async function removeParticipant(
  conversationId: string,
  requesterId: string,
  targetUserId: string,
) {
  await assertParticipant(conversationId, requesterId);
  const conversation = await prisma.conversation.findUniqueOrThrow({
    where: { id: conversationId },
  });
  if (!conversation.isGroup) {
    throw new HttpError(400, "Cannot remove members from a direct conversation");
  }
  const isSelfRemoval = requesterId === targetUserId;
  const isCreator = conversation.createdById === requesterId;
  if (!isSelfRemoval && !isCreator) {
    throw new HttpError(403, "Only the group creator can remove other members");
  }

  await prisma.conversationParticipant.deleteMany({
    where: { conversationId, userId: targetUserId },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return getConversationSummary(conversationId);
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
    include: MESSAGE_INCLUDE,
  });

  return messages.reverse().map(formatMessage);
}

export interface NewAttachment {
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
}

export async function createMessage(
  conversationId: string,
  senderId: string,
  content: string,
  attachments: NewAttachment[] = [],
) {
  await assertParticipant(conversationId, senderId);
  if (!content.trim() && attachments.length === 0) {
    throw new HttpError(400, "Message must have text or an attachment");
  }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      content: content.trim(),
      attachments: { create: attachments },
    },
    include: MESSAGE_INCLUDE,
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return formatMessage(message);
}

export async function editMessage(messageId: string, userId: string, content: string) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new HttpError(400, "Message content cannot be empty");
  }

  const existing = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });
  if (existing.senderId !== userId) {
    throw new HttpError(403, "Cannot edit another user's message");
  }
  if (existing.deletedAt) {
    throw new HttpError(400, "Cannot edit a deleted message");
  }

  const message = await prisma.message.update({
    where: { id: messageId },
    data: { content: trimmed, editedAt: new Date() },
    include: MESSAGE_INCLUDE,
  });

  return formatMessage(message);
}

export async function deleteMessage(messageId: string, userId: string) {
  const existing = await prisma.message.findUniqueOrThrow({ where: { id: messageId } });
  if (existing.senderId !== userId) {
    throw new HttpError(403, "Cannot delete another user's message");
  }

  await prisma.attachment.deleteMany({ where: { messageId } });
  const message = await prisma.message.update({
    where: { id: messageId },
    data: { content: "", deletedAt: new Date() },
    include: MESSAGE_INCLUDE,
  });

  return formatMessage(message);
}

export async function markRead(conversationId: string, userId: string) {
  await assertParticipant(conversationId, userId);
  const lastReadAt = new Date();
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt },
  });
  return { conversationId, userId, lastReadAt };
}

export async function getParticipantIds(conversationId: string): Promise<string[]> {
  const participants = await prisma.conversationParticipant.findMany({
    where: { conversationId },
    select: { userId: true },
  });
  return participants.map((p) => p.userId);
}

export async function getMessageConversationId(messageId: string): Promise<string> {
  const message = await prisma.message.findUniqueOrThrow({
    where: { id: messageId },
    select: { conversationId: true },
  });
  return message.conversationId;
}
