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

export async function createGroupConversation(name: string, memberIds: string[]) {
  const { data } = await api.post<{ conversation: Conversation }>("/conversations/group", {
    name,
    memberIds,
  });
  return data.conversation;
}

export async function addParticipant(conversationId: string, userId: string) {
  const { data } = await api.post<{ conversation: Conversation }>(
    `/conversations/${conversationId}/participants`,
    { userId },
  );
  return data.conversation;
}

export async function removeParticipant(conversationId: string, userId: string) {
  const { data } = await api.delete<{ conversation: Conversation }>(
    `/conversations/${conversationId}/participants/${userId}`,
  );
  return data.conversation;
}

export async function getMessages(conversationId: string, cursor?: string) {
  const { data } = await api.get<{ messages: Message[] }>(
    `/conversations/${conversationId}/messages`,
    { params: cursor ? { cursor } : {} },
  );
  return data.messages;
}

export async function sendMessage(conversationId: string, content: string, files: File[] = []) {
  const form = new FormData();
  form.append("content", content);
  for (const file of files) {
    form.append("files", file);
  }
  const { data } = await api.post<{ message: Message }>(
    `/conversations/${conversationId}/messages`,
    form,
  );
  return data.message;
}

export async function editMessage(conversationId: string, messageId: string, content: string) {
  const { data } = await api.patch<{ message: Message }>(
    `/conversations/${conversationId}/messages/${messageId}`,
    { content },
  );
  return data.message;
}

export async function deleteMessage(conversationId: string, messageId: string) {
  const { data } = await api.delete<{ message: Message }>(
    `/conversations/${conversationId}/messages/${messageId}`,
  );
  return data.message;
}

export async function toggleReaction(conversationId: string, messageId: string, emoji: string) {
  const { data } = await api.post<{ message: Message }>(
    `/conversations/${conversationId}/messages/${messageId}/reactions`,
    { emoji },
  );
  return data.message;
}

export async function markRead(conversationId: string) {
  await api.post(`/conversations/${conversationId}/read`);
}
