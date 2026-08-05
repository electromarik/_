import type { Message } from "../types";

interface Props {
  message: Message;
  isOwn: boolean;
}

export function MessageBubble({ message, isOwn }: Props) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
          isOwn
            ? "rounded-br-sm bg-indigo-600 text-white"
            : "rounded-bl-sm bg-white text-slate-900 dark:bg-slate-800 dark:text-white"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className={`mt-1 block text-right text-[11px] ${
            isOwn ? "text-indigo-200" : "text-slate-400"
          }`}
        >
          {time}
        </span>
      </div>
    </div>
  );
}
