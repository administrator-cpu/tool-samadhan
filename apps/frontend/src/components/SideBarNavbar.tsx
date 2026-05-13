"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import SamadhanIcon from "@/assets/Samadhan-Logo.png";
import { useAuthStore } from "@/store/useAuthStore";
import { toast } from "sonner";
import { api } from "@/lib/api";

interface SidebarContentProps {
  collapsed: boolean;
  mobile: boolean;
}

const SidebarNavbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await api.post("/logout");
    } catch (err) {
      // Ignore
    } finally {
      clearAuth();
      toast.success("Logged out successfully");
      router.push("/");
    }
  };

  type UserRole = "USER" | "SUPPORT_AGENT" | "ADMIN";
  
  type NavItem = {
    label: string;
    icon: string;
    href: string;
  };
  
  
  const customerItems: NavItem[] = [
    { label: "Dashboard", icon: "home", href: "/customer" },
    { label: "Raise Ticket", icon: "report", href: "/customer/raise-new-ticket" },
    { label: "My Tickets", icon: "confirmation_number", href: "/customer/tickets" },
    { label: "Help Center", icon: "question_answer", href: "/customer/help-center" },
    { label: "Profile", icon: "person", href: "/profile" },
  ];
  
  const employeeItems: NavItem[] = [
    { label: "Dashboard", icon: "dashboard", href: "/employee/support-agent" },
    { label: "All Tickets", icon: "list_alt", href: "/employee/support-agent/tickets" },
    { label: "Help Center", icon: "support", href: "/employee/support-agent/help-center" },
    { label: "Profile", icon: "person", href: "/profile" },
  ];
  
  const employeeAdminItems: NavItem[] = [
    { label: "Dashboard", icon: "dashboard", href: "/employee/admin" },
    { label: "All Tickets", icon: "list_alt", href: "/employee/admin/tickets" },
    { label: "Staff", icon: "badge", href: "/employee/admin/staff" },
    { label: "Resolution Log", icon: "history_edu", href: "/employee/admin/reports/resolved" },
    { label: "Help Center", icon: "support", href: "/employee/admin/help-center" },
    { label: "Profile", icon: "person", href: "/profile" },
  ];
  
  const roleNavMap: Record<string, NavItem[]> = {
    USER: customerItems,
    SUPPORT_AGENT: employeeItems,
    MANAGER: employeeItems,
    ADMIN: employeeAdminItems,
  };
  
  const navItems = user?.role && roleNavMap[user.role]
    ? roleNavMap[user.role]
    : customerItems;

  // if (user?.role === "ADMIN") {
  //   navItems.splice(2, 0, { label: "Staff", icon: "badge", href: "/employee/admin/staff" });
  // }

  const SidebarContent = ({ collapsed, mobile }: SidebarContentProps) => (
    <div className={`flex h-full flex-col ${mobile ? "p-6" : "p-4 md:p-6 lg:p-3"}`}>
      {/* Logo */}
      <div className="mb-5 flex flex-col items-center gap-0 overflow-hidden ">
        <Image
          src={SamadhanIcon}
          alt="Samadhan-Logo"
          width={50}
          height={50}
          className={`${mobile ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto"} ${
            collapsed && !mobile ? "pt-8 -mb-5" : ""
          } transition-all duration-300`}
        />
        <h2
          className={`${
            collapsed && !mobile ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto"
          } transition-all duration-300 text-slate-900 text-2xl font-bold tracking-tight pt-1`}
        >
          Samadhan
        </h2>

        {mobile && (
          <button
            onClick={() => setIsMobileOpen(false)}
            className="ml-auto md:hidden text-slate-400 hover:text-slate-600"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group flex items-center gap-2 rounded-lg px-3 py-3 transition-colors ${
                isActive ? "bg-indigo-50" : "hover:bg-slate-50"
              }`}
            >
              <div
                className={`transition-colors shrink-0 ${
                  isActive ? "text-[#2513ec]" : "text-slate-500 group-hover:text-[#2513ec]"
                } flex items-center`}
              >
                <span className={`material-symbols-outlined block ${isActive ? "icon-active" : ""}`}>
                  {item.icon}
                </span>
              </div>
              <p
                className={`${
                  collapsed && !mobile ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto"
                } text-sm leading-normal transition-all duration-300 whitespace-nowrap ${
                  isActive ? "font-semibold text-[#2513ec]" : "font-medium text-slate-500 group-hover:text-slate-900"
                }`}
              >
                {item.label}
              </p>
            </Link>
          );
        })}
      </nav>

      {/* Profile Info & Logout */}
      <div className="mt-auto flex flex-col gap-3 border-t border-slate-100 pt-6 overflow-hidden">

        <Link href="/profile" className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-slate-50" >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div className={`${collapsed && !mobile ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto"} flex flex-col min-w-0 transition-all duration-300`}
          >
            <span className="text-sm font-semibold text-slate-900 truncate">{user?.name}</span>
            <span className="text-xs font-medium text-slate-500 truncate uppercase">
              {user?.role === "USER" ? "Customer" : user?.role.replace("_", " ")}
            </span>
          </div>
        </Link>
        
        {/* <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <span className="material-symbols-outlined">person</span>
          </div>
          <div
            className={`${
              collapsed && !mobile ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto"
            } flex flex-col min-w-0 transition-all duration-300`}
          >
            <span className="text-sm font-semibold text-slate-900 truncate">{user?.name}</span>
            <span className="text-xs font-medium text-slate-500 truncate uppercase">
              {user?.role === "USER" ? "Customer" : user?.role.replace("_", " ")}
            </span>
          </div>
        </div> */}

        <button
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-3 text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <span className="material-symbols-outlined shrink-0">logout</span>
          <span
            className={`${
              collapsed && !mobile ? "opacity-0 invisible w-0" : "opacity-100 visible w-auto"
            } text-sm font-medium transition-all duration-300`}
          >
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="md:hidden fixed top-4 left-4 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-600 shadow-sm"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>
      </div>

      {/* Mobile Sidebar (Drawer) */}
      <div
        className={`md:hidden fixed inset-0 z-50 transition-visibility duration-300 ${
          isMobileOpen ? "visible" : "invisible"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsMobileOpen(false)}
        />
        {/* Panel */}
        <aside
          className={`absolute top-0 left-0 h-full w-[280px] bg-white transition-transform duration-300 ease-in-out transform ${
            isMobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent mobile={true} collapsed={false} />
        </aside>
      </div>

      {/* Desktop Sidebar (Persistent) */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? "w-[73px]" : "w-[240px]"
        } shrink-0 flex-col border-r border-slate-200 bg-white h-screen sticky top-0 transition-all duration-300 ease-in-out relative z-40`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-28 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-transform hover:text-[#2513ec] z-10"
        >
          <span
            className={`material-symbols-outlined text-sm transition-transform duration-300 ${
              isCollapsed ? "rotate-180" : ""
            }`}
          >
            chevron_left
          </span>
        </button>
        <SidebarContent mobile={false} collapsed={isCollapsed} />
      </aside>
    </>
  );
};

export default SidebarNavbar;
