export default function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 antialiased font-sans">
      <div className="mx-auto max-w-7xl animate-pulse">
        
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-slate-200" />
            <div className="flex flex-col gap-2">
              <div className="h-8 w-48 rounded bg-slate-200" />
              <div className="h-4 w-64 rounded bg-slate-200" />
            </div>
          </div>
          <div className="h-12 w-32 rounded-xl bg-slate-200" />
        </header>

        {/* Metric Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="h-4 w-24 rounded bg-slate-100" />
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
              </div>
              <div className="mb-2 h-8 w-16 rounded bg-slate-200" />
              <div className="h-4 w-3/4 rounded bg-slate-50" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-[1rem] border border-slate-100 bg-white p-8 shadow-sm h-[400px]">
              <div className="mb-6 flex justify-between">
                <div className="flex flex-col gap-2">
                  <div className="h-6 w-40 rounded bg-slate-200" />
                  <div className="h-4 w-56 rounded bg-slate-100" />
                </div>
                <div className="h-6 w-24 rounded bg-slate-100" />
              </div>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-16 w-full rounded-2xl bg-slate-50" />
                ))}
              </div>
            </div>
          </div>

          {/* Side Content Area */}
          <div className="space-y-8">
            <div className="rounded-[1rem] border border-slate-100 bg-white p-8 shadow-sm h-[400px]">
              <div className="h-6 w-32 rounded bg-slate-200 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 w-full rounded-2xl bg-slate-50" />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
