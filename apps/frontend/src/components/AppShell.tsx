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
  const { isAuthenticated, user, _hasHydrated, getDashboardPath } = useAuthStore();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!_hasHydrated || !isMounted) return;

    const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/logout"];
    const isPublicRoute = publicRoutes.includes(pathname);
    const isDashboardRoute = pathname.startsWith("/customer") || pathname.startsWith("/employee") || pathname.startsWith("/profile");

    if (isAuthenticated) {
      // If logged in and on a public route (like / or /auth/login), redirect to dashboard
      if (isPublicRoute) {
        router.replace(getDashboardPath());
      }
    } else {
      // If not logged in and trying to access dashboard routes, redirect to home
      if (isDashboardRoute) {
        router.replace("/");
      }
    }
  }, [isAuthenticated, _hasHydrated, isMounted, pathname, router, getDashboardPath]);

  // Prevent flash of unauthenticated content during hydration
  // EXCEPT on the home page, where we want immediate visibility
  if ((!_hasHydrated || !isMounted) && pathname !== "/") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If authenticated, we show the Sidebar Layout for ALL pages (except if we are currently redirecting)
  // Actually, the user said: "If user is loggedout then show the navbar which in inbuilt in the home page and if user is loggedIn then show them sidebarNavbar"
  
  if (isAuthenticated && isMounted) {
    // Force password change if required
    if (user?.must_change_password) {
      return <ForcePasswordChange />;
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
  // If we are on a dashboard route but not authenticated, return null while redirecting
  const publicRoutes = ["/", "/auth/login", "/auth/signup", "/auth/logout"];
  const isDashboardRoute = pathname.startsWith("/customer") || pathname.startsWith("/employee") || pathname.startsWith("/profile");

  if (!isAuthenticated && isDashboardRoute && isMounted) {
    return null;
  }

  return <>{children}</>;
}
