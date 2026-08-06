import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import { searchUsers } from "../api/chat";
import type { User } from "../types";

interface Props {
  onClose: () => void;
  onCreate: (name: string, memberIds: string[]) => void;
}

export function NewGroupModal({ onClose, onCreate }: Props) {
  const [name, setName] = useState("");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [selected, setSelected] = useState<User[]>([]);
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

  function toggle(user: User) {
    setSelected((prev) =>
      prev.some((u) => u.id === user.id) ? prev.filter((u) => u.id !== user.id) : [...prev, user],
    );
  }

  function handleCreate() {
    if (!name.trim() || selected.length < 2) return;
    onCreate(
      name.trim(),
      selected.map((u) => u.id),
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-start justify-center bg-black/40 pt-24" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">Новая группа</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название группы"
          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />

        {selected.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {selected.map((u) => (
              <button
                key={u.id}
                onClick={() => toggle(u)}
                className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-200"
              >
                {u.displayName} ✕
              </button>
            ))}
          </div>
        )}

        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Добавить участников..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-3 max-h-56 overflow-y-auto">
          {loading && <p className="py-4 text-center text-sm text-slate-400">Поиск...</p>}
          <ul className="space-y-1">
            {results.map((user) => {
              const isSelected = selected.some((u) => u.id === user.id);
              return (
                <li key={user.id}>
                  <button
                    onClick={() => toggle(user)}
                    className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      isSelected ? "bg-indigo-50 dark:bg-slate-800" : ""
                    }`}
                  >
                    <Avatar name={user.displayName} color={user.avatarColor} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900 dark:text-white">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">@{user.username}</p>
                    </div>
                    {isSelected && <span className="text-indigo-600">✓</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          onClick={handleCreate}
          disabled={!name.trim() || selected.length < 2}
          className="mt-3 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
        >
          Создать группу {selected.length > 0 && `(${selected.length + 1})`}
        </button>
        <p className="mt-1 text-center text-xs text-slate-400">Нужно минимум 2 участника, кроме вас</p>
      </div>
    </div>
  );
}
