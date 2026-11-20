import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";
import { futureDate } from "../utils/duration.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  email: true,
  displayName: true,
  avatarColor: true,
  isOnline: true,
  lastSeenAt: true,
} as const;

async function issueTokenPair(userId: string, username: string) {
  const accessToken = signAccessToken({ userId, username });
  const refreshToken = signRefreshToken({ userId });
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: futureDate(env.jwt.refreshExpiresIn),
    },
  });
  return { accessToken, refreshToken };
}

export async function register(input: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ username: input.username }, { email: input.email }] },
  });
  if (existing) {
    throw new HttpError(409, "Username or email already taken");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      passwordHash,
      displayName: input.displayName,
      avatarColor: randomColor(),
    },
    select: PUBLIC_USER_SELECT,
  });

  const tokens = await issueTokenPair(user.id, user.username);
  return { user, ...tokens };
}

export async function login(input: { usernameOrEmail: string; password: string }) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ username: input.usernameOrEmail }, { email: input.usernameOrEmail }],
    },
  });
  if (!user) {
    throw new HttpError(401, "Invalid credentials");
  }
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) {
    throw new HttpError(401, "Invalid credentials");
  }

  const tokens = await issueTokenPair(user.id, user.username);
  const { passwordHash: _omit, ...publicUser } = user;
  return { user: publicUser, ...tokens };
}

export async function refresh(oldToken: string) {
  let payload: { userId: string };
  try {
    payload = verifyRefreshToken(oldToken);
  } catch {
    throw new HttpError(401, "Invalid refresh token");
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: oldToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new HttpError(401, "Refresh token expired or revoked");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) {
    throw new HttpError(401, "User not found");
  }

  await prisma.refreshToken.delete({ where: { token: oldToken } });
  const tokens = await issueTokenPair(user.id, user.username);
  return tokens;
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { token } });
}

function randomColor(): string {
  const palette = ["#6366f1", "#22c55e", "#f97316", "#ec4899", "#06b6d4", "#a855f7", "#eab308"];
  return palette[Math.floor(Math.random() * palette.length)];
}
