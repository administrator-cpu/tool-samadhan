"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Mail, KeyRound, Loader2 } from "lucide-react";
import icon from "@/assets/Samadhan-Logo.png";
import Image from "next/image";

export default function GuestLoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<"SEND_OTP" | "VERIFY_OTP">("SEND_OTP");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post("/guest/send-otp", { email });
      toast.success("OTP sent! Please check your email.");
      setStep("VERIFY_OTP");
    } catch (error: any) {
      toast.error(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post("/guest/verify-otp", { email, otpCode });
      const { accessToken } = response.data;
      
      // Save the guest token
      setAuth({ id: "0", name: "Guest", email, role: "GUEST" } as any, accessToken);
      toast.success("Verified successfully!");
      router.push("/guest/verify-circuit");
    } catch (error: any) {
      toast.error(error.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 antialiased selection:bg-primary selection:text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -left-40 -top-40 h-[800px] w-[800px] rounded-full bg-[#F5821F]/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#D9430F]/20 blur-[100px] mix-blend-multiply" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200/70 bg-white p-10 shadow-[0_10px_40px_-10px_rgba(42,20,180,0.08)]">
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center">
              <Image src={icon} alt="icon" width={60} height={60} />
            </div>

            <h1 className="mb-2 text-3xl font-bold tracking-tight text-slate-900 font-heading">
              Guest Access
            </h1>
            <p className="text-slate-500 font-body">
              {step === "SEND_OTP" ? "Enter your email to receive a verification code" : "Enter the verification code sent to your email"}
            </p>
          </div>

          {step === "SEND_OTP" ? (
            <form onSubmit={handleSendOtp} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-900">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-slate-300 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-ember/20 transition duration-200 hover:bg-brand-gradient-hover active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Send OTP</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="otp" className="text-sm font-medium text-slate-900">Verification Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full rounded-lg border border-slate-300 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-ember/20 transition duration-200 hover:bg-brand-gradient-hover active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><ArrowRight className="h-4 w-4" /> Verify OTP</>}
              </button>

              <button
                type="button"
                onClick={() => setStep("SEND_OTP")}
                className="mt-1 text-sm font-medium text-slate-500 hover:text-slate-800 transition text-center"
              >
                Change Email
              </button>
            </form>
          )}

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <Link href="/auth/login" className="text-sm font-medium text-slate-600 hover:text-primary transition">
              Already have an account? <span className="text-primary underline underline-offset-4 font-semibold">Sign In</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
