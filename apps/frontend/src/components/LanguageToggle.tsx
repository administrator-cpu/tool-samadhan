"use client";

import { useLanguageStore } from "@/store/useLanguageStore";
import { useEffect, useState } from "react";

export default function LanguageToggle() {
  const { targetLang, setTargetLang } = useLanguageStore();
  
  // Prevent hydration mismatch by only rendering after mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 shadow-xs">
      <button
        onClick={() => setTargetLang("en")}
        className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
          targetLang === "en"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
            : "text-slate-500 hover:bg-slate-200"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setTargetLang("hi")}
        className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-widest transition-all ${
          targetLang === "hi"
            ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
            : "text-slate-500 hover:bg-slate-200"
        }`}
      >
        HI
      </button>
    </div>
  );
}
