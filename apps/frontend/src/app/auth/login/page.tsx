"use client";

import Link from "next/link";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Lock, Mail, Loader2 } from "lucide-react";
import icon from "@/assets/Samadhan-Logo.png";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const {
    setAuth,
    isAuthenticated,
    _hasHydrated,
    isSessionChecked,
    getDashboardPath,
  } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && isSessionChecked && isAuthenticated) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, isSessionChecked, _hasHydrated, router, getDashboardPath]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
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
    // Clear error when user starts typing
    if (errors[e.target.name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [e.target.name]: undefined }));
    }
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
      
      const dashboardPath = user.role === "USER" ? "/customer" : "/employee";
      router.push(dashboardPath);
    } catch (error: any) {
      console.error("Login error:", error);
      // Detailed error logging would go here (Grafana Loki etc.)
      const message = error.message || "Invalid credentials. Please try again.";
      toast.error(message);
      
      if (message.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (message.toLowerCase().includes("password")) {
        setErrors(prev => ({ ...prev, password: message }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 antialiased selection:bg-indigo-200 selection:text-indigo-900`}>
      
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-40">
        <div className="absolute -left-40 -top-40 h-[800px] w-[800px] rounded-full bg-indigo-300/30 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-500/10 blur-[100px] mix-blend-multiply" />
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
                  className={`w-full rounded-lg border ${errors.email ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-indigo-700 focus:ring-indigo-700'} bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-1`}
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
                  className="text-sm font-medium text-emerald-700 transition hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full rounded-lg border ${errors.password ? 'border-red-500 focus:ring-red-200' : 'border-slate-300 focus:border-indigo-700 focus:ring-indigo-700'} bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-1`}
                />
              </div>
              {errors.password && (
                <p className="text-xs font-medium text-red-500 ml-1">{errors.password}</p>
              )}
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-xs font-semibold uppercase tracking-widest text-white shadow-lg shadow-emerald-700/20 transition duration-200 hover:bg-emerald-800 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
