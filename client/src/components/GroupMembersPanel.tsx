import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { searchUsers } from "../api/chat";
import type { Conversation, User } from "../types";

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onClose: () => void;
  onAddMember: (userId: string) => void;
  onRemoveMember: (userId: string) => void;
}

export function GroupMembersPanel({
  conversation,
  currentUserId,
  onClose,
  onAddMember,
  onRemoveMember,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const isCreator = conversation.createdById === currentUserId;
  const memberIds = new Set(conversation.participants.map((p) => p.id));

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      const users = await searchUsers(trimmed);
      setResults(users.filter((u) => !memberIds.has(u.id)));
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center bg-black/40 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
          Участники · {conversation.participants.length}
        </h2>
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {conversation.participants.map((p) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
              <Avatar name={p.displayName} color={p.avatarColor} size={32} online={p.isOnline} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {p.displayName}
                  {p.id === conversation.createdById && (
                    <span className="ml-1 text-xs font-normal text-indigo-500">создатель</span>
                  )}
                </p>
              </div>
              {(isCreator || p.id === currentUserId) && p.id !== conversation.createdById && (
                <button
                  onClick={() => onRemoveMember(p.id)}
                  className="text-xs text-slate-400 hover:text-red-500"
                >
                  {p.id === currentUserId ? "Покинуть" : "Удалить"}
                </button>
              )}
            </li>
          ))}
        </ul>

        <div className="mt-4 border-t border-slate-200 pt-3 dark:border-slate-800">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Добавить участника..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          {results.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {results.map((u) => (
                <li key={u.id}>
                  <button
                    onClick={() => {
                      onAddMember(u.id);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Avatar name={u.displayName} color={u.avatarColor} size={28} />
                    {u.displayName}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
