"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  AlertTriangle,
  Clock,
  Repeat,
  Wrench,
  CalendarDays
} from "lucide-react";

interface FaultCustomer {
  customer_name: string;
  customer_id: number;
  fault_count: number;
}

interface DowntimeCustomer {
  customer_name: string;
  customer_id: number;
  total_downtime_hours: number;
  active_links: number;
}

interface RepeatFaultLink {
  link_id: string;
  fault_count: number;
}

interface MttrLink {
  link_id: string;
  mttr_hours: number;
}

interface AdminDristhiMetrics {
  topFaultsCustomers: FaultCustomer[];
  topDowntimeCustomers: DowntimeCustomer[];
  topRepeatFaultLinks: RepeatFaultLink[];
  topMttrLinks: MttrLink[];
}

const getMonthOptions = () => {
  const options = [];
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  const startYear = 2026;
  const startMonth = 6; // July
  
  const startMonthForYear = currentYear === startYear ? startMonth : 0;
  
  for (let m = currentMonth; m >= startMonthForYear; m--) {
    const date = new Date(currentYear, m, 1);
    const value = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    options.push({ value, label });
  }
  
  return options;
};

export default function AdminDristhiPage() {
  const monthOptions = getMonthOptions();
  const initialMonth = monthOptions.length > 0 ? monthOptions[0].value : '2026-07';
  
  const [timeWindow, setTimeWindow] = useState<string>(initialMonth);
  const [metrics, setMetrics] = useState<AdminDristhiMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/tickets/admin-dristhi?timeWindow=${timeWindow}`);
        setMetrics(res.data);
      } catch (error) {
        toast.error("Failed to load Drishti metrics");
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [timeWindow]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-6 lg:p-10 antialiased">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 w-full">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Drishti</h1>
          <p className="text-sm text-slate-500 mt-1">Deep insights into customer and network reliability</p>
        </div>
        <div className="ml-auto flex items-center bg-white rounded-xl shadow-sm border border-slate-200 px-3 py-1.5 hover:border-slate-300 transition-colors">
          <CalendarDays className="w-4 h-4 text-slate-400 mr-2" />
          <select 
            value={timeWindow} 
            onChange={(e) => setTimeWindow(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-700 focus:outline-none focus:ring-0 cursor-pointer outline-none border-none pr-1"
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-6 h-64 flex flex-col">
              <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100"></div>
                <div className="flex flex-col gap-2">
                  <div className="h-4 w-32 bg-slate-100 rounded"></div>
                  <div className="h-3 w-48 bg-slate-50 rounded"></div>
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-4">
                <div className="h-8 w-full bg-slate-50 rounded"></div>
                <div className="h-8 w-full bg-slate-50 rounded"></div>
                <div className="h-8 w-3/4 bg-slate-50 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Card 1: Top Faults */}
          {/* <div className="bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#D9430F] border border-orange-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Highest Faults</h2>
                <p className="text-xs text-slate-500">Top 10 Customers by total ticket count</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {metrics.topFaultsCustomers.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No data available</p>}
              {metrics.topFaultsCustomers.map((cust, idx) => (
                <div key={cust.customer_id} className="flex items-center justify-between group rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300 w-4">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{cust.customer_name}</span>
                  </div>
                  <div className="bg-orange-50 text-[#D9430F] px-3 py-1 rounded-full text-xs font-bold border border-orange-100 shadow-sm">
                    {cust.fault_count} faults
                  </div>
                </div>
              ))}
            </div>
          </div> */}

          {/* Card 2: Highest Downtime % */}
          {/* <div className="bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-100">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Highest % Downtime</h2>
                <p className="text-xs text-slate-500">Top 10 Customers (Link Down issues only)</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {metrics.topDowntimeCustomers.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No data available</p>}
              {metrics.topDowntimeCustomers.map((cust, idx) => {
                const avgDowntime = cust.active_links ? (cust.total_downtime_hours / cust.active_links).toFixed(1) : 0;
                return (
                  <div key={cust.customer_id} className="flex items-center justify-between group rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-300 w-4">{idx + 1}.</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-700 group-hover:text-slate-900">{cust.customer_name}</span>
                        <span className="text-[11px] font-medium text-slate-400">{cust.active_links} active links</span>
                      </div>
                    </div>
                    <div className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold border border-red-100 shadow-sm">
                      {avgDowntime} hrs / link
                    </div>
                  </div>
                );
              })}
            </div>
          </div> */}

          {/* Card 3: Repeat Faults */}
          <div className="bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Repeat className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Repeat Faults</h2>
                <p className="text-xs text-slate-500">Top 10 Links with recurring issues (Link Down, Packet Loss, Latency)</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {metrics.topRepeatFaultLinks.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No data available</p>}
              {metrics.topRepeatFaultLinks.map((link, idx) => (
                <div key={link.link_id + idx} className="flex items-center justify-between group rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300 w-4">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-slate-700 font-mono group-hover:text-slate-900">{link.link_id}</span>
                  </div>
                  <div className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold border border-amber-100 shadow-sm">
                    {link.fault_count} times
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: MTTR */}
          <div className="bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100 p-6 transition-all hover:shadow-lg">
            <div className="flex items-center gap-3 mb-6 border-b border-slate-50 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                <Wrench className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Highest MTTR</h2>
                <p className="text-xs text-slate-500">Top 10 Links with longest repair time (Link Down, Packet Loss, Latency)</p>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {metrics.topMttrLinks.length === 0 && <p className="text-slate-400 text-sm text-center py-6">No data available</p>}
              {metrics.topMttrLinks.map((link, idx) => (
                <div key={link.link_id + idx} className="flex items-center justify-between group rounded-xl p-3 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-slate-300 w-4">{idx + 1}.</span>
                    <span className="text-sm font-semibold text-slate-700 font-mono group-hover:text-slate-900">{link.link_id}</span>
                  </div>
                  <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100 shadow-sm">
                    {Number(link.mttr_hours).toFixed(1)} hrs
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      ) : (
        <div className="flex h-64 items-center justify-center">
          <p className="text-slate-500 font-medium">No data found.</p>
        </div>
      )}
    </div>
  );
}
