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
  isAuthenticated: boolean;
  _hasHydrated: boolean;
  isSessionChecked: boolean;
  setAuth: (user: User, accessToken: string, refreshToken?: string) => void;
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
  setSessionChecked: (state: boolean) => void;
  getDashboardPath: () => string;
  getReportPath: () => string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      _hasHydrated: false,
      isSessionChecked: false,
      setAuth: (user, accessToken) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("accessToken", accessToken);
        }
        set({
          user,
          isAuthenticated: true,
          isSessionChecked: true,
        });
      },
      setUser: (user) => set({ user }),
      clearAuth: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
        }
        set({
          user: null,
          isAuthenticated: false,
          isSessionChecked: true,
        });
        // Also clear UI cache on logout
        useUICacheStore.getState().clearCache();
      },
      setHasHydrated: (state) => set({ _hasHydrated: state }),
      setSessionChecked: (state) => set({ isSessionChecked: state }),
      getDashboardPath: () => {
        const { user } = get();
        if (!user) return "/";
        if (user.role === "USER") return "/customer";
        if (user.role === "SUPPORT_AGENT") return "/employee/support-agent";
        if (user.role === "ADMIN") return "/employee/admin";
        if (user.role === "SALES") return "/employee/sales";
        return "/";
      },
      getReportPath: () => {
        const { user, isAuthenticated } = get();
        if (!isAuthenticated || !user) return "/auth/login?redirect=report";
        if (user.role === "USER") return "/customer/raise-new-ticket";
        if (user.role === "SUPPORT_AGENT") return "/employee/support-agent/raise-new-ticket";
        if (user.role === "ADMIN") return "/employee/admin/raise-new-ticket";
        if (user.role === "SALES") return "/employee/sales/raise-ticket";
        return "/";
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      version: 3,
      migrate: (persistedState, version) => {
        const persisted = persistedState as any;

        return {
          user: persisted?.user ?? null,
          isAuthenticated: persisted?.isAuthenticated ?? false,
          isSessionChecked: false,
          _hasHydrated: false,
        } as any;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
