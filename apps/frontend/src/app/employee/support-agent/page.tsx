"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { CheckCircle2, Clock, Activity, ArrowRight, Target, Zap} from "lucide-react";
import Link from "next/link";

interface AgentStats {
  summary: {
    total_assigned: string;
    active_tickets: string;
    total_resolved: string;
    resolved_today: string;
  };
  recentTickets: {
    id: number;
    ticket_no: string;
    subject: string;
    status: string;
    created_at: string;
    customer_name: string;
  }[];
}

export default function AgentDashboard() {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/tickets/agent-stats");
        // The backend returns { data: { stats: { summary, recentTickets } } }
        setStats(res.data?.stats || res.data);
      } catch (err) {
        // Only show toast if user is still authenticated
        if (useAuthStore.getState().isAuthenticated) {
          toast.error("Failed to fetch performance metrics");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Calculating Performance Metrics...</p>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const { summary, recentTickets } = stats;
  console.log("recentTickets: ", recentTickets)

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 antialiased font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <header className="mb-10 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-200">
                <Target size={20} />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900">
                  Performance Hub
                </h1>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Support Agent Portal</p>
              </div>
            </div>
          </div>
          {/*<div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-4 py-2 shadow-sm border border-slate-100 md:mt-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Live Mission Status</span>
          </div>*/}
        </header>

        {/* Metric Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Activity size={24} />} 
            label="Active Load" 
            value={summary.active_tickets} 
            sublabel="Assigned to you"
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <StatCard 
            icon={<Zap size={24} />} 
            label="Resolved Today" 
            value={summary.resolved_today} 
            sublabel="Last 24 hours"
            color="text-emerald-600"
            bg="bg-emerald-50"
            highlight={Number(summary.resolved_today) > 0}
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />} 
            label="Lifetime Wins" 
            value={summary.total_resolved} 
            sublabel={`Of ${summary.total_assigned} total`}
            color="text-slate-600"
            bg="bg-slate-50"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Active Worklist */}
          <div className="lg:col-span-2 rounded-[1rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">Mission Backlog</h3>
                <p className="text-sm font-medium text-slate-400">Your most recently updated assignments</p>
              </div>
              <Link href="/employee/support-agent/tickets" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                View Full Roster
              </Link>
            </div>

            <div className="space-y-4">
              {recentTickets.map((ticket) => (
                <Link 
                  key={ticket.id}
                  href={`/employee/support-agent/tickets/${ticket.id}`}
                  className="group flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600 font-black text-xs">
                      T
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-black text-slate-400">#{ticket.ticket_no}</span>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{ticket.subject}</h4>
                      </div>
                      <p className="text-xs font-bold text-slate-400">Customer: {ticket.customer_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        ticket.status === 'OPEN' ? 'bg-amber-100 text-amber-700' :
                        ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
              {recentTickets.length === 0 && (
                <div className="py-20 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                    <Clock size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No active assignments in your queue</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions & Tips */}
          <div className="space-y-8">
            <div className="rounded-[1rem] bg-indigo-900 p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-transform group-hover:scale-110" />
              <h3 className="text-xl font-black mb-6 relative z-10">Agent Console</h3>
              <div className="space-y-3 relative z-10">
                <Link href="/employee/support-agent/tickets" className="flex items-center justify-between w-full p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all border border-white/10">
                  <span className="text-sm font-bold">Open My Queue</span>
                  <ArrowRight size={18} />
                </Link>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-2">Performance Tip</p>
                  <p className="text-xs font-medium text-indigo-100 leading-relaxed">
                    Resolved tickets within 24 hours boost your efficiency score by 15%.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[1rem] border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/30">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Target size={18} className="text-emerald-500" />
                Daily Target
              </h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Resolution Progress</span>
                  <span className="text-sm font-black text-emerald-600">{Math.min(100, Math.round((Number(summary.resolved_today) / 10) * 100))}%</span>
                </div>
                <div className="h-4 w-full rounded-full bg-slate-50 border border-slate-100 overflow-hidden shadow-inner">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-sm"
                    style={{ width: `${Math.min(100, (Number(summary.resolved_today) / 10) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <p className="text-xs font-bold text-slate-500 text-center leading-relaxed">
                Aim for 10 resolutions today to reach your expert milestone. You&apos;ve got this!
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, color, bg, alert, highlight }: any) {
  return (
    <div className={`group relative overflow-hidden rounded-[1rem] border ${alert ? 'border-red-200 shadow-red-100' : highlight ? 'border-emerald-200 shadow-emerald-100' : 'border-slate-100'} bg-white p-7 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl`}>
      <div className="flex flex-col gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
          <h2 className="text-4xl font-black text-slate-900 leading-tight">{value}</h2>
        </div>
        <div className="pt-2 border-t border-slate-50 mt-1">
          <span className={`text-[10px] font-black uppercase tracking-widest ${alert ? 'text-red-500' : highlight ? 'text-emerald-500' : 'text-slate-400'}`}>{sublabel}</span>
        </div>
      </div>
    </div>
  );
}
