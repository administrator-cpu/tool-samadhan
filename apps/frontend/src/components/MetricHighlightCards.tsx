import { useEffect } from "react";
import { useCustomerMetricsStore } from "@/store/useCustomerMetricsStore";

interface MetricHighlightCardsProps {
  data?: any;
}

const THEME_STYLES: Record<string, { badge: string; iconBg: string; border: string; glow: string }> = {
  emerald: {
    badge: "bg-emerald-500/10 text-emerald-700 border-emerald-200/60",
    iconBg: "bg-emerald-500/15 text-emerald-600",
    border: "hover:border-emerald-300/80 hover:shadow-emerald-500/10",
    glow: "from-emerald-500/10 via-transparent to-transparent",
  },
  rose: {
    badge: "bg-rose-500/10 text-rose-700 border-rose-200/60",
    iconBg: "bg-rose-500/15 text-rose-600",
    border: "hover:border-rose-300/80 hover:shadow-rose-500/10",
    glow: "from-rose-500/10 via-transparent to-transparent",
  },
  indigo: {
    badge: "bg-indigo-500/10 text-indigo-700 border-indigo-200/60",
    iconBg: "bg-indigo-500/15 text-indigo-600",
    border: "hover:border-indigo-300/80 hover:shadow-indigo-500/10",
    glow: "from-indigo-500/10 via-transparent to-transparent",
  },
  cyan: {
    badge: "bg-cyan-500/10 text-cyan-700 border-cyan-200/60",
    iconBg: "bg-cyan-500/15 text-cyan-600",
    border: "hover:border-cyan-300/80 hover:shadow-cyan-500/10",
    glow: "from-cyan-500/10 via-transparent to-transparent",
  },
  amber: {
    badge: "bg-amber-500/10 text-amber-700 border-amber-200/60",
    iconBg: "bg-amber-500/15 text-amber-600",
    border: "hover:border-amber-300/80 hover:shadow-amber-500/10",
    glow: "from-amber-500/10 via-transparent to-transparent",
  },
  slate: {
    badge: "bg-slate-500/10 text-slate-700 border-slate-200/60",
    iconBg: "bg-slate-500/15 text-slate-600",
    border: "hover:border-slate-300/80 hover:shadow-slate-500/10",
    glow: "from-slate-500/10 via-transparent to-transparent",
  },
};

export default function MetricHighlightCards({ data: externalData }: MetricHighlightCardsProps) {
  const { metrics: storeMetrics, loadingMetrics: storeLoadingMetrics, fetchMetrics } = useCustomerMetricsStore();

  useEffect(() => {
    if (!externalData) {
      fetchMetrics("ALL");
    }
  }, [externalData, fetchMetrics]);

  const metrics = externalData || storeMetrics;
  const isLoading = !externalData && storeLoadingMetrics;

  if (isLoading || !metrics) {
    return null;
  }

  const kpis = metrics?.kpiHighlights;

  const getStyle = (themeName: string) => THEME_STYLES[themeName] || THEME_STYLES.emerald;

  const rawCards = [
    {
      id: "uptime",
      item: kpis.uptimeDelta,
      defaultTitle: "Uptime Availability",
      defaultSub: "High network availability maintained",
    },
    {
      id: "mttr",
      item: kpis.mttrReduction,
      defaultTitle: "MTTR Resolution",
      defaultSub: "Faster mean time to resolution",
    },
    {
      id: "core_outage",
      item: kpis.zeroCoreOutage,
      defaultTitle: "Zero Core Outage",
      defaultSub: "0 critical backbone incidents",
    },
    {
      id: "repeat_fault",
      item: kpis.repeatFaultReduction,
      defaultTitle: "Repeat Faults",
      defaultSub: "Recurring issue occurrences monitored",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {rawCards.map((c, index) => {
        const item = c.item || {};
        const theme = item.theme || "emerald";
        const style = getStyle(theme);
        const icon = item.icon || "trending_up";
        const badge = item.badge || "Live";
        const title = item.displayText || c.defaultTitle;
        const subtitle = item.description || c.defaultSub;

        return (
          <div
            key={c.id}
            className={`group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${style.border}`}
          >
            {/* Subtle Ambient Radial Glow */}
            <div
              className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-gradient-to-br ${style.glow} blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
            />

            <div className="relative z-10 flex flex-col gap-3">
              {/* Top Row: Icon & Pill Badge */}
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 ${style.iconBg}`}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {icon}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide ${style.badge}`}
                >
                  {badge}
                </span>
              </div>

              {/* Middle & Bottom: Headline Metric & Subtitle */}
              <div className="flex flex-col gap-1">
                <h4
                  className="text-base font-bold tracking-tight text-slate-900 group-hover:text-slate-950"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {title}
                </h4>
                <p className="text-xs font-medium leading-relaxed text-slate-500">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
