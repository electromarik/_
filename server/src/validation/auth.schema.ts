import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(24)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed"),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  displayName: z.string().min(1).max(50),
});

export const loginSchema = z.object({
  usernameOrEmail: z.string().min(1),
  password: z.string().min(1),
});
