"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Monitor, Apple, Terminal, Download, ChevronRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import SamadhanLogo from "../../assets/Samadhan-Logo.png";



type OS = "Windows" | "Mac" | "Linux" | "Unknown";

const osData: Record<
  Exclude<OS, "Unknown">,
  { name: string; icon: React.ReactNode; link: string; description: string; disabled?: boolean }
> = {
  Windows: {
    name: "Windows",
    icon: <Monitor className="h-6 w-6" />,
    link: "/downloads/Samadhan-Desk/Samadhan-Desk-Win.exe",
    description: "For Windows 10, 11 (64-bit)",
  },
  Mac: {
    name: "macOS",
    icon: <Apple className="h-6 w-6" />,
    link: "/downloads/Samadhan-Desk/Samadhan-Desk-Mac-Intel.zip",
    description: "For macOS Intel Processors",
    disabled: false,
  },
  Linux: {
    name: "Linux",
    icon: <Terminal className="h-6 w-6" />,
    link: "#",
    description: "Coming Soon (AppImage / DEB)",
    disabled: true,
  },
};

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<OS>("Unknown");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (userAgent.includes("win")) {
      setDetectedOS("Windows");
    } else if (userAgent.includes("mac")) {
      setDetectedOS("Mac");
    } else if (userAgent.includes("linux")) {
      setDetectedOS("Linux");
    } else {
      setDetectedOS("Windows"); // Fallback default
    }
  }, []);

  const primaryOSKey = detectedOS !== "Unknown" ? detectedOS : "Windows";
  const primaryOption = osData[primaryOSKey];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-[#F5821F] selection:text-white">
      {/* Navbar space placeholder */}
      <header className="p-6 flex items-center justify-between z-10 relative max-w-7xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 mb-2 text-primary transition-transform group-hover:scale-105">
              <Image src={SamadhanLogo} alt="Samadhan Logo" width={60} height={60}/>
            </div>
          <span className="font-outfit font-bold text-xl tracking-tight text-slate-900">Samadhan</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center pt-12 md:pt-20 px-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#F5821F] opacity-[0.08] blur-[120px] rounded-full pointer-events-none" />
        
        {/* Hero Section */}
        <div className="max-w-4xl mx-auto w-full flex flex-col items-center text-center z-10">
          <motion.div
            initial={{ opacity: 0, transform: "scale(0.95)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-sm text-slate-600 mb-8 font-medium shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F5821F] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F5821F]"></span>
              </span>
              Samadhan Desk Client 1.0 is now available
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, transform: "translateY(20px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, delay: 0.05 }}
            className="text-5xl md:text-7xl font-bold font-heading tracking-tight mb-6 text-slate-900"
          >
            Access any device, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5821F] to-amber-500">
              instantly.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, transform: "translateY(20px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, delay: 0.1 }}
            className="text-lg md:text-xl text-slate-600 mb-12 max-w-2xl font-body"
          >
            Download the ultra-fast Samadhan remote desktop client. Secure, reliable, and incredibly easy to use. No configuration required.
          </motion.p>

          {/* Primary Action Card */}
          <motion.div
            initial={{ opacity: 0, transform: "translateY(20px)" }}
            animate={{ opacity: 1, transform: "translateY(0)" }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, delay: 0.15 }}
            className="w-full max-w-lg bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-8 mb-20 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden"
          >
            {/* Inner subtle glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#F5821F]/5 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              <div className="p-4 bg-slate-50 rounded-2xl mb-6 shadow-sm border border-slate-100 text-[#F5821F]">
                {primaryOption.icon}
              </div>
              <h2 className="text-2xl font-bold font-heading mb-2 text-slate-900">
                Download for {primaryOption.name}
              </h2>
              <p className="text-slate-500 mb-8 font-medium">
                {primaryOption.description}
              </p>

              {isMounted && (
                <motion.div
                  whileTap={primaryOption.disabled ? undefined : { scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className="w-full"
                >
                  <a
                    href={primaryOption.disabled ? '#' : primaryOption.link}
                    className={`inline-flex items-center justify-center gap-2 w-full h-14 text-base font-semibold rounded-xl text-white border-0 transition-all ${primaryOption.disabled ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#F5821F] hover:bg-[#e0751a] shadow-[0_8px_20px_rgba(245,130,31,0.25)] hover:shadow-[0_12px_25px_rgba(245,130,31,0.35)] cursor-pointer'}`}
                  >
                    <Download className="w-5 h-5" />
                    {primaryOption.disabled ? "Coming Soon" : `Download .${primaryOption.link.split('.').pop()}`}
                  </a>
                </motion.div>
              )}
              
              <div className="mt-6 flex items-center justify-center gap-6 text-sm text-slate-500 font-medium">
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#F5821F]"/> Secure</div>
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#F5821F]"/> Fast</div>
                 <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#F5821F]"/> Free</div>
              </div>
            </div>
          </motion.div>

          {/* Other Options Grid */}
          <motion.div
            initial={{ opacity: 0, transform: "scale(0.95)" }}
            animate={{ opacity: 1, transform: "scale(1)" }}
            transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.6, delay: 0.2 }}
            className="w-full max-w-4xl border-t border-slate-200/60 pt-16 pb-24"
          >
            <div className="text-left mb-8">
              <h3 className="text-2xl font-semibold font-heading mb-2 text-slate-900">Other operating systems</h3>
              <p className="text-slate-500">Not on {primaryOption.name}? Select a different version below.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(osData).map(([key, os], index) => {
                const isSelected = key === primaryOSKey;
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, transform: "translateY(20px)" }}
                    animate={{ opacity: 1, transform: "translateY(0)" }}
                    transition={{ ease: [0.23, 1, 0.32, 1], duration: 0.5, delay: 0.3 + (index * 0.05) }}
                  >
                    <motion.a
                      href={os.disabled ? undefined : os.link}
                      whileHover={os.disabled ? {} : { scale: 1.02 }}
                      whileTap={os.disabled ? {} : { scale: 0.98 }}
                      className={`block p-6 rounded-2xl border transition-all flex items-center justify-between group h-full shadow-sm hover:shadow-md
                        ${isSelected 
                          ? 'bg-slate-50 border-[#F5821F]/30 ring-1 ring-[#F5821F]/10' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                        }
                        ${os.disabled ? 'opacity-60 cursor-not-allowed hover:shadow-sm hover:border-slate-200' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl border ${isSelected ? 'bg-orange-50 border-orange-100 text-[#F5821F]' : 'bg-slate-50 border-slate-100 text-slate-600 group-hover:text-slate-900 group-hover:bg-slate-100'}`}>
                           {os.icon}
                        </div>
                        <div className="text-left">
                          <h4 className={`font-semibold ${isSelected ? 'text-[#F5821F]' : 'text-slate-900'}`}>{os.name}</h4>
                          <p className="text-xs text-slate-500 mt-1">{os.disabled ? 'Coming Soon' : 'Available'}</p>
                        </div>
                      </div>
                      {!os.disabled && (
                        <ChevronRight className={`w-5 h-5 text-slate-400 group-hover:text-[#F5821F] transition-colors`} />
                      )}
                    </motion.a>
                  </motion.div>
                );
              })}
            </div>
            
          </motion.div>
        </div>
      </main>
    </div>
  );
}
