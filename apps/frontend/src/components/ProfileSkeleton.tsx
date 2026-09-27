import React from "react";

export default function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-white pb-20 antialiased flex justify-center flex-col items-center animate-pulse">
      {/* Premium Header Banner Skeleton */}
      <div className="h-64 w-full bg-slate-200 relative overflow-hidden"></div>

      <div className="mx-auto -mt-32 max-w-2xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="overflow-hidden">
          {/* Main Profile Section */}
          <div className="flex flex-col items-center px-8 py-12 text-center w-full">
            
            {/* Avatar Skeleton */}
            <div className="relative mb-6">
              <div className="relative flex h-[168px] w-[168px] items-center justify-center rounded-full bg-slate-200 ring-8 ring-white shadow-2xl overflow-hidden"></div>
            </div>

            {/* Name & Role Skeleton */}
            <div className="mb-10 flex flex-col items-center w-full gap-4">
              <div className="h-8 w-48 bg-slate-200 rounded-lg"></div>
              <div className="h-6 w-24 bg-slate-200 rounded-full"></div>
            </div>

            {/* Account Information Skeleton */}
            <div className="w-full space-y-6 border-t border-slate-50 pt-10">
              <div className="grid grid-cols-1 gap-6 text-left sm:grid-cols-2">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm w-full">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200 ring-1 ring-slate-100"></div>
                    <div className="flex flex-col gap-2 w-full">
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                      <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions Skeleton */}
            <div className="mt-12 flex w-full flex-col gap-4">
              <div className="h-14 w-full rounded-xl bg-slate-200"></div>
              <div className="h-14 w-full rounded-xl bg-slate-100 border border-slate-200/50"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
