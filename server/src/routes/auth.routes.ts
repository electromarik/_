import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { loginSchema, registerSchema } from "../validation/auth.schema.js";
import * as authService from "../services/auth.service.js";
import { parseDurationMs } from "../utils/duration.js";
import { env } from "../config/env.js";

export const authRouter = Router();

const REFRESH_COOKIE = "refreshToken";

function setRefreshCookie(res: import("express").Response, token: string) {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: parseDurationMs(env.jwt.refreshExpiresIn),
    path: "/api/auth",
  });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const input = registerSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.register(input);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ user, accessToken });
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const { accessToken, refreshToken, user } = await authService.login(input);
    setRefreshCookie(res, refreshToken);
    res.json({ user, accessToken });
  }),
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new HttpError(401, "Missing refresh token");
    }
    const { accessToken, refreshToken } = await authService.refresh(token);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken });
  }),
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE, { path: "/api/auth" });
    res.status(204).send();
  }),
);
