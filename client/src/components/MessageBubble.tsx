import { useState } from "react";
import type { Message } from "../types";
import { API_BASE_URL } from "../api/client";

interface Props {
  message: Message;
  isOwn: boolean;
  currentUserId: string;
  showSenderName?: boolean;
  readLabel?: string | null;
  onEdit: (messageId: string, content: string) => void;
  onDelete: (messageId: string) => void;
  onReact: (messageId: string, emoji: string) => void;
}

const QUICK_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MessageBubble({
  message,
  isOwn,
  currentUserId,
  showSenderName,
  readLabel,
  onEdit,
  onDelete,
  onReact,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [isPickerOpen, setPickerOpen] = useState(false);

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  function submitEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  }

  function pickReaction(emoji: string) {
    onReact(message.id, emoji);
    setPickerOpen(false);
  }

  if (message.deletedAt) {
    return (
      <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[70%] rounded-2xl bg-slate-100 px-4 py-2 text-sm italic text-slate-400 dark:bg-slate-800/50 dark:text-slate-500">
          Сообщение удалено
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[70%] items-start gap-1 ${isOwn ? "flex-row-reverse" : ""}`}>
        <div className="relative">
          <div
            className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
              isOwn
                ? "rounded-br-sm bg-indigo-600 text-white"
                : "rounded-bl-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
            }`}
          >
            {showSenderName && !isOwn && (
              <p className="mb-0.5 text-xs font-semibold text-indigo-400">
                {message.sender.displayName}
              </p>
            )}

            {message.attachments.length > 0 && (
              <div className="mb-1.5 space-y-1.5">
                {message.attachments.map((att) =>
                  att.mimeType.startsWith("image/") ? (
                    <a key={att.id} href={`${API_BASE_URL}${att.url}`} target="_blank" rel="noreferrer">
                      <img
                        src={`${API_BASE_URL}${att.url}`}
                        alt={att.fileName}
                        className="max-h-64 rounded-lg object-cover"
                      />
                    </a>
                  ) : (
                    <a
                      key={att.id}
                      href={`${API_BASE_URL}${att.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                        isOwn
                          ? "border-indigo-400 bg-indigo-500/40"
                          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900"
                      }`}
                    >
                      <span>📎</span>
                      <span className="truncate">{att.fileName}</span>
                      <span className="shrink-0 opacity-70">{formatSize(att.size)}</span>
                    </a>
                  ),
                )}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-1">
                <textarea
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitEdit();
                    }
                    if (e.key === "Escape") setIsEditing(false);
                  }}
                  className="w-56 resize-none rounded-md border border-white/30 bg-white/10 px-2 py-1 text-sm outline-none"
                  rows={2}
                />
                <div className="flex justify-end gap-2 text-xs">
                  <button onClick={() => setIsEditing(false)} className="opacity-80 hover:underline">
                    Отмена
                  </button>
                  <button onClick={submitEdit} className="font-semibold hover:underline">
                    Сохранить
                  </button>
                </div>
              </div>
            ) : (
              message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}

            <span
              className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                isOwn ? "text-indigo-200" : "text-slate-400"
              }`}
            >
              {message.editedAt && <span className="italic">изменено</span>}
              {time}
              {readLabel && <span>· {readLabel}</span>}
            </span>
          </div>

          {message.reactions.length > 0 && (
            <div className={`mt-1 flex flex-wrap gap-1 ${isOwn ? "justify-end" : "justify-start"}`}>
              {message.reactions.map((r) => {
                const isMine = r.userIds.includes(currentUserId);
                return (
                  <button
                    key={r.emoji}
                    onClick={() => onReact(message.id, r.emoji)}
                    className={`rounded-full border px-1.5 py-0.5 text-xs ${
                      isMine
                        ? "border-indigo-400 bg-indigo-100 dark:bg-indigo-900/50"
                        : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
                    }`}
                  >
                    {r.emoji} {r.userIds.length}
                  </button>
                );
              })}
            </div>
          )}

          {isPickerOpen && (
            <div
              className={`absolute top-full z-10 mt-1 flex gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-lg dark:border-slate-700 dark:bg-slate-800 ${
                isOwn ? "right-0" : "left-0"
              }`}
            >
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => pickReaction(emoji)}
                  className="rounded p-0.5 text-base hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 hidden shrink-0 gap-1 group-hover:flex">
          <button
            onClick={() => setPickerOpen((v) => !v)}
            title="Реакция"
            className="rounded p-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
          >
            😊
          </button>
          {isOwn && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                title="Редактировать"
                className="rounded p-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(message.id)}
                title="Удалить"
                className="rounded p-1 text-xs text-slate-400 hover:bg-slate-200 hover:text-red-600 dark:hover:bg-slate-700"
              >
                🗑️
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
