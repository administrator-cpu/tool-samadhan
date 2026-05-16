"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useSocketStore } from "@/store/useSocketStore";

export const SocketInitializer = () => {
  const { isAuthenticated, accessToken, _hasHydrated } = useAuthStore();
  const { connect, disconnect, updateToken } = useSocketStore();

  useEffect(() => {
    if (!_hasHydrated) return;

    if (isAuthenticated && accessToken) {
      connect(accessToken);
    } else if (_hasHydrated && !isAuthenticated) {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect, _hasHydrated]);

  useEffect(() => {
    if (isAuthenticated && accessToken) {
      updateToken(accessToken);
    }
  }, [accessToken, isAuthenticated, updateToken]);

  return null; // This component doesn't render anything
};
