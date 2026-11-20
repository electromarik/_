import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isInitialized: boolean;
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string | null) => void;
  setInitialized: (value: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isInitialized: false,
  setSession: (user, accessToken) => set({ user, accessToken }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setInitialized: (value) => set({ isInitialized: value }),
  clear: () => set({ user: null, accessToken: null }),
}));
