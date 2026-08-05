import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { searchUsers } from "../api/chat";
import type { User } from "../types";

interface Props {
  onClose: () => void;
  onSelectUser: (user: User) => void;
}

export function NewChatModal({ onClose, onSelectUser }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const users = await searchUsers(trimmed);
        setResults(users);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center bg-black/40 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Новый чат</h2>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по имени пользователя..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-3 max-h-72 overflow-y-auto">
          {loading && <p className="py-4 text-center text-sm text-slate-400">Поиск...</p>}
          {!loading && query.trim() && results.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">Никого не найдено</p>
          )}
          <ul className="space-y-1">
            {results.map((user) => (
              <li key={user.id}>
                <button
                  onClick={() => onSelectUser(user)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Avatar name={user.displayName} color={user.avatarColor} size={36} />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{user.displayName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
