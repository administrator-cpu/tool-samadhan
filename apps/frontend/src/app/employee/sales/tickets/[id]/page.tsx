"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Timeline from "../../../../../components/ChatBoxTimelineMessages";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, User as UserIcon, Calendar, Info } from "lucide-react";

interface TicketEvent {
  id: number;
  event_type: string;
  message: string;
  actor_name: string | null;
  created_at: string;
  metadata: any;
}

interface TicketData {
  ticket: {
    id: number;
    ticket_no: string;
    status: string;
    subject: string;
    created_at: string;
    updated_at: string;
    customer: {
      name: string;
      customer_id?: string;
      email?: string;
    };
    assigned_employee: {
      name: string;
    } | null;
    circuit_description: string | null;
    rca: string | null;
    problem_side: string | null;
    external_ticket_no: string | null;
    rating: number | null;
    rating_feedback: string | null;
  };
  events: TicketEvent[];
}

const getStatusBadgeConfig = (status: string) => {
  switch (status) {
    case "OPEN":
      return {
        dotClass: "bg-red-500",
        textClass: "text-red-600 bg-red-50 border-red-100",
      };
    case "IN_PROGRESS":
    case "ESCALATED":
      return {
        dotClass: "bg-amber-500",
        textClass: "text-amber-600 bg-amber-50 border-amber-100",
      };
    case "RESOLVED":
      return {
        dotClass: "bg-emerald-500",
        textClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
      };
    case "CLOSED":
    default:
      return {
        dotClass: "bg-slate-400",
        textClass: "text-slate-500 bg-slate-50 border-slate-100",
      };
  }
};

export default function SalesTicketDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id, fetchTicket]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-indigo-600"></div>
          <p className="text-sm font-bold text-slate-500 animate-pulse">Loading timeline...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { ticket, events } = data;
  const statusConfig = getStatusBadgeConfig(ticket.status);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col antialiased">
      {/* Header */}
      <header className="border-b border-slate-100 bg-white px-8 py-5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-4">
          <Link
            href="/employee/sales/tickets"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition-all hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-black text-slate-900 font-heading">
                Ticket #{ticket.ticket_no}
              </h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-tight ${statusConfig.textClass}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${statusConfig.dotClass}`} />
                {ticket.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-wider">{ticket.subject}</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-5 py-8 border-r border-slate-100 flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1">
            <Timeline events={events} />
          </div>
        </main>

        {/* Sidebar Info Panel */}
        <aside className="w-80 overflow-y-auto bg-white p-6 hidden lg:block shadow-xs border-l border-slate-100 space-y-6">
          
          {/* Assigned Agent */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Owner Assignment</h4>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserIcon size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">
                  {ticket.assigned_employee?.name || "Unassigned"}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Assigned Expert</p>
              </div>
            </div>
          </div>

          {/* Ticket Metadata */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Case Metadata</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-xs font-bold text-slate-400">Created</p>
                  <p className="text-sm font-medium text-slate-900">
                    {format(new Date(ticket.created_at), "MMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Profile */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Customer Profile</h4>
            <div className="space-y-3 text-slate-700">
              <div>
                <p className="text-xs font-bold text-slate-400">Full Name</p>
                <p className="text-sm font-black text-slate-900">{ticket.customer?.name}</p>
              </div>
              {ticket.customer?.email && (
                <div>
                  <p className="text-xs font-bold text-slate-400">Email Address</p>
                  <p className="text-sm font-medium text-slate-600 break-all">{ticket.customer.email}</p>
                </div>
              )}
            </div>
          </div>

          {/* Circuit Details */}
          {ticket.circuit_description && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info size={16} className="text-indigo-600" />
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Circuit Description</h4>
              </div>
              <p className="text-xs font-medium text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-xl p-3">
                {ticket.circuit_description}
              </p>
            </div>
          )}

          {/* Outage Information */}
          {(ticket.problem_side || ticket.external_ticket_no) && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Outage Information</h4>
              <div className="space-y-2 text-slate-700">
                {ticket.problem_side && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">Problem Side</span>
                    <span className="text-sm font-medium text-slate-800">{ticket.problem_side}</span>
                  </div>
                )}
                {ticket.external_ticket_no && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block">External Ticket No</span>
                    <span className="text-sm font-medium text-slate-800">{ticket.external_ticket_no}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* RCA Report */}
          {ticket.rca && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Root Cause Analysis (RCA)</h4>
              <p className="text-xs font-medium text-slate-600 leading-relaxed bg-white border border-slate-100 rounded-xl p-3">
                {ticket.rca}
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
