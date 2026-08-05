import { api } from "./client";
import type { User } from "../types";

export async function register(input: {
  username: string;
  email: string;
  password: string;
  displayName: string;
}) {
  const { data } = await api.post<{ user: User; accessToken: string }>(
    "/auth/register",
    input,
  );
  return data;
}

export async function login(input: { usernameOrEmail: string; password: string }) {
  const { data } = await api.post<{ user: User; accessToken: string }>("/auth/login", input);
  return data;
}

export async function logout() {
  await api.post("/auth/logout");
}

export async function fetchMe() {
  const { data } = await api.get<{ user: User }>("/users/me");
  return data.user;
}
