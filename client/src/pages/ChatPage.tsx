import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../store/authStore";
import { getOtherParticipant, useChatStore } from "../store/chatStore";
import { connectSocket, disconnectSocket, getSocket } from "../api/socket";
import { getMessages, listConversations, startConversation } from "../api/chat";
import { logout as logoutApi } from "../api/auth";
import { ConversationList } from "../components/ConversationList";
import { MessageBubble } from "../components/MessageBubble";
import { MessageInput } from "../components/MessageInput";
import { NewChatModal } from "../components/NewChatModal";
import { Avatar } from "../components/Avatar";
import type { Conversation, Message, User } from "../types";

export function ChatPage() {
  const { user, accessToken, clear } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messagesByConversation,
    typingByConversation,
    setConversations,
    upsertConversation,
    setActiveConversation,
    setMessages,
    addMessage,
    setTyping,
    updatePresence,
  } = useChatStore();

  const [isModalOpen, setModalOpen] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    const socket = connectSocket(accessToken);

    socket.on("message:new", (message: Message) => {
      addMessage(message);
    });
    socket.on("conversation:new", (conversation: Conversation) => {
      upsertConversation(conversation);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );
  const activeMessages = activeConversationId
    ? (messagesByConversation[activeConversationId] ?? [])
    : [];
  const typingUsers = activeConversationId
    ? Array.from(typingByConversation[activeConversationId] ?? [])
    : [];

  async function handleSelectNewChatUser(peer: User) {
    const conversation = await startConversation(peer.id);
    upsertConversation(conversation);
    setActiveConversation(conversation.id);
    setModalOpen(false);
  }

  function handleSend(content: string) {
    if (!activeConversationId) return;
    const socket = getSocket();
    socket?.emit("message:send", { conversationId: activeConversationId, content });
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

  const peer = activeConversation ? getOtherParticipant(activeConversation, user.id) : null;

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
        <button
          onClick={() => setModalOpen(true)}
          className="m-3 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          + Новый чат
        </button>
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
        {activeConversation && peer && (
          <>
            <header className="flex items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
              <Avatar name={peer.displayName} color={peer.avatarColor} online={peer.isOnline} />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{peer.displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {peer.isOnline ? "в сети" : "не в сети"}
                </p>
              </div>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {loadingMessages && (
                <p className="text-center text-sm text-slate-400">Загрузка...</p>
              )}
              {activeMessages.map((message) => (
                <MessageBubble key={message.id} message={message} isOwn={message.senderId === user.id} />
              ))}
              {typingUsers.length > 0 && (
                <p className="text-xs italic text-slate-400">печатает...</p>
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

      {isModalOpen && (
        <NewChatModal onClose={() => setModalOpen(false)} onSelectUser={handleSelectNewChatUser} />
      )}
    </div>
  );
}
