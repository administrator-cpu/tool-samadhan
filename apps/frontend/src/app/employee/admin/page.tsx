"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { useUICacheStore } from "@/store/useUICacheStore";
import { Ticket, AlertTriangle, CheckCircle2, Users, Activity, ArrowRight, ShieldAlert, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import Link from "next/link";

interface AgentStat {
  employee_id: number;
  name: string;
  role: string;
  total_assigned: number;
  active_assigned: number;
}

interface AdminStats {
  summary: {
    total_tickets: string;
    active_tickets: string;
    escalated_tickets: string;
    resolved_today: string;
    tickets_last_24h: string;
    tickets_previous_24h: string;
    active_agents: string;
    total_agents: string;
  };
  categories: { name: string; count: string }[];
  volumeMix: { name: string; count: string }[];
  agents: AgentStat[];
}

export default function AdminDashboard() {
  const { dashboardStats, dashboardLastFetched, setDashboardStats } = useUICacheStore();
  const [loading, setLoading] = useState(!dashboardStats);

  useEffect(() => {
    const fetchStats = async () => {
      // 10-second cache expiry
      const TEN_SECONDS = 10 * 1000;
      const isCacheValid = dashboardStats && dashboardLastFetched && (Date.now() - dashboardLastFetched < TEN_SECONDS);

      if (isCacheValid) {
        console.log("[DASHBOARD] Using cached statistics");
        setLoading(false);
        return;
      }

      try {
        console.log("[DASHBOARD] Fetching fresh intelligence from DB...");
        const res = await api.get("/tickets/stats");
        console.log("Raw response:", res)
        console.log("Admin Dashboard Data: ", res.data);
        setDashboardStats(res.data);
      } catch (err: any) {
        if (err.code === "SESSION_CLEARED_SILENT") return;
        // Only show toast if user is still authenticated
        if (useAuthStore.getState().isAuthenticated) {
          toast.error("Failed to fetch dashboard statistics");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [dashboardStats, dashboardLastFetched, setDashboardStats]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Synchronizing Neural Network...</p>
        </div>
      </div>
    );
  }

  const stats = (dashboardStats.stats ? dashboardStats.stats : dashboardStats) as AdminStats;
  if (!stats || !stats.summary) return null;

  const { summary, categories } = stats;

  // Dynamic Trend Calculation
  const last24 = Number(summary.tickets_last_24h);
  const prev24 = Number(summary.tickets_previous_24h);
  let trendPercent = 0;
  if (prev24 > 0) {
    trendPercent = Math.round(((last24 - prev24) / prev24) * 100);
  } else if (last24 > 0) {
    trendPercent = 100; // 100% increase from 0
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 antialiased">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <header className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <Activity size={18} />
              </div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-heading">
                Operational Intelligence
              </h1>
            </div>
            <p className="text-base font-medium text-slate-500">
              Live data from {summary.total_tickets} historical support events
            </p>
          </div>
          {/*<div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm border border-slate-100 md:mt-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">System Live</span>
          </div>*/}
        </header>

        {/* Metric Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Ticket size={24} />} 
            label="Active Tickets" 
            value={summary.active_tickets} 
            trend={trendPercent > 0 ? `+${trendPercent}% from yesterday` : `${trendPercent}% from yesterday`}
            trendUp={trendPercent > 0}
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <StatCard 
            icon={<ShieldAlert size={24} />} 
            label="Escalated" 
            value={summary.escalated_tickets} 
            trend={Number(summary.escalated_tickets) > 0 ? "Needs Resolution" : "Zero Alerts"}
            color="text-red-600"
            bg="bg-red-50"
            alert={Number(summary.escalated_tickets) > 0}
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />} 
            label="Resolved Today" 
            value={summary.resolved_today} 
            trend={`${summary.resolved_today} completed in 24h`}
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
          <StatCard 
            icon={<Users size={24} />} 
            label="Active Agents" 
            value={summary.active_agents} 
            trend={`${summary.active_agents} of ${summary.total_agents} agents handling tickets`}
            color="text-amber-600"
            bg="bg-amber-50"
          />
        </div>

        {/* Main Dashboard Layout */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: Issue Categories & Agents Workload */}
          <div className="lg:col-span-2 space-y-8">

            {/* Agent Workload Card */}
            <div className="rounded-[1rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black tracking-tight text-slate-900">Workforce Workload</h3>
                  <p className="text-xs text-slate-500 font-medium mt-1">Real-time active ticket distribution per agent</p>
                </div>
                <Users size={20} className="text-slate-400" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <th className="pb-3 font-semibold">Agent</th>
                      <th className="pb-3 text-center font-semibold">Active Tickets</th>
                      <th className="pb-3 text-center font-semibold">Total Assigned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {stats.agents?.map((agent) => {
                      const active = agent.active_assigned;

                      return (
                        <tr key={agent.employee_id} className="group hover:bg-slate-50/50 transition-colors">
                          <td className="py-4">
                            <span className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                              {agent.name}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className={`inline-flex items-center justify-center rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-100`}>
                              {active}
                            </span>
                          </td>
                          <td className="py-4 text-center">
                            <span className="text-sm font-bold text-slate-600">
                              {agent.total_assigned}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {(!stats.agents || stats.agents.length === 0) && (
                      <tr>
                        <td colSpan={3} className="text-center text-sm text-slate-400 py-10">
                          No support agents registered yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="rounded-[1rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-xl font-black tracking-tight text-slate-900">Active Issue</h3>
                <BarChart3 size={20} className="text-slate-400" />
              </div>
              <div className="space-y-6">
                
                {categories?.map((cat, i) => {
                  const totalActive = Number(summary.active_tickets) || 1;
                  const percentage = (Number(cat.count) / totalActive) * 100;
                  return (
                    <div key={cat.name} className="group">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{cat.name}</span>
                        <span className="text-xs font-black text-slate-400">{cat.count} Tickets</span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-50 border border-slate-100 shadow-inner">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${i % 3 === 0 ? 'bg-indigo-600' :
                              i % 3 === 1 ? 'bg-indigo-400' :
                                'bg-indigo-200'
                            }`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                {(!stats.categories || stats.categories.length === 0) && <p className="text-center text-sm text-slate-400 py-10">No volume data available yet</p>}
              </div>
              <div className="mt-10 pt-8 border-t border-slate-50">
                <Link href="/employee/admin/tickets" className="group flex items-center gap-2 text-sm font-black text-indigo-600 hover:text-indigo-800 transition-all">
                  View All Tickets
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>

          </div>

          {/* Strategic Control & Quick Access */}
          <div className="space-y-8">

            <div className="rounded-[1rem] bg-indigo-900 p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-transform group-hover:scale-110" />
              <h3 className="text-xl font-black mb-6 relative z-10">Strategic Control</h3>
              <div className="space-y-3 relative z-10">
                <Link href="/employee/admin/staff" className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10">
                  <span className="text-sm font-bold">Workforce Optimization</span>
                  <ArrowRight size={18} />
                </Link>
                <Link href="/employee/admin/tickets" className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10">
                  <span className="text-sm font-bold">Unassigned Pipeline</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, trend, color, bg, alert, trendUp }: { icon: any, label: string, value: string, trend: string, color: string, bg: string, alert?: boolean, trendUp?: boolean }) {
  return (
    <div className={`group relative overflow-hidden rounded-[1rem] border ${alert ? 'border-red-200 shadow-red-100' : 'border-slate-100'} bg-white p-7 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl`}>
      <div className="flex flex-col gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bg} ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
          <h2 className="text-4xl font-black text-slate-900 leading-tight">{value}</h2>
        </div>
        <div className="pt-2 flex items-center gap-1">
          {trendUp !== undefined && (
            trendUp ? <TrendingUp size={14} className="text-emerald-500" /> : <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={`text-[11px] font-black uppercase tracking-widest ${alert ? 'text-red-500' : 'text-slate-400'}`}>{trend}</span>
        </div>
      </div>
    </div>
  );
}
