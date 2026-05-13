"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuthStore } from "@/store/useAuthStore";
import { ArrowRight, Loader2, User, Mail, Lock } from "lucide-react";
import icon from "@/assets/Samadhan-Logo.png";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth, isAuthenticated, _hasHydrated, getDashboardPath } = useAuthStore();

  // 49 block L

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, _hasHydrated, router, getDashboardPath]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const newErrors: { name?: string; email?: string; password?: string } = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    }

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
      const response = await api.post("/register", formData);
      const { user, accessToken } = response.data;

      setAuth(user, accessToken);
      toast.success("Account created successfully!");
      const dashboardPath = user.role === "USER" ? "/customer" : "/employee";
      router.push(dashboardPath);
    } catch (error: any) {
      console.error("Signup error:", error);
      const message = error.message || "Failed to create account. Please try again.";
      toast.error(message);
      
      if (message.toLowerCase().includes("email")) {
        setErrors(prev => ({ ...prev, email: message }));
      } else if (message.toLowerCase().includes("password")) {
        setErrors(prev => ({ ...prev, password: message }));
      } else if (message.toLowerCase().includes("name")) {
        setErrors(prev => ({ ...prev, name: message }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row bg-slate-50 text-slate-900">
      {/* Left Visual Pane */}
      <div className="relative hidden md:block md:w-1/2 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=2070"
          alt="Abstract connectivity background"
          fill
          priority
          className="object-cover opacity-80 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 to-indigo-700/20" />
      </div>

      {/* Right Form Pane */}
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-8 py-10 md:w-1/2 lg:px-24">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex items-center justify-center">
                <Image src={icon} alt="Samadhan Icon" width={40} height={40} />
              </div>

              <span className="text-2xl font-bold tracking-tight text-emerald-700">
                Samadhan
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Create Account
            </h1>

            <p className="text-slate-500">
              Enter your details to access your ISP Support Portal.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Full Name */}
            <InputField
              label="Full Name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              icon={<User className="h-5 w-5" />}
            />

            {/* Email */}
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              icon={<Mail className="h-5 w-5" />}
            />

            {/* Password */}
            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              icon={<Lock className="h-5 w-5" />}
            />

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-lg transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-6 text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-indigo-700 hover:underline"
              >
                Log in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

type InputFieldProps = {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  required?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: React.ReactNode;
  error?: string;
};

function InputField({
  label,
  name,
  type,
  placeholder,
  value,
  required,
  onChange,
  icon,
  error,
}: InputFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={name}
        className="block text-xs font-semibold uppercase tracking-wider text-slate-500"
      >
        {label}
      </label>

      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={`w-full rounded-lg border ${error ? 'border-red-500 focus:ring-red-200' : 'border-slate-200 focus:border-indigo-600 focus:ring-indigo-100'} bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:ring-2`}
        />
      </div>
      {error && (
        <p className="text-xs font-medium text-red-500 ml-1">{error}</p>
      )}
    </div>
  );
}