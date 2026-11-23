import React from "react";

interface TicketDetailSkeletonProps {
  variant?: "customer" | "staff" | "sales";
}

export default function TicketDetailSkeleton({
  variant = "customer",
}: TicketDetailSkeletonProps) {
  const isCustomer = variant === "customer";
  const isStaff = variant === "staff";

  return (
    <div
      className={`h-screen flex flex-col ${
        isCustomer ? "bg-[#faf9fa]" : "bg-[#F8FAFC]"
      } text-slate-900 antialiased overflow-hidden`}
    >
      {/* Top Header Bar */}
      <header className="flex items-center px-6 py-4 bg-white border-b border-slate-100 shadow-xs z-10 animate-pulse">
        <div
          className={`mr-5 h-10 w-10 shrink-0 ${
            isCustomer ? "rounded-full" : "rounded-xl"
          } bg-slate-200/80`}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="h-6 w-56 sm:w-72 rounded-lg bg-slate-200" />
            {!isCustomer && (
              <div className="h-5 w-20 rounded-md bg-slate-100 border border-slate-200/60" />
            )}
            <div className="h-5 w-20 rounded-md bg-[#FFF7F9] border border-[#FFE4E8]" />
          </div>
          <div className="mt-2 h-3.5 w-40 rounded bg-slate-100" />
        </div>

        <div className="ml-auto flex items-center gap-3">
          {/* Language Toggle Pill */}
          <div className="h-9 w-28 rounded-xl bg-slate-100 border border-slate-200/50" />

          {/* Staff Action Buttons */}
          {isStaff && (
            <div className="hidden md:flex items-center gap-2.5 ml-2">
              <div className="h-9 w-40 rounded-lg bg-slate-100 border border-slate-200/60" />
              <div className="h-9 w-24 rounded-lg bg-slate-100 border border-slate-200/60" />
              <div className="h-9 w-24 rounded-lg bg-[#FFF7F9] border border-[#FFE4E8]" />
            </div>
          )}
        </div>
      </header>

      {/* Main Content Split */}
      <div
        className={`flex flex-1 overflow-hidden ${
          isCustomer ? "max-w-[1400px] mx-auto w-full" : ""
        }`}
      >
        {/* Center Timeline & Composer Column */}
        <section className="flex-1 flex flex-col relative px-5 overflow-y-auto pt-6 border-r border-slate-100 animate-pulse">
          <div
            className={`${
              isCustomer ? "w-full" : "max-w-4xl mx-auto w-full"
            } flex-1 mt-6`}
          >
            <div className="relative pl-6 sm:pl-10 pb-8">
              {/* Timeline Event 1: Ticket Created (Right-aligned customer card) */}
              <div className="relative mb-10">
                <div className="absolute left-[-2px] sm:left-[-17px] top-10 bottom-[-48px] w-[2px] bg-slate-200/80" />
                <div className="absolute -left-3 sm:-left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 shadow-xs" />

                <div className="mb-2 ml-2 flex justify-end">
                  <div className="h-5 w-44 rounded-md bg-slate-200 mt-1" />
                </div>
                <div className="flex w-full justify-end">
                  <div className="w-full max-w-[75%] sm:max-w-[60%] flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-24 rounded bg-slate-200/70" />
                      <div className="h-3 w-16 rounded bg-slate-100" />
                    </div>
                    <div className="w-full rounded-2xl border border-[#FFE4E8] bg-white p-4 shadow-xs space-y-2.5">
                      <div className="h-3.5 w-11/12 rounded bg-slate-200/80" />
                      <div className="h-3.5 w-3/4 rounded bg-slate-200/60" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Timeline Event 2: System / Assignment Node (Left-aligned) */}
              <div className="relative mb-10">
                <div className="absolute left-[-2px] sm:left-[-17px] top-10 bottom-[-48px] w-[2px] bg-slate-200/80" />
                <div className="absolute -left-3 sm:-left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 shadow-xs" />

                <div className="mb-2 ml-2 flex justify-start">
                  <div className="h-5 w-52 rounded-md bg-slate-200 mt-1" />
                </div>
                <div className="ml-2 flex items-center gap-2">
                  <div className="h-3 w-28 rounded bg-slate-100" />
                  <div className="h-3 w-16 rounded bg-slate-100" />
                </div>
              </div>

              {/* Timeline Event 3: Support Specialist Update (Left-aligned message card) */}
              <div className="relative mb-6">
                <div className="absolute -left-3 sm:-left-[32px] top-1 w-8 h-8 rounded-full bg-white border-2 border-slate-200 shadow-xs" />

                <div className="mb-2 ml-2 flex justify-start">
                  <div className="h-5 w-48 rounded-md bg-slate-200 mt-1" />
                </div>
                <div className="flex w-full justify-start pl-2">
                  <div className="w-full max-w-[78%] sm:max-w-[65%] flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-slate-200" />
                      <div className="h-3 w-28 rounded bg-slate-200/80" />
                      <div className="h-3 w-16 rounded bg-slate-100" />
                    </div>
                    <div className="w-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs space-y-2.5">
                      <div className="h-3.5 w-full rounded bg-slate-200/80" />
                      <div className="h-3.5 w-5/6 rounded bg-slate-200/70" />
                      <div className="h-3.5 w-2/3 rounded bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reply Composer Skeleton (Staff View) */}
          {isStaff && (
            <div className="max-w-4xl mx-auto w-full mt-auto mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-28 rounded-lg bg-slate-100" />
                  <div className="h-7 w-24 rounded-lg bg-slate-100" />
                </div>
                <div className="h-7 w-28 rounded-lg bg-slate-100" />
              </div>
              <div className="h-20 w-full rounded-lg bg-slate-50 border border-slate-100 mb-3" />
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 rounded bg-slate-100" />
                  <div className="h-4 w-24 rounded bg-slate-100" />
                </div>
                <div className="h-10 w-32 rounded-lg bg-[#FFF7F9] border border-[#FFE4E8]" />
              </div>
            </div>
          )}
        </section>

        {/* Right Details Sidebar */}
        <aside
          className={`hidden lg:flex flex-col shrink-0 p-6 bg-white border-l border-slate-100 overflow-y-auto animate-pulse ${
            isCustomer ? "w-[300px] xl:w-[340px]" : "w-[260px]"
          }`}
        >
          {/* Customer Status Progress Stepper */}
          {isCustomer && (
            <>
              <div className="mb-10">
                <div className="mb-4 h-6 w-32 rounded-md bg-slate-200" />
                <div className="relative mb-5">
                  <div className="h-2 w-full rounded-full bg-slate-200" />
                  <div className="absolute inset-0 flex items-center justify-between">
                    <span className="h-4 w-4 rounded-full border-4 border-white bg-slate-300 shadow-xs" />
                    <span className="h-4 w-4 rounded-full border-4 border-white bg-slate-300 shadow-xs" />
                    <span className="h-4 w-4 rounded-full border-4 border-white bg-slate-300 shadow-xs" />
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-14 rounded bg-slate-200" />
                  <div className="h-3 w-20 rounded bg-slate-100" />
                  <div className="h-3 w-14 rounded bg-slate-100" />
                </div>
              </div>
              <hr className="border-slate-100 mb-8" />
            </>
          )}

          {/* Ticket Details Section */}
          <div className="h-5 w-28 rounded bg-slate-200 mb-6" />

          <div className="space-y-6">
            {/* Status */}
            <div>
              <div className="h-3 w-14 rounded bg-slate-100 mb-2" />
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                <div className="h-4 w-24 rounded bg-slate-200" />
              </div>
            </div>

            {/* Customer Info (Employee Views) or Agent Assigned (Customer View) */}
            {isCustomer ? (
              <div>
                <div className="h-3 w-24 rounded bg-slate-100 mb-2" />
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="h-8 w-8 rounded-full bg-slate-200 shrink-0" />
                  <div className="h-4 w-32 rounded bg-slate-200" />
                </div>
              </div>
            ) : (
              <div>
                <div className="h-3 w-20 rounded bg-slate-100 mb-2" />
                <div className="h-4 w-36 rounded bg-slate-200 mb-1.5" />
                <div className="h-3 w-28 rounded bg-slate-100 mb-1" />
                <div className="h-3 w-40 rounded bg-slate-100" />
              </div>
            )}

            {/* Created / Opened On */}
            <div>
              <div className="h-3 w-20 rounded bg-slate-100 mb-2" />
              <div className="h-4 w-36 rounded bg-slate-200" />
            </div>

            {/* Last Updated (Employee Views) */}
            {!isCustomer && (
              <div>
                <div className="h-3 w-24 rounded bg-slate-100 mb-2" />
                <div className="h-4 w-36 rounded bg-slate-200" />
              </div>
            )}

            {/* Circuit Description / ID */}
            <div>
              <div className="h-3 w-28 rounded bg-slate-100 mb-2" />
              <div className="h-4 w-32 rounded bg-slate-200" />
            </div>

            {/* Provider Outage Card Skeleton (Staff View) */}
            {isStaff && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-3">
                <div className="h-3.5 w-28 rounded bg-slate-200" />
                <div className="h-8 w-full rounded-lg bg-white border border-slate-200/60" />
                <div className="h-8 w-full rounded-lg bg-white border border-slate-200/60" />
              </div>
            )}
          </div>

          {/* Assigned Agent Bottom Block (Employee Views) */}
          {!isCustomer && (
            <>
              <hr className="border-slate-100 my-6" />
              <div>
                <div className="h-3 w-24 rounded bg-slate-100 mb-4" />
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-28 rounded bg-slate-200" />
                    <div className="h-2.5 w-20 rounded bg-slate-100" />
                  </div>
                </div>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
