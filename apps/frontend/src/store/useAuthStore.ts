import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useUICacheStore } from "./useUICacheStore";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  must_change_password?: boolean;
  specialties?: string[];
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
  getDashboardPath: () => string;
  getReportPath: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      _hasHydrated: false,
      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
        }),
      setUser: (user) => set({ user }),
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        });
        // Also clear UI cache on logout
        useUICacheStore.getState().clearCache();
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      getDashboardPath: () => {
        const { user } = get();
        if (!user) return "/";
        if (user.role === "USER") return "/customer";
        if (user.role === "SUPPORT_AGENT") return "/employee/support-agent";
        if (user.role === "ADMIN") return "/employee/admin";
        return "/";
      },
      getReportPath: () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return "/auth/login?redirect=report";
        if (user.role === "USER") return "/customer/raise-new-ticket";
        if (user.role === "SUPPORT_AGENT") return "/employee/support-agent/raise-new-ticket";
        if (user.role === "ADMIN") return "/employee/admin/raise-new-ticket";
        return "/";
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        _hasHydrated: state._hasHydrated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
