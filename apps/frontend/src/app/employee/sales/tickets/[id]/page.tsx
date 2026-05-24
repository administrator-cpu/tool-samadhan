"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Timeline from "@/components/ChatBoxTimelineMessages";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, User as UserIcon, Calendar, Info } from "lucide-react";
import Image from "next/image";
import AgentImage from "@/assets/agent.png";
import ProviderOutageTracker from "@/components/ProviderOutageTracker";

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
        pingClass: "bg-red-400",
        textClass: "text-red-600 bg-red-50 border-red-100",
      };
    case "IN_PROGRESS":
    case "ESCALATED":
      return {
        dotClass: "bg-amber-500",
        pingClass: "bg-amber-400",
        textClass: "text-amber-600 bg-amber-50 border-amber-100",
      };
    case "RESOLVED":
      return {
        dotClass: "bg-emerald-500",
        pingClass: "bg-emerald-400",
        textClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
      };
    case "CLOSED":
    default:
      return {
        dotClass: "bg-slate-400",
        pingClass: "bg-slate-300",
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
    <div className="h-screen bg-[#F8FAFC] flex flex-col antialiased overflow-hidden">
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

        {/* Sidebar */}
        <aside className="w-[260px] bg-white overflow-y-auto p-6 flex flex-col gap-6 shrink-0 hidden lg:flex">
          <section className="space-y-6">
            <div>
              <h3 className="text-sm font-black text-slate-900 tracking-widest flex items-center gap-2 mb-4">
                Ticket Details
              </h3>

              <div className="space-y-5">
                {/* Status */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {ticket.status !== "CLOSED" && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.pingClass}`}></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.dotClass}`}></span>
                    </span>
                    <span className={`text-sm font-bold uppercase ${statusConfig.textClass.split(" ")[0]}`}>{ticket.status.replace(/_/g, " ")}</span>
                  </div>
                </div>

                {/* Customer */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Customer</p>
                  <p className="text-[14px] font-bold text-slate-900">{ticket.customer?.name}</p>
                  {ticket.customer?.email && (
                    <span className="text-[10px] font-bold text-slate-400 lowercase block mt-0.5">
                      {ticket.customer.email}
                    </span>
                  )}
                </div>

                {/* Opened On */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Opened On</p>
                  <p className="text-[14px] font-bold text-slate-900">
                    {format(new Date(ticket.created_at), "MMM d, yyyy, h:mm a")}
                  </p>
                </div>

                {/* Last Updated */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Last Updated</p>
                  <p className="text-[14px] font-bold text-slate-900">
                    {format(new Date(ticket.updated_at), "MMM d, yyyy, h:mm a")}
                  </p>
                </div>

                {/* Circuit ID */}
                {ticket.circuit_description && (
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Circuit ID</p>
                    <p className="text-[14px] font-bold text-slate-900">{ticket.circuit_description}</p>
                  </div>
                )}

                {/* Outage Details */}
                <ProviderOutageTracker
                  ticketId={ticket.id}
                  problemSide={ticket.problem_side}
                  externalTicketNo={ticket.external_ticket_no}
                  readOnly={true}
                  onUpdate={() => {
                    fetchTicket();
                  }}
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* RCA Report */}
            {ticket.rca && (
              <>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Root Cause Analysis</p>
                  <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                    {ticket.rca}
                  </p>
                </div>
                <hr className="border-slate-100" />
              </>
            )}

            {/* Assigned Agent */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Assigned Agent</p>
              <div className="flex items-center gap-3">
                <Image src={AgentImage} alt="" width={36} height={36} className="rounded-full shadow-xs ring-2 ring-slate-100" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{ticket.assigned_employee?.name || "Not Assigned"}</p>
                  <p className="text-[10px] font-medium text-slate-500">Support Specialist</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
