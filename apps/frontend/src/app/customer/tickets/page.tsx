"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface Ticket {
  id: number;
  ticket_no: string;
  subject: string;
  status: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const getStatusClassName = (status: string) => {
  switch (status) {
    case "OPEN":
      return "bg-blue-100 text-blue-700";
    case "IN_PROGRESS":
      return "bg-indigo-100 text-[#2a14b4]";
    case "ON_HOLD":
      return "bg-amber-100 text-amber-700";
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700";
    case "CLOSED":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ total: 0, pages: 0, currentPage: 1, limit: 10 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tickets?page=${page}&limit=10`);
        setTickets(response.data.tickets || []);
        setPagination(response.data.pagination || { total: 0, pages: 0, currentPage: 1, limit: 10 });
      } catch (err: any) {
        console.error("Failed to fetch tickets:", err);
        setError("Failed to load tickets. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [page]);

  const activeTicketsCount = tickets.filter(t => !["RESOLVED", "CLOSED"].includes(t.status)).length;
  const closedTicketsCount = tickets.filter(t => ["RESOLVED", "CLOSED"].includes(t.status)).length;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-900">
      <main className="mx-auto w-full max-w-[1400px] p-6 md:p-10">
        {/* Page Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
              My Tickets
            </h1>
            <p className="text-base text-slate-500">
              Track and manage your support requests
            </p>
          </div>

          <Link
            href="/customer/raise-new-ticket"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:opacity-90 active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Raise New Ticket
          </Link>
        </div>

        {/* Summary Cards */}
        <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-row gap-4 items-center rounded-2xl p-6 bg-white border border-slate-100 shadow-sm shadow-indigo-500/5">
            <span className="material-symbols-outlined text-4xl text-[#2a14b4]">
              pending_actions
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Active Tickets
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {activeTicketsCount}
              </h2>
            </div>
          </div>

          <div className="flex flex-row gap-4 items-center rounded-2xl p-6 bg-white border border-slate-100 shadow-sm shadow-indigo-500/5">
            <span className="material-symbols-outlined text-4xl text-emerald-500">
              task_alt
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Closed Tickets
              </p>
              <h2 className="text-3xl font-extrabold text-slate-900">
                {closedTicketsCount}
              </h2>
            </div>
          </div>
        </section>

        {/* Tickets Table */}
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
              </div>
            ) : error ? (
              <div className="p-10 text-center text-red-500">{error}</div>
            ) : tickets.length === 0 ? (
              <div className="p-20 text-center text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4">confirmation_number</span>
                <p>No tickets found. Raise a new one if you need help!</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ticket ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Issue Category
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-6 font-bold text-emerald-700">
                        {ticket.ticket_no}
                      </td>
                      <td className="px-6 py-6">
                        <span className="block text-base font-normal font-heading text-slate-600">
                          {ticket.subject}
                        </span>
                      </td>
                      <td className="px-6 py-6">
                        <span
                          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${getStatusClassName(ticket.status)}`}
                        >
                          {ticket.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-6 py-6 text-sm text-slate-500">
                        {formatDistanceToNow(new Date(ticket.updated_at), { addSuffix: true })}
                      </td>
                      <td className="px-6 py-6 text-right">
                        <Link
                          href={`/customer/tickets/${ticket.id}`}
                          aria-label={`View ticket ${ticket.ticket_no}`}
                          className="
    group inline-flex items-center gap-1.5 rounded-lg
    border border-emerald-700 bg-white px-3 py-1.5
    text-sm font-medium text-emerald-700
    shadow-sm transition-all duration-200
    hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 hover:shadow
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
    active:translate-y-0
  "
                        >
                          <span>View</span>

                          <span
                            className="
      material-symbols-outlined text-[18px] leading-none
      transition-transform duration-200
      group-hover:translate-x-0.5
    "
                          >
                            chevron_right
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!loading && tickets.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/30 px-6 py-4">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-slate-500">
                  Showing <span className="font-bold text-slate-900">{((page - 1) * pagination.limit) + 1}</span> to{" "}
                  <span className="font-bold text-slate-900">{Math.min(page * pagination.limit, pagination.total)}</span> of{" "}
                  <span className="font-bold text-slate-900">{pagination.total}</span> tickets
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-lg">chevron_left</span>
                  Previous
                </button>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-700 font-bold text-white shadow-lg shadow-emerald-700/20">
                  {page}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition-all hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}