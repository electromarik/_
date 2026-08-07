import { z } from "zod";

export const startConversationSchema = z.object({
  userId: z.string().uuid(),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  memberIds: z.array(z.string().uuid()).min(2),
});

export const addParticipantSchema = z.object({
  userId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().max(4000).optional().default(""),
});

export const editMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const reactionSchema = z.object({
  emoji: z.string().min(1).max(8),
});
