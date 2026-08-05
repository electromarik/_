import type { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/tokens.js";
import { HttpError } from "../utils/httpError.js";

export interface AuthedRequest extends Request {
  user?: { userId: string; username: string };
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw new HttpError(401, "Missing access token");
  }
  const token = header.slice("Bearer ".length);
  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    throw new HttpError(401, "Invalid or expired access token");
  }
}
