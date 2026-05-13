"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gauge, ShieldCheck, Eye } from "lucide-react";
import SamadhanLogo from "../assets/Samadhan-Logo.png";
import TicketWorkflowStepper from "../components/TicketWorkflowStepper";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomeClient() {
  const { isAuthenticated, getDashboardPath, getReportPath, _hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, _hasHydrated, router, getDashboardPath]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-emerald-700 selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="group flex flex-row justify-center cursor-pointer items-center gap-3">
            <div className="h-8 w-8 text-emerald-700 transition-transform group-hover:scale-105">
              <Image src={SamadhanLogo} alt="Samadhan Logo" width={60} height={60}/>
            </div>
            <span className="text-2xl font-bold tracking-tight">Samadhan</span>
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-full bg-emerald-700 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Login
          </Link>
        </div>
      </nav>

      <main>
        {/* Abstract background elements */}
        <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[5%] w-[70%] h-[70%] opacity-100 blur-[120px] rounded-full bg-gradient-to-br from-primary via-emerald-100 to-transparent animate-pulse"></div>
          <div className="absolute -top-[5%] -right-[5%] w-[70%] h-[70%] opacity-100 blur-[100px] rounded-full bg-gradient-to-bl from-indigo-300 via-purple-50 to-transparent animate-pulse"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] opacity-100 blur-[80px] rounded-full bg-gradient-to-tr from-tertiary-fixed via-primary-fixed-dim to-transparent animate-pulse"></div>
        </div>

        {/* Hero */}
        <section className="relative mx-auto max-w-7xl z-10 px-4 pb-20 pt-32 text-center sm:px-6 lg:px-8 lg:pb-32 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute left-1/2 top-[-50%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-emerald-700 to-indigo-300 opacity-10 blur-3xl" />
          </div>

          <div className="fade-in-up mx-auto max-w-4xl">
            <h1 className="mb-8 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Help is on the way in under{" "}
              <span className="relative inline-block text-emerald-700">
                30 seconds.
                <svg
                  className="absolute -bottom-1 left-0 h-3 w-full text-indigo-200"
                  preserveAspectRatio="none"
                  viewBox="0 0 100 10"
                >
                  <path
                    d="M0 5 Q 50 12 100 5"
                    fill="transparent"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                </svg>
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-slate-500 sm:text-xl">
              Samadhan is the organic bridge between technical infrastructure and human connection. We get you from &quot;my internet is down&quot; to &quot;fixing it&quot; instantly.
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href={getReportPath()}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-8 py-4 text-lg font-medium text-white transition hover:-translate-y-0.5 hover:bg-emerald-800 sm:w-auto"
              >
                Report an Issue
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/dashboard"
                className="w-full rounded-full border border-slate-200 bg-white px-8 py-4 text-lg font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
              >
                Login to Dashboard
              </Link>
            </div>
          </div>
        </section>

        <TicketWorkflowStepper />

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="fade-in-up mb-16 text-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Designed for peace of mind
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Support Speed",
                desc: "No more waiting on hold. Submit your issue in under 30 seconds and our automated systems immediately begin diagnostics.",
                icon: Gauge,
              },
              {
                title: "Total Accountability",
                desc: "Every ticket is tied to a strict Service Level Agreement (SLA). If we don't fix it in time, it escalates automatically.",
                icon: ShieldCheck,
              },
              {
                title: "Real-Time Visibility",
                desc: "Stop wondering what's happening. See exactly who is working on your issue and view live timeline updates on your dashboard.",
                icon: Eye,
              },
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-slate-100 bg-white p-8 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-emerald-700">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                  <p className="leading-relaxed text-slate-500">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-4 mb-8 mt-12 max-w-7xl sm:mx-6 lg:mx-8 xl:mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] bg-emerald-700 px-6 py-16 text-center shadow-2xl sm:p-20">
            <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-900/50 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
                Ready to get your connection sorted?
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-emerald-100 sm:text-xl">
                Don't let a drop in connection ruin your day. Report the issue now and let our automated hub do the heavy lifting.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={getReportPath()}
                  className="w-full rounded-full bg-white px-8 py-4 text-lg font-bold text-emerald-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Report an Issue Now
                </Link>
                <Link
                  href="/dashboard"
                  className="w-full rounded-full border border-emerald-400 px-8 py-4 text-lg font-medium text-white transition hover:bg-emerald-800 sm:w-auto"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-12 text-center text-sm text-slate-500">
        <p>© 2026 Samadhan App. All rights reserved.</p>
      </footer>
    </div>
  );
}
