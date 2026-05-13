"use client";

import Link from "next/link";
import { MoveLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 py-24 sm:py-32 lg:px-8">
      <div className="text-center">
        <p className="text-base font-bold text-indigo-600">404</p>
        <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-900 sm:text-5xl font-heading uppercase italic">
          Page Not Found
        </h1>
        <p className="mt-6 text-lg leading-7 text-slate-600 font-body">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/"
            className="group flex items-center gap-2 rounded-xl bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-slate-800 hover:-translate-y-1 active:scale-95"
          >
            <MoveLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Home
          </Link>
          <Link 
            href="/customer/help-center" 
            className="text-sm font-bold text-slate-900 hover:text-indigo-600"
          >
            Contact Support <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
      
      {/* Abstract Background Element */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div 
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" 
          style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
        />
      </div>
    </div>
  );
}
