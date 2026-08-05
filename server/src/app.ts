import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import { authRouter } from "./routes/auth.routes.js";
import { userRouter } from "./routes/user.routes.js";
import { conversationRouter } from "./routes/conversation.routes.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/conversations", conversationRouter);

  app.use(errorHandler);

  return app;
}
