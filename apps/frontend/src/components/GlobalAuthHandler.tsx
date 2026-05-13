"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";

export default function GlobalAuthHandler() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const handleExpiry = () => {
      console.log("[GlobalAuthHandler] Session expired event received.");
      clearAuth();
      toast.error("Session Expired", {
        description: "Your session has expired. Please login again.",
        duration: 5000,
      });
      router.push("/auth/login");
    };

    window.addEventListener("auth-session-expired", handleExpiry);
    return () => window.removeEventListener("auth-session-expired", handleExpiry);
  }, [router, clearAuth]);

  return null;
}
