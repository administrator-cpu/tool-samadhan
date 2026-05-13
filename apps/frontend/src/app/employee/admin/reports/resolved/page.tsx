"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { 
  History, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  X, 
  User, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  ShieldCheck
} from "lucide-react";

interface Ticket {
  id: number;
  ticket_no: string;
  category_name: string;
  status: string;
  priority: string;
  rca: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  customer_id: string;
  customer_name: string;
  assigned_agent_name: string | null;
}

interface Pagination {
  total: number;
  pages: number;
  currentPage: number;
  limit: number;
}

export default function ResolvedTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // RCA Modal state
  const [selectedRca, setSelectedRca] = useState<Ticket | null>(null);

  const fetchTickets = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get(`/tickets/resolved?page=${page}&limit=10`);
      setTickets(res.data.tickets);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch resolved tickets");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(currentPage);
  }, [currentPage, fetchTickets]);

  const handleDownloadCSV = async () => {
    setExporting(true);
    try {
      // Fetch ALL resolved tickets for export
      const res = await api.get("/tickets/resolved?exportAll=true");
      const allTickets: Ticket[] = res.data.tickets;

      if (allTickets.length === 0) {
        toast.info("No data available to export");
        return;
      }

      // Generate CSV
      const headers = [
        "Ticket No",
        "Customer ID",
        "Customer Name",
        "Assigned Agent",
        "Category",
        "Status",
        "Priority",
        "Created At",
        "Resolved At",
        "Closed At",
        "Root Cause Analysis (RCA)"
      ];

      const csvRows = allTickets.map(t => [
        t.ticket_no,
        t.customer_id,
        `"${t.customer_name.replace(/"/g, '""')}"`,
        `"${(t.assigned_agent_name || "Unassigned").replace(/"/g, '""')}"`,
        `"${(t.category_name || "N/A").replace(/"/g, '""')}"`,
        t.status,
        t.priority,
        format(new Date(t.created_at), "yyyy-MM-dd HH:mm:ss"),
        t.resolved_at ? format(new Date(t.resolved_at), "yyyy-MM-dd HH:mm:ss") : "N/A",
        t.closed_at ? format(new Date(t.closed_at), "yyyy-MM-dd HH:mm:ss") : "N/A",
        `"${(t.rca || "No RCA documented").replace(/"/g, '""')}"`
      ].join(","));

      const csvContent = [headers.join(","), ...csvRows].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Samadhan_Resolution_Log_${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Resolution Log exported successfully");
    } catch (err: any) {
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-(--break-2xl) mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <History size={24} />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">Resolution Log</h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Audit & RCA History</p>
            </div>
          </div>

          <button
            onClick={handleDownloadCSV}
            disabled={exporting || tickets.length === 0}
            className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-5 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50"
          >
            {exporting ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
                Preparing...
              </span>
            ) : (
              <>
                <Download size={18} className="text-indigo-600" />
                Export Full Log
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-(--break-2xl) mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Table Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ticket Info</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Customer</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Assignee</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Category</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">RCA Summary</th>
                  <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8">
                        <div className="h-10 bg-slate-100 rounded-xl w-full" />
                      </td>
                    </tr>
                  ))
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-300">
                          <AlertCircle size={32} />
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No resolved tickets found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                            {ticket.ticket_no}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{ticket.priority} PRIORITY</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                            <User size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-700">{ticket.customer_name}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{ticket.customer_id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${ticket.assigned_agent_name ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                          <span className="text-xs font-bold text-slate-600">
                            {ticket.assigned_agent_name || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-flex items-center rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-600 uppercase tracking-tight">
                          {ticket.category_name || "Other"}
                        </span>
                      </td>
                      <td className="px-6 py-5 max-w-xs">
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-medium text-slate-600 line-clamp-2 leading-relaxed">
                            {ticket.rca || "No root cause analysis documented for this resolution."}
                          </p>
                          <button 
                            onClick={() => setSelectedRca(ticket)}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest flex items-center gap-1 w-fit"
                          >
                            <Eye size={12} />
                            View More
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-600">
                            <CheckCircle2 size={12} />
                            {format(new Date(ticket.resolved_at || ticket.closed_at || ticket.updated_at), "MMM dd, yyyy · hh:mm a")}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            Resolved In {(() => {
                              const start = new Date(ticket.created_at).getTime();
                              const end = new Date(ticket.resolved_at || ticket.closed_at || ticket.updated_at).getTime();
                              const diff = end - start;
                              const hrs = Math.floor(diff / (1000 * 60 * 60));
                              const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                              return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
                            })()}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-6 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Showing {tickets.length} of {pagination.total} entries
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || loading}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.pages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`h-9 w-9 rounded-xl text-xs font-black transition-all ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                          : "bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
                      }`}
                    >
                      {i + 1}
                    </button>
                  )).slice(Math.max(0, currentPage - 3), Math.min(pagination.pages, currentPage + 2))}
                </div>
                <button
                  onClick={() => setCurrentPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={currentPage === pagination.pages || loading}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* RCA Detail Modal */}
      {selectedRca && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedRca(null)}
          />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-slate-900/20 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Root Cause Analysis</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-black bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded uppercase tracking-widest border border-emerald-100">Verified</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Case #{selectedRca.ticket_no}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedRca(null)}
                  className="h-10 w-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <User size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned Specialist</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">{selectedRca.assigned_agent_name || "System Automated"}</p>
                </div>
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={12} className="text-slate-400" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Resolution Date</span>
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    {format(new Date(selectedRca.resolved_at || selectedRca.closed_at || selectedRca.updated_at), "MMMM dd, yyyy · hh:mm a")}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2 text-slate-900">
                  <Hash size={16} className="text-indigo-600" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em]">Investigation Report</h4>
                </div>
                <div className="p-8 rounded-[2rem] bg-indigo-50/50 border border-indigo-100/50">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                    "{selectedRca.rca || "No technical root cause has been documented for this ticket yet."}"
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button 
                  onClick={() => setSelectedRca(null)}
                  className="px-8 py-3 rounded-2xl bg-slate-900 text-white text-sm font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
