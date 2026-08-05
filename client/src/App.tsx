import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { useAuthInit } from "./hooks/useAuthInit";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChatPage } from "./pages/ChatPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const isInitialized = useAuthInit();

  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Загрузка...
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
