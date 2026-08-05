import { create } from "zustand";
import type { Conversation, Message } from "../types";

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messagesByConversation: Record<string, Message[]>;
  typingByConversation: Record<string, Set<string>>;
  setConversations: (conversations: Conversation[]) => void;
  upsertConversation: (conversation: Conversation) => void;
  setActiveConversation: (id: string | null) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  prependMessages: (conversationId: string, messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;
  updatePresence: (userId: string, isOnline: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messagesByConversation: {},
  typingByConversation: {},

  setConversations: (conversations) => set({ conversations }),

  upsertConversation: (conversation) =>
    set((state) => {
      const rest = state.conversations.filter((c) => c.id !== conversation.id);
      return { conversations: [conversation, ...rest] };
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
      const touched = conversations.find((c) => c.id === message.conversationId);
      const reordered = touched
        ? [touched, ...conversations.filter((c) => c.id !== message.conversationId)]
        : conversations;

      return {
        messagesByConversation: {
          ...state.messagesByConversation,
          [message.conversationId]: [...existing, message],
        },
        conversations: reordered,
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
}));

export function getOtherParticipant(conversation: Conversation, currentUserId: string) {
  return conversation.participants.find((p) => p.id !== currentUserId) ?? conversation.participants[0];
}
