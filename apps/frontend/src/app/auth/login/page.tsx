"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Lock, Mail, Loader2, Eye, EyeOff, AlertCircle, AlertTriangle } from "lucide-react";
import icon from "@/assets/Samadhan-Logo.png";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    setAuth,
    clearAuth,
    isAuthenticated,
    _hasHydrated,
    isSessionChecked,
    getDashboardPath,
  } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isSessionChecked && isAuthenticated) {
      if (user?.role === "GUEST") {
        clearAuth();
      } else {
        router.replace(getDashboardPath());
      }
    }
  }, [isAuthenticated, isSessionChecked, _hasHydrated, router, getDashboardPath, user, clearAuth]);

  interface FormErrors {
    email?: string;
    password?: string;
    general?: string;
    isDeactivated?: boolean;
  }

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    // Clear errors when user starts modifying fields
    setErrors((prev) => ({
      ...prev,
      [e.target.name]: undefined,
      general: undefined,
      isDeactivated: undefined,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);

    try {
      const response = await api.post("/login", formData);
      const { user, accessToken } = response.data;

      setAuth(user, accessToken);
      toast.success(`Welcome back, ${user.name}!`);
      const dashboardPath = getDashboardPath();
      router.push(dashboardPath);
    } catch (error: any) {
      console.warn("[AUTH] Login failed:", error?.message || error);
      const message = error?.message || "Invalid credentials. Please try again.";
      toast.error(message);
      
      if (error?.code === "ACCOUNT_INACTIVE" || error?.statusCode === 403) {
        setErrors({
          general: error.message || "Your account has been deactivated. Please contact support.",
          isDeactivated: true,
        });
      } else if (error?.code === "INVALID_CREDENTIALS" || error?.statusCode === 401) {
        setErrors({
          general: "Invalid email or password. Please try again.",
        });
      } else if (message.toLowerCase().includes("email")) {
        setErrors((prev) => ({ ...prev, email: message }));
      } else if (message.toLowerCase().includes("password")) {
        setErrors((prev) => ({ ...prev, password: message }));
      } else {
        setErrors({
          general: message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 antialiased selection:bg-primary selection:text-white`}>
      
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -left-40 -top-40 h-[800px] w-[800px] rounded-full bg-[#F5821F]/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#D9430F]/20 blur-[100px] mix-blend-multiply" />
      </div>

      <main className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-[440px] rounded-3xl border border-slate-200/70 bg-white p-10 shadow-[0_10px_40px_-10px_rgba(42,20,180,0.08)]">
          {/* Header */}
          <div className="mb-12 flex flex-col items-center text-center">
            <div className="mb-6 flex items-center justify-center">
              <Image src={icon} alt="icon" width={60} height={60} />
            </div>

            <h1 className="mb-2 text-4xl font-bold tracking-tight text-slate-900 font-heading">
              Welcome Back
            </h1>

            <p className="text-slate-500 font-body">
              Sign in to continue to Samadhan
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-6">
            {/* General / Deactivation Error Alert Banner */}
            {errors.general && (
              <div
                role="alert"
                className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition-all duration-200 animate-in fade-in slide-in-from-top-1 ${
                  errors.isDeactivated
                    ? "border-amber-200 bg-amber-50/90 text-amber-900"
                    : "border-red-200 bg-red-50/90 text-red-900"
                }`}
              >
                {errors.isDeactivated ? (
                  <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-semibold">
                    {errors.isDeactivated ? "Account Deactivated" : "Sign In Failed"}
                  </p>
                  <p className="mt-0.5 text-xs sm:text-sm leading-relaxed opacity-90">
                    {errors.general}
                  </p>
                  {errors.isDeactivated && (
                    <div className="mt-2 text-xs">
                      <a
                        href="mailto:support@samadhan.com"
                        className="font-medium text-amber-900 underline hover:text-amber-950"
                      >
                        Contact Support &rarr;
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-slate-900"
              >
                Email Address
              </label>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  className={`w-full rounded-lg border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary'} bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-1`}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-medium text-red-500 ml-1">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-900"
                >
                  Password
                </label>

                <Link
                  href="/auth/forgot-password"
                  className="text-sm font-medium text-primary transition hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-primary focus:ring-primary'} bg-white py-4 pl-12 pr-12 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-1`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 transition-all  hover:text-slate-600 focus:outline-none active:scale-95"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-gradient px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-ember/20 transition duration-200 hover:bg-brand-gradient-hover border-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In to Dashboard
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center border-t border-slate-100 pt-6">
            <Link 
              href="/guest/login" 
              className="text-sm font-medium text-slate-600 hover:text-primary transition"
            >
              Want to raise a ticket without an account?<br/><span className="text-primary underline underline-offset-4 font-semibold">Continue as Guest</span>
            </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
