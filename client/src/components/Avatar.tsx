interface AvatarProps {
  name: string;
  color: string;
  size?: number;
  online?: boolean;
}

export function Avatar({ name, color, size = 40, online }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center rounded-full font-semibold text-white"
        style={{ backgroundColor: color, fontSize: size * 0.42 }}
      >
        {initial}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full border-2 border-white dark:border-slate-900 ${
            online ? "bg-emerald-500" : "bg-slate-400"
          }`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
