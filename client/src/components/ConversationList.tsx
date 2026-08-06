import { Avatar } from "./Avatar";
import type { Conversation } from "../types";
import { getConversationTitle, getOtherParticipant } from "../store/chatStore";

interface Props {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
}

const GROUP_COLOR = "#64748b";

function previewText(conversation: Conversation): string {
  const last = conversation.lastMessage;
  if (!last) return "Нет сообщений";
  if (last.deletedAt) return "Сообщение удалено";
  if (last.content) return last.content;
  if (last.attachments.length > 0) return `📎 ${last.attachments.length > 1 ? "Вложения" : "Вложение"}`;
  return "Нет сообщений";
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
        const isActive = conversation.id === activeId;
        const title = getConversationTitle(conversation, currentUserId);
        const peer = conversation.isGroup ? null : getOtherParticipant(conversation, currentUserId);

        return (
          <li key={conversation.id}>
            <button
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                isActive ? "bg-indigo-50 dark:bg-slate-800" : ""
              }`}
            >
              <Avatar
                name={title}
                color={peer ? peer.avatarColor : GROUP_COLOR}
                online={peer ? peer.isOnline : undefined}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium text-slate-900 dark:text-white">{title}</span>
                </div>
                <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                  {previewText(conversation)}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
