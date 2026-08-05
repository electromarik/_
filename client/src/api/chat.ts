import { api } from "./client";
import type { Conversation, Message, User } from "../types";

export async function searchUsers(query: string) {
  const { data } = await api.get<{ users: User[] }>("/users/search", { params: { q: query } });
  return data.users;
}

export async function listConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>("/conversations");
  return data.conversations;
}

export async function startConversation(userId: string) {
  const { data } = await api.post<{ conversation: Conversation }>("/conversations", { userId });
  return data.conversation;
}

export async function getMessages(conversationId: string, cursor?: string) {
  const { data } = await api.get<{ messages: Message[] }>(
    `/conversations/${conversationId}/messages`,
    { params: cursor ? { cursor } : {} },
  );
  return data.messages;
}
