import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";
import { useAuthStore } from "../store/authStore";

export function RegisterPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [form, setForm] = useState({
    username: "",
    email: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { user, accessToken } = await register(form);
      setSession(user, accessToken);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(
        err?.response?.data?.details?.fieldErrors
          ? Object.values(err.response.data.details.fieldErrors).flat().join(", ")
          : (err?.response?.data?.error ?? "Не удалось зарегистрироваться"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg dark:bg-slate-900">
        <h1 className="mb-1 text-2xl font-bold text-slate-900 dark:text-white">
          Создать аккаунт
        </h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Присоединяйтесь и начните общаться
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label
              htmlFor="displayName"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Отображаемое имя
            </label>
            <input
              id="displayName"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.displayName}
              onChange={update("displayName")}
              required
              autoFocus
            />
          </div>
          <div>
            <label
              htmlFor="username"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Имя пользователя
            </label>
            <input
              id="username"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.username}
              onChange={update("username")}
              required
              pattern="[a-zA-Z0-9_]{3,24}"
              title="3-24 символа: буквы, цифры, подчёркивание"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.email}
              onChange={update("email")}
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              value={form.password}
              onChange={update("password")}
              required
              minLength={8}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Создаём..." : "Зарегистрироваться"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          Уже есть аккаунт?{" "}
          <Link to="/login" className="font-medium text-indigo-600 hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}
