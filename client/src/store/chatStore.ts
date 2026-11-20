import { create } from "zustand";
import type { Conversation, Message, ReadReceipt } from "../types";

function sortByUpdatedAtDesc(conversations: Conversation[]): Conversation[] {
  return [...conversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>;
  typingByConversation: Record<string, Set<string>>;
  readReceipts: Record<string, Record<string, string>>;
  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
  setReadReceipt: (receipt: ReadReceipt) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  typingByConversation: {},
  readReceipts: {},

  setConversations: (conversations) => set({ conversations: sortByUpdatedAtDesc(conversations) }),

  upsertConversation: (conversation) =>
    set((state) => {
      const rest = state.conversations.filter((c) => c.id !== conversation.id);
      return { conversations: sortByUpdatedAtDesc([conversation, ...rest]) };
    }),

  setActiveConversation: (id) => set({ activeConversationId: id }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: { ...state.messagesByConversation, [conversationId]: messages },
    })),

  prependMessages: (conversationId, messages) =>
    set((state) => ({
      messagesByConversation: {
        ...state.messagesByConversation,
        [conversationId]: [...messages, ...(state.messagesByConversation[conversationId] ?? [])],
      },
    })),

  addMessage: (message) =>
    set((state) => {
      const existing = state.messagesByConversation[message.conversationId] ?? [];
      if (existing.some((m) => m.id === message.id)) return state;

      const conversations = state.conversations.map((c) =>
        c.id === message.conversationId
          ? { ...c, lastMessage: message, updatedAt: message.createdAt }
          : c,
      );

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: [...existing, message],
        },
        conversations: sortByUpdatedAtDesc(conversations),
      };
    }),

  updateMessage: (message) =>
    set((state) => {
      const existing = state.messagesByConversation[message.conversationId] ?? [];
      const updated = existing.map((m) => (m.id === message.id ? message : m));

      const conversations = state.conversations.map((c) => {
        if (c.id !== message.conversationId) return c;
        if (c.lastMessage?.id !== message.id) return c;
        return { ...c, lastMessage: message };
      });

      return {
        messagesByConversation: { ...state.messagesByConversation, [message.conversationId]: updated },
        conversations,
      };
    }),

  setTyping: (conversationId, userId, isTyping) =>
    set((state) => {
      const current = new Set(state.typingByConversation[conversationId] ?? []);
      if (isTyping) current.add(userId);
      else current.delete(userId);
      return {
        typingByConversation: { ...state.typingByConversation, [conversationId]: current },
      };
    }),

  updatePresence: (userId, isOnline) =>
    set((state) => ({
      conversations: state.conversations.map((c) => ({
        ...c,
        participants: c.participants.map((p) => (p.id === userId ? { ...p, isOnline } : p)),
      })),
    })),

  setReadReceipt: (receipt) =>
    set((state) => ({
      readReceipts: {
        ...state.readReceipts,
        [receipt.conversationId]: {
          ...state.readReceipts[receipt.conversationId],
          [receipt.userId]: receipt.lastReadAt,
        },
      },
    })),
}));

export function getOtherParticipant(conversation: Conversation, currentUserId: string) {
  return conversation.participants.find((p) => p.id !== currentUserId) ?? conversation.participants[0];
}

export function getConversationTitle(conversation: Conversation, currentUserId: string): string {
  if (conversation.isGroup) return conversation.name ?? "Группа";
  return getOtherParticipant(conversation, currentUserId).displayName;
}
