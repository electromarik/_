import { prisma } from "../config/prisma.js";

const PUBLIC_USER_SELECT = {
  id: true,
  username: true,
  displayName: true,
  avatarColor: true,
  isOnline: true,
  lastSeenAt: true,
} as const;

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: PUBLIC_USER_SELECT });
}

export async function searchUsers(query: string, excludeUserId: string) {
  if (!query.trim()) return [];
  return prisma.user.findMany({
    where: {
      id: { not: excludeUserId },
      OR: [
        { username: { contains: query, mode: "insensitive" } },
        { displayName: { contains: query, mode: "insensitive" } },
      ],
    },
    select: PUBLIC_USER_SELECT,
    take: 20,
  });
}
