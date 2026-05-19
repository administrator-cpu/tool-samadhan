"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    toast.error("Public registration is disabled. Please contact an administrator.");
    router.replace("/auth/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
        <p className="text-sm font-medium text-slate-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
