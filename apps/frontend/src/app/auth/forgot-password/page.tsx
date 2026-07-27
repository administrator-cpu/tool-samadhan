"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Mail, Lock, Key, ArrowLeft, ArrowRight, Loader2, RefreshCcw, ShieldCheck } from "lucide-react";
import Image from "next/image";
import icon from "@/assets/Samadhan-Logo.png";

type Step = "EMAIL" | "OTP" | "PASSWORD";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("EMAIL");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [passwords, setPasswords] = useState({ new: "", confirm: "" });
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  // Timer for resend OTP
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return toast.error("Please enter your email address");
    
    setIsLoading(true);
    try {
      const res = await api.post("/forgot-password", { email });
      const data = res.data || {};
      
      if (data.alreadySent) {
        toast.success(res.message || "OTP already sent. Please check your email.");
        setResendTimer(data.remainingSeconds || 120);
      } else {
        toast.success("Verification code sent to your email!");
        setResendTimer(120); // 2 minute buffer
      }
      setStep("OTP");
    } catch (error: any) {
      toast.error(error.message || "Failed to send verification code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) return toast.error("Please enter the full 6-digit code");

    setIsLoading(true);
    try {
      await api.post("/verify-otp", { email, otpCode });
      toast.success("Code verified successfully!");
      setStep("PASSWORD");
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new.length < 8) return toast.error("Password must be at least 8 characters");
    if (passwords.new !== passwords.confirm) return toast.error("Passwords do not match");

    setIsLoading(true);
    try {
      await api.post("/reset-password", { 
        email, 
        otpCode, 
        newPassword: passwords.new 
      });
      toast.success("Password reset successful! Please login with your new password.");
      router.push("/auth/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = otpCode.split("");
    newOtp[index] = value.slice(-1);
    const updatedOtp = newOtp.join("");
    setOtpCode(updatedOtp);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = otpCode.split("");
      newOtp[index - 1] = "";
      setOtpCode(newOtp.join(""));
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      setOtpCode(pasted);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  const renderStep = () => {
    switch (step) {
      case "EMAIL":
        return (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-sm font-bold text-slate-700">Account Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-hidden font-medium"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:translate-y-0"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Send Verification Code <ArrowRight size={18} /></>}
            </button>
          </form>
        );

      case "OTP":
        return (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 text-center">
                <label className="text-sm font-bold text-slate-700">Enter OTP Code</label>
                {/* <p className="text-xs font-bold text-slate-500">Code sent to: <span className="text-emerald-600">{email}</span></p> */}
              </div>
              <div className="flex justify-center gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otpCode[index] || ""}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-slate-200 bg-white text-center text-2xl font-black text-slate-900 focus:border-slate-500 focus:ring-4 focus:ring-slate-500/20 transition-all outline-hidden shadow-sm focus:shadow-md"
                    required
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify Code"}
            </button>

            <div className="text-center">
              {resendTimer > 0 ? (
                <p className="text-xs font-bold text-slate-400">Resend code in {resendTimer}s</p>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="flex items-center justify-center gap-2 mx-auto text-xs font-black text-emerald-600 hover:text-emerald-700 transition-colors"
                >
                  <RefreshCcw size={14} /> Resend Code
                </button>
              )}
            </div>
          </form>
        );

      case "PASSWORD":
        return (
          <form onSubmit={handleResetPassword} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                  <input
                    type="password"
                    placeholder="Min. 8 characters"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-hidden font-medium"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-slate-700">Confirm New Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-emerald-600" />
                  <input
                    type="password"
                    placeholder="Confirm your new password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-hidden font-medium"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Reset My Password"}
            </button>
          </form>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-50 blur-[120px]" />
      </div>

      <div className="w-full max-w-[480px] relative">
        <div className="bg-white rounded-[30px] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 md:p-12">
          {/* Brand */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="mb-6 inline-flex items-center justify-center p-4 bg-emerald-50 rounded-2xl">
              <Image src={icon} alt="Samadhan" width={48} height={48} />
            </div>
            <h1 className="text-3xl font-black text-slate-900 font-heading tracking-tight mb-2">
              {step === "EMAIL" ? "Forgot Password?" : step === "OTP" ? "Verify Identity" : "Secure Account"}
            </h1>
            <p className="text-slate-500 font-medium text-sm max-w-[400px]">
              {step === "EMAIL" ? "No worries! Enter your email and we'll send you a verification code." : 
               step === "OTP" ? "Please enter the 6-digit code we sent to your email address." : 
               "Enter a strong new password to regain access to your Samadhan account."}
            </p>
          </div>

          {renderStep()}

          {/* Back to Login */}
          <div className="mt-10 pt-8 border-t border-slate-50 text-center">
            <Link 
              href="/auth/login" 
              className="inline-flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
