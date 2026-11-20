import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth, type AuthedRequest } from "../middleware/auth.js";
import * as userService from "../services/user.service.js";

export const userRouter = Router();

userRouter.use(requireAuth);

userRouter.get(
  "/me",
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await userService.getUserById(req.user!.userId);
    res.json({ user });
  }),
);

userRouter.get(
  "/search",
  asyncHandler(async (req: AuthedRequest, res) => {
    const query = String(req.query.q ?? "");
    const users = await userService.searchUsers(query, req.user!.userId);
    res.json({ users });
  }),
);
