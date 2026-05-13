"use client";

import Link from "next/link";

export default function CreateTicketPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] text-slate-900 antialiased font-sans">
      
      {/* Header */}
      <header className="w-full px-6 py-6 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-slate-800"
        >
          <span className="material-symbols-outlined text-[20px] transition-transform group-hover:-translate-x-1">
            arrow_back
          </span>
          <span className="text-sm font-medium">Back to Dashboard</span>
        </Link>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center w-full p-4 sm:p-6 md:p-12">
        <div className="w-full max-w-[600px] rounded-xl bg-white p-6 sm:p-10 md:p-12 sm:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]">
          
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-[32px] font-semibold leading-tight text-slate-900 mb-2">
              How can we help today?
            </h1>
            <p className="text-base text-slate-500">
              Fill out the form below and we'll get right on it.
            </p>
          </div>

          {/* Form */}
          <form className="flex flex-col gap-6">
            
            {/* Category */}
            <div className="flex flex-col gap-2">
              <label htmlFor="category" className="text-sm font-medium text-slate-700">
                Issue Category
              </label>

              <div className="relative">
                <select
                  id="category"
                  name="category"
                  defaultValue=""
                  className="h-[56px] w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 transition-shadow cursor-pointer focus:border-[#2513ec] focus:outline-none focus:ring-[3px] focus:ring-[#2513ec]/10"
                >
                  <option value="" disabled>
                    Select an issue type
                  </option>
                  <option value="no_internet">No Internet</option>
                  <option value="slow_speeds">Slow Speeds</option>
                  <option value="router_issue">Router Issue</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>

                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                  <span className="material-symbols-outlined">
                    keyboard_arrow_down
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Issue Description
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Tell us exactly what's happening. Include light colors on your router if possible."
                className="h-[160px] w-full resize-none rounded-lg border border-slate-200 bg-white p-4 text-base text-slate-900 placeholder:text-slate-400 transition-shadow focus:border-[#2513ec] focus:outline-none focus:ring-[3px] focus:ring-[#2513ec]/10"
              />
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="button"
                className="flex h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-[#2513ec] text-white text-[15px] font-medium shadow-[0_4px_14px_rgba(37,19,236,0.39)] transition-all hover:opacity-90"
              >
                <span>Submit Request</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}