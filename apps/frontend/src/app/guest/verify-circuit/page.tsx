"use client";

import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Loader2, Network } from "lucide-react";

export default function VerifyCircuitPage() {
  const router = useRouter();
  const { isAuthenticated, user, _hasHydrated, getDashboardPath } = useAuthStore();
  const [circuitId, setCircuitId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (_hasHydrated) {
      if (!isAuthenticated) {
        router.replace("/guest/login");
      } else if (user?.role !== "GUEST") {
        router.replace(getDashboardPath());
      }
    }
  }, [isAuthenticated, user, _hasHydrated, router]);

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!circuitId.trim()) {
      toast.error("Please enter a Circuit ID");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.get(`/guest/circuit/verify?circuitId=${encodeURIComponent(circuitId)}`);
      
      if (response.data?.exists) {
        toast.success("Circuit verified successfully!");
        // Store in sessionStorage so next page can pick it up
        sessionStorage.setItem("guest_circuitId", circuitId);
        sessionStorage.setItem("guest_customerName", response.data.customerName || "");
        router.push("/guest/raise-ticket");
      } else {
        toast.error("Circuit ID not found. Please check and try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to verify circuit. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!_hasHydrated) return null;

  return (
    <div className="min-h-screen bg-slate-50 antialiased selection:bg-primary selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -left-40 -top-40 h-[800px] w-[800px] rounded-full bg-[#F5821F]/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#D9430F]/20 blur-[100px] mix-blend-multiply" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200/70 bg-white p-10 shadow-[0_10px_40px_-10px_rgba(42,20,180,0.08)]">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Network className="h-6 w-6" />
            </div>

            <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-900 font-heading">
              Verify Circuit
            </h1>
            <p className="text-sm text-slate-500 font-body">
              Please enter your Circuit ID to proceed
            </p>
          </div>

          <form onSubmit={handleVerify} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="circuitId" className="text-sm font-medium text-slate-900">Circuit ID</label>
              <div className="relative">
                <input
                  id="circuitId"
                  type="text"
                  value={circuitId}
                  onChange={(e) => setCircuitId(e.target.value)}
                  placeholder="e.g. FAB000000000000"
                  className="w-full rounded-lg border border-slate-300 bg-white py-4 px-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary uppercase"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-ember/20 transition duration-200 hover:bg-brand-gradient-hover active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Verify Circuit</>}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
