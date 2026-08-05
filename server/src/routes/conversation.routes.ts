import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import * as conversationService from "../services/conversation.service.js";
import { sendMessageSchema, startConversationSchema } from "../validation/conversation.schema.js";
import { getIo } from "../socket/io.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

conversationRouter.get(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const conversations = await conversationService.listConversations(req.user!.userId);
    res.json({ conversations });
  }),
);

conversationRouter.post(
  "/",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId } = startConversationSchema.parse(req.body);
    const created = await conversationService.getOrCreateDirectConversation(
      req.user!.userId,
      userId,
    );
    const summary = await conversationService.getConversationSummary(created.id);

    const io = getIo();
    io.to(`user:${userId}`).emit("conversation:new", summary);

    res.status(201).json({ conversation: summary });
  }),
);

conversationRouter.get(
  "/:id/messages",
  asyncHandler(async (req: AuthedRequest, res) => {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
    const messages = await conversationService.getMessages(
      req.params.id,
      req.user!.userId,
      cursor,
    );
    res.json({ messages });
  }),
);

conversationRouter.post(
  "/:id/messages",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { content } = sendMessageSchema.parse(req.body);
    const message = await conversationService.createMessage(
      req.params.id,
      req.user!.userId,
      content,
    );
    const participantIds = await conversationService.getParticipantIds(req.params.id);
    const io = getIo();
    for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("message:new", message);
    }
    res.status(201).json({ message });
  }),
);
