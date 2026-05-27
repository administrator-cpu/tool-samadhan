"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useAuthStore } from "@/store/useAuthStore";
import { FileText, ArrowRight, ShieldCheck, Target, PlusCircle, LayoutDashboard, CheckCircle2, Archive, AlertCircle } from "lucide-react";
import Link from "next/link";

interface Ticket {
  id: number;
  ticket_no: string;
  subject: string;
  status: string;
  created_at: string;
  customer_name: string;
}

interface StatsSummary {
  total_tickets: number;
  active_tickets: number;
  closed_tickets: number;
  resolved_tickets: number;
}

export default function SalesDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<StatsSummary>({
    total_tickets: 0,
    active_tickets: 0,
    closed_tickets: 0,
    resolved_tickets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ticketsRes, statsRes] = await Promise.all([
          api.get("/tickets?page=1&limit=5&statusGroup=ACTIVE"),
          api.get("/tickets/stats"),
        ]);
        setTickets(ticketsRes.data.tickets || []);
        
        const summary = statsRes.data?.stats?.summary || statsRes.data?.summary || {};
        setStats({
          total_tickets: Number(summary.total_tickets || 0),
          active_tickets: Number(summary.active_tickets || 0),
          closed_tickets: Number(summary.closed_tickets || 0),
          resolved_tickets: Number(summary.resolved_tickets || 0),
        });
      } catch (err) {
        if (useAuthStore.getState().isAuthenticated) {
          toast.error("Failed to load dashboard metrics");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Initializing Sales Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 antialiased font-sans">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xl shadow-emerald-700/20">
              <LayoutDashboard size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900 font-heading">
                Sales Hub
              </h1>
              <p className="text-sm font-bold text-slate-400 tracking-widest">Samadhan Support Ticket Portal</p>
            </div>
          </div>

          <Link
            href="/employee/sales/raise-ticket"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:bg-emerald-800 hover:-translate-y-0.5"
          >
            <PlusCircle size={18} />
            Raise Ticket
          </Link>
        </header>

        {/* Metric Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Target size={24} />} 
            label="Total Tickets" 
            value={stats.total_tickets} 
            sublabel="Across all customers"
            color="text-indigo-600"
            bg="bg-indigo-50"
          />
          <StatCard 
            icon={<AlertCircle size={24} />} 
            label="Active Tickets" 
            value={stats.active_tickets} 
            sublabel="In progress / Open"
            color="text-amber-600"
            bg="bg-amber-50"
          />
          <StatCard 
            icon={<Archive size={24} />} 
            label="Closed Tickets" 
            value={stats.closed_tickets} 
            sublabel="Permanently locked"
            color="text-slate-600"
            bg="bg-slate-100"
          />
          <StatCard 
            icon={<CheckCircle2 size={24} />} 
            label="Resolved Tickets" 
            value={stats.resolved_tickets} 
            sublabel="Awaiting closure"
            color="text-emerald-600"
            bg="bg-emerald-50"
          />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Recent Tickets list */}
          <div className="lg:col-span-2 rounded-[1rem] border border-slate-100 bg-white p-8 shadow-2xl shadow-slate-200/40">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black tracking-tight text-slate-900">Recent Fleet Updates</h3>
                <p className="text-sm font-medium text-slate-400">Newly registered tickets</p>
              </div>
              <Link href="/employee/sales/tickets" className="text-xs font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors">
                View All Tickets
              </Link>
            </div>

            <div className="space-y-4">
              {tickets.map((ticket) => (
                <Link 
                  key={ticket.id}
                  href={`/employee/sales/tickets/${ticket.id}`}
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
                        ticket.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <ArrowRight size={18} className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
              {tickets.length === 0 && (
                <div className="py-20 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 mb-4">
                    <FileText size={32} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-400">No tickets found in the system</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Info & Tips */}
          <div className="space-y-8">
            <div className="rounded-[1rem] bg-indigo-900 p-8 text-white shadow-2xl shadow-indigo-200/50 relative overflow-hidden group">
              <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl transition-transform group-hover:scale-110" />
              <h3 className="text-xl font-black mb-6 relative z-10">Sales Guidelines</h3>
              <div className="space-y-4 relative z-10 text-indigo-100 text-xs leading-relaxed">
                <div className="p-4 rounded-xl bg-white/10 border border-white/10">
                  <p className="font-bold text-white mb-1">Customer Linking</p>
                  <p>When raising a ticket, ensure you use the exact email address the customer used to create their account.</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/5">
                  <p className="font-bold text-white mb-1">Read-Only Safety</p>
                  <p>Sales representatives can monitor statuses and timelines to keep customers informed, but cannot modify RCA, statuses, or post replies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sublabel, color, bg }: any) {
  return (
    <div className="group relative overflow-hidden rounded-[1rem] border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/40 transition-all hover:-translate-y-1 hover:shadow-2xl">
      <div className="flex flex-col gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color} transition-transform group-hover:scale-110`}>
          {icon}
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">{label}</p>
          <h2 className="text-4xl font-black text-slate-900 leading-tight">{value}</h2>
        </div>
        <div className="pt-2 border-t border-slate-50 mt-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{sublabel}</span>
        </div>
      </div>
    </div>
  );
}
