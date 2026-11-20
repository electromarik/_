import type { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/tokens.js";
import { prisma } from "../config/prisma.js";
import * as conversationService from "../services/conversation.service.js";

interface AuthedSocket extends Socket {
  data: { userId: string; username: string };
}

export function registerSocketHandlers(io: Server) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing access token"));
      return;
    }
    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.userId;
      socket.data.username = payload.username;
      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", async (rawSocket) => {
    const socket = rawSocket as AuthedSocket;
    const { userId } = socket.data;

    const onlineBefore = await isUserOnline(io, userId);
    socket.join(`user:${userId}`);

    if (!onlineBefore) {
      await prisma.user.update({ where: { id: userId }, data: { isOnline: true } });
      const conversations = await conversationService.listConversations(userId);
      broadcastPresence(io, conversations, userId, true);
    }

    socket.on("message:send", async (payload: { conversationId: string; content: string }, ack) => {
      try {
        const content = String(payload?.content ?? "").trim();
        if (!content || content.length > 4000 || !payload?.conversationId) {
          ack?.({ error: "Invalid message payload" });
          return;
        }
        const message = await conversationService.createMessage(
          payload.conversationId,
          userId,
          content,
        );
        const participantIds = await conversationService.getParticipantIds(payload.conversationId);
        for (const participantId of participantIds) {
          io.to(`user:${participantId}`).emit("message:new", message);
        }
        ack?.({ message });
      } catch (err) {
        ack?.({ error: err instanceof Error ? err.message : "Failed to send message" });
      }
    });

    socket.on("typing:start", async (payload: { conversationId: string }) => {
      if (!payload?.conversationId) return;
      const participantIds = await conversationService.getParticipantIds(payload.conversationId);
      for (const participantId of participantIds) {
        if (participantId === userId) continue;
        io.to(`user:${participantId}`).emit("typing:start", {
          conversationId: payload.conversationId,
          userId,
        });
      }
    });

    socket.on("typing:stop", async (payload: { conversationId: string }) => {
      if (!payload?.conversationId) return;
      const participantIds = await conversationService.getParticipantIds(payload.conversationId);
      for (const participantId of participantIds) {
        if (participantId === userId) continue;
        io.to(`user:${participantId}`).emit("typing:stop", {
          conversationId: payload.conversationId,
          userId,
        });
      }
    });

    socket.on("disconnect", async () => {
      const stillOnline = await isUserOnline(io, userId);
      if (!stillOnline) {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false, lastSeenAt: new Date() },
        });
        const conversations = await conversationService.listConversations(userId);
        broadcastPresence(io, conversations, userId, false);
      }
    });
  });
}

async function isUserOnline(io: Server, userId: string): Promise<boolean> {
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  return Boolean(room && room.size > 0);
}

function broadcastPresence(
  io: Server,
  conversations: Awaited<ReturnType<typeof conversationService.listConversations>>,
  userId: string,
  isOnline: boolean,
) {
  const peerIds = new Set<string>();
  for (const conversation of conversations) {
    for (const participant of conversation.participants) {
      if (participant.id !== userId) peerIds.add(participant.id);
    }
  }
  for (const peerId of peerIds) {
    io.to(`user:${peerId}`).emit("presence:update", { userId, isOnline });
  }
}
