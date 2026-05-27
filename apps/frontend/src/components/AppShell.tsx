"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import SidebarNavbar from "@/components/SideBarNavbar";
import ForcePasswordChange from "@/components/ForcePasswordChange";
import { Loader2 } from "lucide-react";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const {
    isAuthenticated,
    user,
    _hasHydrated,
    isSessionChecked,
    getDashboardPath,
  } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!_hasHydrated || !isSessionChecked || !isMounted) return;

    const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/logout"];
    const isPublicRoute = publicRoutes.includes(pathname);
    const isDashboardRoute = pathname.startsWith("/customer") || pathname.startsWith("/employee") || pathname.startsWith("/profile");

    if (isAuthenticated && user) {
      // If logged in and on a public route, redirect to dashboard
      if (isPublicRoute) {
        router.replace(getDashboardPath());
        return;
      }

      // RBAC: If agent/admin tries to access customer routes, redirect back
      if (user.role !== "USER" && pathname.startsWith("/customer")) {
        console.warn("[RBAC] Employee attempted to access customer route. Redirecting...");
        router.replace(getDashboardPath());
        return;
      }

      // RBAC: If customer tries to access employee routes, redirect back
      if (user.role === "USER" && pathname.startsWith("/employee")) {
        console.warn("[RBAC] Customer attempted to access employee route. Redirecting...");
        router.replace(getDashboardPath());
        return;
      }
    } else if (!isAuthenticated) {
      // If not logged in and trying to access dashboard routes, redirect to home
      if (isDashboardRoute) {
        router.replace("/");
      }
    }
  }, [
    isAuthenticated,
    isSessionChecked,
    _hasHydrated,
    isMounted,
    pathname,
    router,
    getDashboardPath,
    user,
  ]);

  // Prevent flash of unauthenticated content during hydration
  // EXCEPT on the home page, where we want immediate visibility
  if ((!_hasHydrated || !isSessionChecked || !isMounted) && pathname !== "/") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If authenticated, we show the Sidebar Layout for ALL pages (except if we are currently redirecting)
  if (isAuthenticated && isMounted) {
    // Force password change if required
    if (user?.must_change_password) {
      return <ForcePasswordChange />;
    }

    // Hide sidebar for standalone share routes
    if (pathname.startsWith("/share/image")) {
      return <>{children}</>;
    }

    return (
      <div className="flex h-screen w-full overflow-hidden">
        <SidebarNavbar />
        <main className="flex-1 overflow-y-auto bg-[#f6f6f8] text-slate-900">
          {children}
        </main>
      </div>
    );
  }

  // Default layout for unauthenticated users
  const isDashboardRoute = pathname.startsWith("/customer") || pathname.startsWith("/employee") || pathname.startsWith("/profile");

  if (!isAuthenticated && isDashboardRoute && isMounted) {
    return null;
  }

  return <>{children}</>;
}
