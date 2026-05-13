"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from "lucide-react";

export default function ForcePasswordChange() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, setUser } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await api.post("/change-password", { newPassword });
      toast.success("Password updated successfully!");
      
      // Update local state to reflect that password has been changed
      if (user) {
        setUser({ ...user, must_change_password: false });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-[1rem] bg-white shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="bg-indigo-700 p-10 text-white relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xl">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Secure Your Account</h2>
            <p className="text-indigo-100 font-medium opacity-90 max-w-xs">
              This is your first login. For security, please set a new permanent password to continue.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-6">
          <div className="space-y-4">
            <div className="group space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">New Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-12 text-sm font-bold text-slate-900 transition-all outline-hidden focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5"
                  placeholder="Create a strong password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="group space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-300 transition-colors group-focus-within:text-indigo-600" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-14 w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 text-sm font-bold text-slate-900 transition-all outline-hidden focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/5"
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="group flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-indigo-700 text-sm font-black text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-800 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <>
                  Set New Password
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            <p className="mt-6 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Minimum 8 characters &bull; Mixed case &bull; Symbols
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
