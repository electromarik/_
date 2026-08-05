export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatarColor: string;
  };
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  updatedAt: string;
  participants: User[];
  lastMessage: Message | null;
}
