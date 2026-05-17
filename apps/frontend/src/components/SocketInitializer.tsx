"use client";

import { useEffect } from "react";
import { refreshToken } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";

export const SocketInitializer = () => {
  const {
    isAuthenticated,
    accessToken,
    _hasHydrated,
    isSessionChecked,
    clearAuth,
    setSessionChecked,
  } = useAuthStore();
  const { connect, disconnect, updateToken } = useSocketStore();

  useEffect(() => {
    if (!_hasHydrated || isSessionChecked) return;

    let isActive = true;

    const restoreSession = async () => {
      try {
        const data = await refreshToken();

        if (!isActive) return;

        if (!data?.data?.accessToken) {
          clearAuth();
        }
      } catch (error) {
        console.error("[AUTH] Session restore failed:", error);
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

    if (isAuthenticated && accessToken) {
      connect(accessToken);
      updateToken(accessToken);
    } else {
      disconnect();
    }
  }, [
    accessToken,
    connect,
    disconnect,
    isAuthenticated,
    isSessionChecked,
    updateToken,
    _hasHydrated,
  ]);

  return null; // This component doesn't render anything
};
