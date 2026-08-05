import { useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { fetchMe } from "../api/auth";
import { refreshAccessToken } from "../api/client";

export function useAuthInit() {
  const { setSession, setInitialized, isInitialized } = useAuthStore();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const token = await refreshAccessToken();
      if (token && !cancelled) {
        try {
          const user = await fetchMe();
          if (!cancelled) setSession(user, token);
        } catch {
          // refresh succeeded but profile fetch failed; leave logged out
        }
      }
      if (!cancelled) setInitialized(true);
    }
    init();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isInitialized;
}
