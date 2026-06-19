"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import ReassignModal from "@/components/ReassignModal";
import { toast } from "sonner";
import { Search, ArrowUpDown, Filter, ChevronDown, TrendingUp, Calendar, UserCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import CursorPagination from "@/components/CursorPagination";
import { useRef } from "react";

interface Ticket {
  id: number;
  ticket_no: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  customer_name: string;
  assigned_employee_name: string | null;
  current_assigned_employee_id: number | null;
  circuit_description?: string;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-50 text-emerald-600",
  IN_PROGRESS: "bg-indigo-50 text-[#2a14b4]",
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

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search and Sort states
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<"status" | "date">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [ownershipFilter, setOwnershipFilter] = useState<"ALL" | "ASSIGNED" | "UNASSIGNED">("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      sortField,
      sortOrder
    };
    if (ownershipFilter !== "ALL") params.ownership = ownershipFilter;
    if (statusFilter !== "ALL") params.status = statusFilter;
    if (searchQuery.trim()) params.searchQuery = searchQuery.trim();
    return params;
  }, [ownershipFilter, statusFilter, searchQuery, sortField, sortOrder]);

  const {
    currentPage,
    setCurrentPage,
    pageMap,
    resetPagination,
    handlePageResponse,
  } = useCursorPagination({
    fetchUrl: "/tickets",
    limit: 10,
    queryParams
  });

  const fetchTickets = async (page: number) => {
    try {
      setLoading(true);
      const cursor = pageMap[page]?.cursor;
      
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([k, v]) => params.append(k, v));
      if (cursor) params.append("cursor", cursor);
      params.append("limit", "10");

      const res = await api.get(`/tickets?${params.toString()}`);
      setTickets(res.data.tickets);
      
      const { nextCursor, hasNext } = res.data.pagination;
      handlePageResponse(page, nextCursor, hasNext);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const prevParamsRef = useRef(JSON.stringify(queryParams));

  useEffect(() => {
    const currentParamsStr = JSON.stringify(queryParams);
    if (prevParamsRef.current !== currentParamsStr) {
      resetPagination();
      prevParamsRef.current = currentParamsStr;
      return;
    }
    fetchTickets(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, queryParams]);

  const filteredAndSortedTickets = tickets;

  const openReassign = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsModalOpen(true);
  };

  const activeCount = tickets.filter(t => ["OPEN", "IN_PROGRESS"].includes(t.status)).length;
  const closedCount = tickets.filter(t => t.status === "CLOSED" || t.status === "RESOLVED").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] antialiased">
      <main className="mx-auto max-w-[1400px] p-6 md:p-10">
        <div className="mb-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-[32px] font-black tracking-tight text-slate-900 font-heading">
              Ticket Command Center
            </h1>
            <p className="text-base font-medium text-slate-500">
              Managing {activeCount} active requests across the fleet
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
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                }}
                className="h-12 w-full rounded-lg border border-slate-200 bg-white pl-11 pr-4 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all outline-hidden"
              />
            </div>

            <div className="flex h-12 items-center rounded-lg border border-slate-200 bg-white px-2 py-1 gap-1">
              <div className="relative">
                <button
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${statusFilter !== "ALL" ? "bg-emerald-600 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
                >
                  <Filter size={14} />
                  {statusFilter === "ALL" ? "Status" : statusFilter.replace("_", " ")}
                  <ChevronDown size={14} className={`opacity-70 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isStatusDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setIsStatusDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 w-48 rounded-lg border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                      {["ALL", "OPEN", "IN_PROGRESS", "ESCALATED", "RESOLVED", "CLOSED"].map((status) => (
                        <button
                          key={status}
                          onClick={() => {
                            setStatusFilter(status);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-xs font-bold transition-colors ${statusFilter === status ? "bg-slate-50 text-indigo-600" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
                        >
                          {status === "ALL" ? "All Statuses" : status.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  if (sortField === "date") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else { 
                    setSortField("date"); 
                    setSortOrder("desc"); 
                  }
                }}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${sortField === "date" ? "bg-emerald-700 text-white shadow-lg" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <Calendar size={14} />
                Date
                {sortField === "date" && <ArrowUpDown size={12} className="opacity-70" />}
              </button>

              <button
                onClick={() => {
                  const cycle: Record<string, "ALL" | "ASSIGNED" | "UNASSIGNED"> = {
                    ALL: "ASSIGNED",
                    ASSIGNED: "UNASSIGNED",
                    UNASSIGNED: "ALL"
                  };
                  setOwnershipFilter(cycle[ownershipFilter]);
                }}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition-all ${ownershipFilter !== "ALL" ? "bg-slate-900 text-white shadow-lg shadow-slate-200" : "text-slate-500 hover:bg-slate-50"}`}
              >
                <UserCheck size={14} />
                {ownershipFilter === "ALL" ? "Ownership" : 
                 ownershipFilter === "ASSIGNED" ? "Assigned" : "Unassigned"}
              </button>

            </div>
          </div>
        </div>

        {/* Summary Cards */}
        {/*<section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard 
            icon="pending_actions" 
            label="Active Tickets" 
            value={activeCount} 
            color="text-[#2a14b4]" 
            bg="bg-indigo-50" 
          />
          <SummaryCard 
            icon="task_alt" 
            label="Resolved" 
            value={closedCount} 
            color="text-emerald-600" 
            bg="bg-emerald-50" 
          />
        </section>*/}

        {/* Tickets Table */}
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-2xl shadow-slate-200/40">
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
                  <tr className="border-b border-slate-200 bg-slate-50/50">
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Reference</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Circuit / BTS Id</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ticket & Customer</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ownership</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Last Updated</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAndSortedTickets.map((ticket) => (
                    <tr key={ticket.id} className="group transition-all hover:bg-slate-50/80">
                      <td className="px-8 py-6 font-bold text-sm text-emerald-700">
                        {ticket.ticket_no}
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-600">
                        {ticket.circuit_description || "N/A"}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 line-clamp-1">{ticket.subject}</span>
                          <span className="text-[11px] font-bold text-slate-400">{ticket.customer_name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <button
                          onClick={() => openReassign(ticket)}
                          className={`flex items-center gap-2 group/btn rounded-sm px-3 py-2 -ml-3 transition-all hover:bg-white hover:shadow-sm ring-1 ring-transparent hover:ring-slate-100 ${!ticket.assigned_employee_name ? 'text-amber-600' : 'text-slate-700'}`}
                        >
                          <span className="text-xs font-bold">
                            {ticket.assigned_employee_name || "Unassigned"}
                          </span>
                          <ChevronDown size={14} className="opacity-40 group-hover/btn:opacity-100" />
                        </button>
                      </td>
                      <td className="px-2 py-6">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-tight ${statusColors[ticket.status] || "bg-slate-100"}`}>
                          {ticket.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-slate-500">
                        {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <Link
                          href={`/employee/admin/tickets/${ticket.id}`}
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
          <CursorPagination
            currentPage={currentPage}
            pageMap={pageMap}
            onPageChange={setCurrentPage}
            loading={loading}
          />
        </section>
      </main>

      {selectedTicket && (
        <ReassignModal
          isOpen={isModalOpen}
          ticketId={selectedTicket.id}
          currentAgentId={selectedTicket.current_assigned_employee_id}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => fetchTickets(currentPage)}
        />
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, color, bg }: { icon: string, label: string, value: number, color: string, bg: string }) {
  return (
    <div className="flex items-center gap-5 rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${bg} ${color}`}>
        <span className="material-symbols-outlined text-[28px]">{icon}</span>
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <h2 className="text-3xl font-black text-slate-900">{value}</h2>
      </div>
    </div>
  );
}