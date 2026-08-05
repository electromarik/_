import { type FormEvent, useRef, useState } from "react";

interface Props {
  onSend: (content: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
}

export function MessageInput({ onSend, onTypingStart, onTypingStop }: Props) {
  const [value, setValue] = useState("");
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    onTypingStart();
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(onTypingStop, 1500);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    onTypingStop();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Напишите сообщение..."
        rows={1}
        className="max-h-32 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <button
        type="submit"
        disabled={!value.trim()}
        className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-40"
      >
        Отправить
      </button>
    </form>
  );
}
