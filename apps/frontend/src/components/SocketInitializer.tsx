"use client";

import { useEffect } from "react";
import { refreshToken } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";

export const SocketInitializer = () => {
  const {
    isAuthenticated,
    _hasHydrated,
    isSessionChecked,
    clearAuth,
    setSessionChecked,
  } = useAuthStore();
  const { connect, disconnect, updateToken } = useSocketStore();

  useEffect(() => {
    if (!_hasHydrated || isSessionChecked) return;

    let isActive = true;

    const isTokenExpired = (token: string): boolean => {
      try {
        const parts = token.split(".");
        if (parts.length !== 3) return true;
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return true;
        return payload.exp * 1000 < Date.now() + 10000; // 10s buffer
      } catch {
        return true;
      }
    };

    const restoreSession = async () => {
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

      if (storedToken && !isTokenExpired(storedToken)) {
        console.log("[AUTH] Access token is still valid. Restoring session.");
        if (isActive) {
          useAuthStore.setState({ isAuthenticated: true });
        }
        setSessionChecked(true);
        return;
      }

      try {
        console.log("[AUTH] Access token missing or expired. Attempting to refresh...");
        const data = await refreshToken();

        if (!isActive) return;

        if (!data?.data?.accessToken) {
          clearAuth();
        }
      } catch (error) {
        console.error("[AUTH] Session restore failed:", error);
        if (isActive) {
          clearAuth();
        }
      } finally {
        if (isActive) {
          setSessionChecked(true);
        }
      }
    };

    restoreSession();

    return () => {
      isActive = false;
    };
  }, [_hasHydrated, isSessionChecked, clearAuth, setSessionChecked]);

  useEffect(() => {
    if (!_hasHydrated || !isSessionChecked) return;

    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

    if (isAuthenticated && token) {
      connect(token);
      updateToken(token);
    } else {
      disconnect();
    }
  }, [
    connect,
    disconnect,
    isAuthenticated,
    isSessionChecked,
    updateToken,
    _hasHydrated,
  ]);

  return null; // This component doesn't render anything
};
