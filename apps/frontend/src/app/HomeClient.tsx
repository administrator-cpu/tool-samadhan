"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Gauge, ShieldCheck, Eye, Monitor, DownloadCloud, Smartphone } from "lucide-react";
import SamadhanLogo from "../assets/Samadhan-Logo.png";
import TicketWorkflowStepper from "../components/TicketWorkflowStepper";
import { useAuthStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeClient() {
  const {
    isAuthenticated,
    getDashboardPath,
    getReportPath,
    _hasHydrated,
    isSessionChecked,
  } = useAuthStore();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (_hasHydrated && isSessionChecked && isAuthenticated) {
      router.replace(getDashboardPath());
    }
  }, [isAuthenticated, isSessionChecked, _hasHydrated, router, getDashboardPath]);

  // Use a stable path for SSR and initial client render to avoid hydration mismatch
  const reportPath = isMounted ? getReportPath() : "/auth/login?redirect=report";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 antialiased selection:bg-[#D9430F] selection:text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/10 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="group flex flex-row justify-center cursor-pointer items-center gap-3">
            <div className="h-8 w-8 mb-2 text-primary transition-transform group-hover:scale-105">
              <Image src={SamadhanLogo} alt="Samadhan Logo" width={60} height={60}/>
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#F5821F]">Samadhan</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/download"
              className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
            >
              <DownloadCloud size={18} />
              Download Remotix
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center rounded-full bg-brand-gradient px-6 py-2.5 text-sm font-medium text-white transition hover:bg-brand-gradient-hover border-none shadow-sm hover:shadow-md"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* Abstract background elements */}
        <div className="absolute inset-0 z-5 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[5%] w-[70%] h-[70%] opacity-100 blur-[120px] rounded-full bg-gradient-to-br from-[#F5821F] via-[#D9430F]/20 to-transparent animate-pulse"></div>
          <div className="absolute -top-[5%] -right-[5%] w-[70%] h-[70%] opacity-100 blur-[100px] rounded-full bg-gradient-to-bl from-indigo-300 via-purple-50 to-transparent animate-pulse"></div>
          <div className="absolute -bottom-[20%] left-[20%] w-[50%] h-[50%] opacity-100 blur-[80px] rounded-full bg-gradient-to-tr from-tertiary-fixed via-primary-fixed-dim to-transparent animate-pulse"></div>
        </div>

        {/* Hero */}
        <section className="relative mx-auto max-w-7xl z-10 px-4 pb-20 pt-32 text-center sm:px-6 lg:px-8 lg:pb-32 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"> 
            <div className="absolute left-1/2 top-[-50%] h-[1000px] w-[1000px] -translate-x-1/2 rounded-full bg-gradient-to-br from-[#F5821F] to-indigo-300 opacity-5 blur-3xl" />
          </div>

          <div className="fade-in-up mx-auto max-w-4xl">
            <h1 className="mb-8 text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl">
              Help is on the way in under{" "}
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#F5821F] to-amber-500">
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
                href={reportPath}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-brand-gradient border-none px-8 py-4 text-lg font-medium text-white transition hover:-translate-y-0.5 hover:bg-brand-gradient-hover sm:w-auto"
              >
                Report an Issue
                <ArrowRight size={20} />
              </Link>

              <Link
                href="/auth/login"
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
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-primary">
                    <Icon size={28} />
                  </div>
                  <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                  <p className="leading-relaxed text-slate-500">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Download Remotix Section */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl transition-all hover:shadow-2xl">
            {/* Decorative background blurs */}
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#F5821F]/10 blur-3xl pointer-events-none" />
            <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center justify-between gap-10 p-8 sm:p-12 md:flex-row lg:p-16">
              <div className="max-w-xl text-center md:text-left">
                <div className="mb-6 mx-auto md:mx-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#F5821F] shadow-sm ring-1 ring-orange-100/50">
                  <Monitor size={32} />
                </div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Download Remotix
                </h2>
                <p className="text-lg leading-relaxed text-slate-500 sm:text-xl">
                  Access any device instantly. Secure, reliable, and incredibly easy to use. No configuration required for Windows, Mac, or Linux.
                </p>
              </div>
              
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row shrink-0">
                <Link
                  href="/download"
                  className="group flex w-full items-center justify-center gap-3 rounded-xl bg-slate-900 px-8 py-4 text-white shadow-lg transition duration-300 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl sm:w-auto"
                >
                  <DownloadCloud size={24} />
                  <span className="text-lg font-bold tracking-tight">Go to Downloads</span>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-4 mb-8 mt-12 max-w-7xl sm:mx-6 lg:mx-8 xl:mx-auto">
          <div className="relative overflow-hidden rounded-[2rem] bg-brand-gradient px-6 py-16 text-center shadow-2xl sm:p-20">
            <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/3 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-96 w-96 -translate-x-1/3 translate-y-1/3 rounded-full bg-indigo-900/50 blur-3xl" />

            <div className="relative z-10 mx-auto max-w-3xl">
              <h2 className="mb-6 text-4xl font-bold text-white sm:text-5xl">
                Ready to get your connection sorted?
              </h2>
              <p className="mx-auto mb-10 max-w-2xl text-lg text-orange-100 sm:text-xl">
                Don't let a drop in connection ruin your day. Report the issue now and let our automated hub do the heavy lifting.
              </p>
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href={reportPath}
                  className="w-full rounded-full bg-white px-8 py-4 text-lg font-bold text-primary transition hover:bg-slate-50 sm:w-auto"
                >
                  Report an Issue Now
                </Link>
                <Link
                  href="/auth/login"
                  className="w-full rounded-full border border-white px-8 py-4 text-lg font-medium text-white transition hover:bg-white hover:text-primary sm:w-auto"
                >
                  Login to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>




        {/* Download App Section */}
        {/* <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl transition-all hover:shadow-2xl">
             */}
            {/* Decorative background blurs */}
            {/* <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-[#F5821F]/10 blur-3xl pointer-events-none" />
            <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center justify-between gap-10 p-8 sm:p-12 md:flex-row lg:p-16">
              <div className="max-w-xl text-center md:text-left">
                <div className="mb-6 mx-auto md:mx-0 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#F5821F] shadow-sm ring-1 ring-orange-100/50">
                  <Smartphone size={32} />
                </div>
                <h2 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Take Samadhan wherever you go
                </h2>
                <p className="text-lg leading-relaxed text-slate-500 sm:text-xl">
                  Internet down? Report issues instantly using mobile data with our dedicated app. Get real-time push notifications on your ticket status.
                </p>
              </div>
              
              <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row md:flex-col lg:flex-row shrink-0">
                <Link
                  href="/download/ios"
                  className="group flex w-full items-center justify-center gap-4 rounded-xl bg-slate-900 px-8 py-4 text-white shadow-lg transition duration-300 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl sm:w-auto"
                >
                  <div className="flex flex-col items-start leading-none">
                    <span className="mb-1 text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Download on the</span>
                    <span className="text-xl font-bold tracking-tight">App Store</span>
                  </div>
                </Link>
                <Link
                  href="/download/android"
                  className="group flex w-full items-center justify-center gap-4 rounded-xl bg-slate-900 px-8 py-4 text-white shadow-lg transition duration-300 hover:bg-slate-800 hover:-translate-y-1 hover:shadow-xl sm:w-auto"
                >
                  <div className="flex flex-col items-start leading-none">
                    <span className="mb-1 text-[10px] text-slate-400 font-semibold tracking-widest uppercase">GET IT ON</span>
                    <span className="text-xl font-bold tracking-tight">Google Play</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </section> */}

        
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-100 bg-white py-12 text-center text-sm text-slate-500">
        <p>© DIV Private Limited. All Rights Reserved {`</>`}
        </p>
      </footer>
    </div>
  );
}
