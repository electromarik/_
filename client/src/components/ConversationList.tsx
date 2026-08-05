import { Avatar } from "./Avatar";
import type { Conversation } from "../types";
import { getOtherParticipant } from "../store/chatStore";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({ conversations, activeId, currentUserId, onSelect }: Props) {
  if (conversations.length === 0) {
    return (
      <p className="p-4 text-sm text-slate-500 dark:text-slate-400">
        Пока нет диалогов. Найдите пользователя, чтобы начать переписку.
      </p>
    );
  }

  return (
    <ul className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const peer = getOtherParticipant(conversation, currentUserId);
        const isActive = conversation.id === activeId;
        return (
          <li key={conversation.id}>
            <button
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                isActive ? "bg-indigo-50 dark:bg-slate-800" : ""
              }`}
            >
              <Avatar name={peer.displayName} color={peer.avatarColor} online={peer.isOnline} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium text-slate-900 dark:text-white">
                    {peer.displayName}
                  </span>
                </div>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {conversation.lastMessage?.content ?? "Нет сообщений"}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
