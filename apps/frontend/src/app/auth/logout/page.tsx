"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const performLogout = async () => {
      try {
        await api.post("/logout");
      } catch (err) {
        // Silently fail logout API if already expired
      } finally {
        clearAuth();
        toast.success("You have been logged out.");
        router.push("/auth/login");
      }
    };

    performLogout();
  }, [clearAuth, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      <p className="text-slate-600 font-medium animate-pulse">Logging you out securely...</p>
    </div>
  );
}