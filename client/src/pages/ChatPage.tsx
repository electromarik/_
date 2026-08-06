import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { getConversationTitle, getOtherParticipant, useChatStore } from "../store/chatStore";
import { connectSocket, disconnectSocket, getSocket } from "../api/socket";
import {
  addParticipant,
  createGroupConversation,
  deleteMessage,
  editMessage,
  getMessages,
  listConversations,
  markRead,
  removeParticipant,
  sendMessage,
  startConversation,
} from "../api/chat";
import { logout as logoutApi } from "../api/auth";
import { ConversationList } from "../components/ConversationList";
import { MessageBubble } from "../components/MessageBubble";
import { MessageInput } from "../components/MessageInput";
import { NewChatModal } from "../components/NewChatModal";
import { NewGroupModal } from "../components/NewGroupModal";
import { GroupMembersPanel } from "../components/GroupMembersPanel";
import { Avatar } from "../components/Avatar";
import type { Conversation, Message, ReadReceipt, User } from "../types";

const GROUP_COLOR = "#64748b";

export function ChatPage() {
  const { user, accessToken, clear } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    typingByConversation,
    readReceipts,
    setConversations,
    upsertConversation,
    setActiveConversation,
    setMessages,
    addMessage,
    updateMessage,
    setTyping,
    updatePresence,
    setReadReceipt,
  } = useChatStore();

  const [isNewChatOpen, setNewChatOpen] = useState(false);
  const [isNewGroupOpen, setNewGroupOpen] = useState(false);
  const [isMembersOpen, setMembersOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);

    socket.on("message:new", (message: Message) => {
      addMessage(message);
    });
    socket.on("message:updated", (message: Message) => {
      updateMessage(message);
    });
    socket.on("conversation:new", (conversation: Conversation) => {
      upsertConversation(conversation);
    });
    socket.on("conversation:updated", (conversation: Conversation) => {
      upsertConversation(conversation);
    });
    socket.on("conversation:read", (receipt: ReadReceipt) => {
      setReadReceipt(receipt);
    });
    socket.on("typing:start", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTyping(conversationId, userId, true);
    });
    socket.on("typing:stop", ({ conversationId, userId }: { conversationId: string; userId: string }) => {
      setTyping(conversationId, userId, false);
    });
    socket.on("presence:update", ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      updatePresence(userId, isOnline);
    });

    return () => {
      disconnectSocket();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  useEffect(() => {
    listConversations().then(setConversations);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activeConversationId) return;
    setLoadingMessages(true);
    getMessages(activeConversationId)
      .then((messages) => setMessages(activeConversationId, messages))
      .finally(() => setLoadingMessages(false));
    markRead(activeConversationId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const activeMessages = activeConversationId
    ? (messagesByConversation[activeConversationId] ?? [])
    : [];
  const typingUserIds = activeConversationId
    ? Array.from(typingByConversation[activeConversationId] ?? [])
    : [];
  const typingNames = activeConversation
    ? typingUserIds
        .map((id) => activeConversation.participants.find((p) => p.id === id)?.displayName)
        .filter((name): name is string => Boolean(name))
    : [];

  async function handleSelectNewChatUser(peer: User) {
    const conversation = await startConversation(peer.id);
    upsertConversation(conversation);
    setActiveConversation(conversation.id);
    setNewChatOpen(false);
  }

  async function handleCreateGroup(name: string, memberIds: string[]) {
    const conversation = await createGroupConversation(name, memberIds);
    upsertConversation(conversation);
    setActiveConversation(conversation.id);
    setNewGroupOpen(false);
  }

  async function handleAddMember(userId: string) {
    if (!activeConversationId) return;
    const conversation = await addParticipant(activeConversationId, userId);
    upsertConversation(conversation);
  }

  async function handleRemoveMember(userId: string) {
    if (!activeConversationId) return;
    const conversation = await removeParticipant(activeConversationId, userId);
    if (userId === user!.id) {
      setMembersOpen(false);
      setActiveConversation(null);
    } else {
      upsertConversation(conversation);
    }
  }

  async function handleSend(content: string, files: File[]) {
    if (!activeConversationId) return;
    await sendMessage(activeConversationId, content, files);
  }

  async function handleEditMessage(messageId: string, content: string) {
    if (!activeConversationId) return;
    const message = await editMessage(activeConversationId, messageId, content);
    updateMessage(message);
  }

  async function handleDeleteMessage(messageId: string) {
    if (!activeConversationId) return;
    const message = await deleteMessage(activeConversationId, messageId);
    updateMessage(message);
  }

  function handleTypingStart() {
    if (!activeConversationId) return;
    getSocket()?.emit("typing:start", { conversationId: activeConversationId });
  }

  function handleTypingStop() {
    if (!activeConversationId) return;
    getSocket()?.emit("typing:stop", { conversationId: activeConversationId });
  }

  async function handleLogout() {
    await logoutApi();
    disconnectSocket();
    clear();
  }

  if (!user) return null;

  const peer =
    activeConversation && !activeConversation.isGroup
      ? getOtherParticipant(activeConversation, user.id)
      : null;
  const title = activeConversation ? getConversationTitle(activeConversation, user.id) : "";

  const lastOwnMessage = [...activeMessages].reverse().find((m) => m.senderId === user.id);
  const conversationReceipts = activeConversationId ? (readReceipts[activeConversationId] ?? {}) : {};
  const isLastOwnMessageRead =
    lastOwnMessage &&
    Object.entries(conversationReceipts).some(
      ([userId, lastReadAt]) =>
        userId !== user.id && new Date(lastReadAt) >= new Date(lastOwnMessage.createdAt),
    );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      <aside className="flex w-80 shrink-0 flex-col border-r border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Avatar name={user.displayName} color={user.avatarColor} size={36} />
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {user.displayName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-medium text-slate-500 hover:text-red-500 dark:text-slate-400"
          >
            Выйти
          </button>
        </div>
        <div className="m-3 flex gap-2">
          <button
            onClick={() => setNewChatOpen(true)}
            className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            + Чат
          </button>
          <button
            onClick={() => setNewGroupOpen(true)}
            className="flex-1 rounded-lg border border-indigo-600 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800"
          >
            + Группа
          </button>
        </div>
        <ConversationList
          conversations={conversations}
          activeId={activeConversationId}
          currentUserId={user.id}
          onSelect={setActiveConversation}
        />
      </aside>

      <main className="flex flex-1 flex-col">
        {!activeConversation && (
          <div className="flex flex-1 items-center justify-center text-slate-400">
            Выберите диалог или начните новый
          </div>
        )}
        {activeConversation && (
          <>
            <header className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <button
                onClick={() => activeConversation.isGroup && setMembersOpen(true)}
                className="flex items-center gap-3 text-left"
              >
                <Avatar
                  name={title}
                  color={peer ? peer.avatarColor : GROUP_COLOR}
                  online={peer ? peer.isOnline : undefined}
                />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeConversation.isGroup
                      ? `${activeConversation.participants.length} участников`
                      : peer?.isOnline
                        ? "в сети"
                        : "не в сети"}
                  </p>
                </div>
              </button>
              {activeConversation.isGroup && (
                <button
                  onClick={() => setMembersOpen(true)}
                  className="text-xs font-medium text-indigo-600 hover:underline"
                >
                  Участники
                </button>
              )}
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {loadingMessages && (
                <p className="text-center text-sm text-slate-400">Загрузка...</p>
              )}
              {activeMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.senderId === user.id}
                  showSenderName={activeConversation.isGroup}
                  readLabel={
                    lastOwnMessage?.id === message.id && isLastOwnMessageRead ? "прочитано" : null
                  }
                  onEdit={handleEditMessage}
                  onDelete={handleDeleteMessage}
                />
              ))}
              {typingNames.length > 0 && (
                <p className="text-xs italic text-slate-400">
                  {typingNames.join(", ")} печатает...
                </p>
              )}
            </div>

            <MessageInput
              onSend={handleSend}
              onTypingStart={handleTypingStart}
              onTypingStop={handleTypingStop}
            />
          </>
        )}
      </main>

      {isNewChatOpen && (
        <NewChatModal onClose={() => setNewChatOpen(false)} onSelectUser={handleSelectNewChatUser} />
      )}
      {isNewGroupOpen && (
        <NewGroupModal onClose={() => setNewGroupOpen(false)} onCreate={handleCreateGroup} />
      )}
      {isMembersOpen && activeConversation && (
        <GroupMembersPanel
          conversation={activeConversation}
          currentUserId={user.id}
          onClose={() => setMembersOpen(false)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}
    </div>
  );
}
