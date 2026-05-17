"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Search, ArrowUpDown, Filter, ChevronDown, TrendingUp, Calendar } from "lucide-react";

interface Ticket {
  id: number;
  ticket_no: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-600",
  IN_PROGRESS: "bg-indigo-50 text-[#2a14b4]",
  ON_HOLD: "bg-amber-50 text-amber-600",
  ESCALATED: "bg-red-50 text-red-600",
  RESOLVED: "bg-slate-100 text-slate-600",
  CLOSED: "bg-slate-100 text-slate-400",
};


const statusOrder: Record<string, number> = {
  ESCALATED: 6,
  OPEN: 5,
  IN_PROGRESS: 4,
  ON_HOLD: 3,
  RESOLVED: 2,
  CLOSED: 1,
};

export default function AgentTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, currentPage: 1, limit: 10 });
  const [page, setPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"status" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets?page=${page}&limit=10`);
      setTickets(res.data.tickets);
      setPagination(res.data.pagination);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [page]);

  const filteredAndSortedTickets = useMemo(() => {
    let result = [...tickets];

    if (searchQuery.trim()) {
      let q = searchQuery.trim().toUpperCase();
      if (/^\d+$/.test(q)) {
        q = `TCK-${q}`;
      }
      result = result.filter(t => t.ticket_no.toUpperCase().includes(q));
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === "status") {
        comparison = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === "desc" ? -comparison : comparison;
    });

    return result;
  }, [tickets, searchQuery, sortField, sortOrder]);

  const activeCount = tickets.filter(t => ["OPEN", "IN_PROGRESS", "ON_HOLD", "ESCALATED"].includes(t.status)).length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] antialiased">
      <main className="mx-auto max-w-[1400px] p-6 md:p-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[32px] font-black tracking-tight text-slate-900 font-heading">
              My Work Queue
            </h1>
            <p className="text-base font-medium text-slate-500">
              You have {activeCount} tickets assigned to you
            </p>
          </div>

          {/* Search and Sort Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative group min-w-[280px]">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600" />
              <input
                type="text"
                placeholder="Search by ID (e.g. 10003)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-hidden"
              />
            </div>

            <div className="flex h-12 items-center rounded-lg border border-slate-200 bg-white px-2 py-1">
              <button
                onClick={() => {
                  if (sortField === "status") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  else { setSortField("status"); setSortOrder("desc"); }
                }}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${sortField === "status" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Filter size={14} />
                Status
                {sortField === "status" && <ArrowUpDown size={12} className="opacity-70" />}
              </button>
              <button
                onClick={() => {
                  if (sortField === "date") setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  else { setSortField("date"); setSortOrder("desc"); }
                }}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${sortField === "date" ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Calendar size={14} />
                Date
                {sortField === "date" && <ArrowUpDown size={12} className="opacity-70" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredAndSortedTickets.length === 0 ? (
              <div className="flex h-80 flex-col items-center justify-center text-slate-400">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50">
                  <Search size={32} />
                </div>
                <p className="text-lg font-black text-slate-900">No matching tickets</p>
                <p className="mt-1 text-sm font-medium">Try adjusting your search or filters</p>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/30">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ticket & Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSortedTickets.map((ticket) => (
                    <tr key={ticket.id} className="group transition-all hover:bg-slate-50/80">
                      <td className="px-8 py-6 font-black text-[#2a14b4]">
                        #{ticket.ticket_no}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 line-clamp-1">{ticket.subject}</span>
                          <span className="text-[11px] font-bold text-slate-400">{ticket.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tight ${statusColors[ticket.status] || "bg-slate-100"}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-500">
                        {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/employee/support-agent/tickets/${ticket.id}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-indigo-600 hover:text-white hover:border-indigo-600 hover:-translate-y-0.5 active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {!loading && pagination.pages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-50 bg-slate-50/30 px-8 py-5 sm:flex-row">
              <p className="text-sm font-bold text-slate-500">
                Showing <span className="text-slate-900">{((page - 1) * 10) + 1}</span> to <span className="text-slate-900">{Math.min(page * 10, pagination.total)}</span> of <span className="text-slate-900">{pagination.total}</span> tickets
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                  Previous
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-xs font-black transition-all ${
                        page === p 
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 " 
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}