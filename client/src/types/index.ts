export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarColor: string;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface Attachment {
  id: string;
  messageId: string;
  url: string;
  fileName: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  editedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  attachments: Attachment[];
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
  createdById: string | null;
  updatedAt: string;
  participants: User[];
  lastMessage: Message | null;
}

export interface ReadReceipt {
  conversationId: string;
  userId: string;
  lastReadAt: string;
}
