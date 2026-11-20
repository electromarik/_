import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import * as conversationService from "../services/conversation.service.js";
import {
  addParticipantSchema,
  createGroupSchema,
  editMessageSchema,
  reactionSchema,
  sendMessageSchema,
  startConversationSchema,
} from "../validation/conversation.schema.js";
import { getIo } from "../socket/io.js";
import { upload } from "../middleware/upload.js";

export const conversationRouter = Router();

conversationRouter.use(requireAuth);

function attachmentUrl(filename: string): string {
  return `/uploads/${filename}`;
}

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

    getIo().to(`user:${userId}`).emit("conversation:new", summary);

    res.status(201).json({ conversation: summary });
  }),
);

conversationRouter.post(
  "/group",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { name, memberIds } = createGroupSchema.parse(req.body);
    const summary = await conversationService.createGroupConversation(
      req.user!.userId,
      name,
      memberIds,
    );

    const io = getIo();
    for (const participant of summary.participants) {
      if (participant.id === req.user!.userId) continue;
      io.to(`user:${participant.id}`).emit("conversation:new", summary);
    }

    res.status(201).json({ conversation: summary });
  }),
);

conversationRouter.post(
  "/:id/participants",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { userId } = addParticipantSchema.parse(req.body);
    const summary = await conversationService.addParticipant(req.params.id, req.user!.userId, userId);

    const io = getIo();
    for (const participant of summary.participants) {
      io.to(`user:${participant.id}`).emit("conversation:new", summary);
    }

    res.status(201).json({ conversation: summary });
  }),
);

conversationRouter.delete(
  "/:id/participants/:userId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const participantIdsBefore = await conversationService.getParticipantIds(req.params.id);
    const summary = await conversationService.removeParticipant(
      req.params.id,
      req.user!.userId,
      req.params.userId,
    );

    const io = getIo();
    for (const participantId of participantIdsBefore) {
      io.to(`user:${participantId}`).emit("conversation:updated", summary);
    }

    res.json({ conversation: summary });
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
  upload.array("files", 5),
  asyncHandler(async (req: AuthedRequest, res) => {
    const { content } = sendMessageSchema.parse(req.body);
    const files = (req.files as Express.Multer.File[] | undefined) ?? [];
    const attachments = files.map((file) => ({
      url: attachmentUrl(file.filename),
      fileName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    }));

    const message = await conversationService.createMessage(
      req.params.id,
      req.user!.userId,
      content,
      attachments,
    );
    const participantIds = await conversationService.getParticipantIds(req.params.id);
    const io = getIo();
    for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("message:new", message);
    }
    res.status(201).json({ message });
  }),
);

conversationRouter.patch(
  "/:id/messages/:messageId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { content } = editMessageSchema.parse(req.body);
    const message = await conversationService.editMessage(
      req.params.messageId,
      req.user!.userId,
      content,
    );
    const participantIds = await conversationService.getParticipantIds(req.params.id);
    const io = getIo();
    for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("message:updated", message);
    }
    res.json({ message });
  }),
);

conversationRouter.delete(
  "/:id/messages/:messageId",
  asyncHandler(async (req: AuthedRequest, res) => {
    const message = await conversationService.deleteMessage(req.params.messageId, req.user!.userId);
    const participantIds = await conversationService.getParticipantIds(req.params.id);
    const io = getIo();
    for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("message:updated", message);
    }
    res.json({ message });
  }),
);

conversationRouter.post(
  "/:id/messages/:messageId/reactions",
  asyncHandler(async (req: AuthedRequest, res) => {
    const { emoji } = reactionSchema.parse(req.body);
    const message = await conversationService.toggleReaction(
      req.params.messageId,
      req.user!.userId,
      emoji,
    );
    const participantIds = await conversationService.getParticipantIds(req.params.id);
    const io = getIo();
    for (const participantId of participantIds) {
      io.to(`user:${participantId}`).emit("message:updated", message);
    }
    res.json({ message });
  }),
);

conversationRouter.post(
  "/:id/read",
  asyncHandler(async (req: AuthedRequest, res) => {
    const receipt = await conversationService.markRead(req.params.id, req.user!.userId);
    const participantIds = await conversationService.getParticipantIds(req.params.id);
    const io = getIo();
    for (const participantId of participantIds) {
      if (participantId === req.user!.userId) continue;
      io.to(`user:${participantId}`).emit("conversation:read", receipt);
    }
    res.json({ receipt });
  }),
);

