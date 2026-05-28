"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Timeline from "@/components/ChatBoxTimelineMessages";
import Lightbox from "@/components/Lightbox";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";
import Image from "next/image";
import AgentImage from "@/assets/agent.png";

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
      phone?: string;
    };
    assigned_employee: {
      name: string;
      profile_image?: string | null;
    } | null;
    circuit_description: string | null;
    rca: string | null;
    rca_images?: string[];
    problem_side: string | null;
    telco_sr_number: string | null;
    rating: number | null;
    rating_feedback: string | null;
    alternate_email?: string | null;
    resolved_at?: string | null;
    closed_at?: string | null;
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
  const [lightboxData, setLightboxData] = useState<{ images: string[], currentIndex: number } | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async (updates: { status?: string }) => {
    setUpdating(true);
    try {
      await api.patch(`/tickets/${id}/status`, updates);
      toast.success("Ticket updated successfully");
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setData(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load ticket details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

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

        {/* Reopen Button */}
        {ticket.status === "RESOLVED" && ticket.resolved_at && (() => {
          const resolvedAt = new Date(ticket.resolved_at);
          const now = new Date();
          const diffHours = (now.getTime() - resolvedAt.getTime()) / (1000 * 60 * 60);

          if (diffHours <= 24) {
            return (
              <button
                onClick={() => handleUpdate({ status: "REOPENED" })}
                disabled={updating}
                className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                Reopen Ticket
              </button>
            );
          }
          return null;
        })()}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-5 py-8 border-r border-slate-100 flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1">
            <Timeline events={events} />

            {/* RCA Report in Main Chat Box */}
            {["RESOLVED", "CLOSED"].includes(ticket.status) && ticket.rca && (
              <div className="mt-10 pt-10 border-t border-slate-100 pb-10">
                <div className="mb-6 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Root Cause Analysis</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Internal Investigation Report</p>
                  </div>
                </div>

                <div className="relative rounded-lg border border-slate-100 bg-slate-50/50 p-6 shadow-sm">
                  <div className="whitespace-pre-line text-sm font-medium text-slate-800 leading-relaxed">
                    {ticket.rca}
                  </div>
                  {ticket.rca_images && ticket.rca_images.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {ticket.rca_images.map((img, idx) => (
                        <button 
                          key={idx} 
                          onClick={() => setLightboxData({ images: ticket.rca_images!, currentIndex: idx })} 
                          type="button" 
                          className="relative aspect-square rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:opacity-90 hover:scale-[1.02] transition-all bg-slate-100 cursor-zoom-in"
                        >
                          <Image src={img} alt={`RCA Image ${idx + 1}`} fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                  <p className="text-[14px] font-bold text-slate-900">{ticket.customer.name}</p>
                  {ticket.customer.phone && (
                    <span className="text-[11px] font-bold text-slate-400 block mt-0.5">
                      +91 {ticket.customer.phone}
                    </span>
                  )}
                  {ticket.customer.email && (
                    <span className="text-[11px] font-bold text-slate-400 lowercase block mt-0.5">
                      {ticket.customer.email}
                    </span>
                  )}
                  {ticket.alternate_email && (
                    <span className="text-[11px] font-bold text-slate-400 lowercase block mt-0.5" title="Alternate Email">
                      alt: {ticket.alternate_email}
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


              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Assigned Agent */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Assigned Agent</p>
              <div className="flex items-center gap-3">
                {ticket.assigned_employee?.profile_image ? (
                  <Image
                    src={ticket.assigned_employee.profile_image} 
                    alt="Agent" 
                    width={36} height={36}
                    className="object-cover rounded-full shadow-xs ring-2 ring-slate-100" 
                  />
                ) : (
                  <Image src={AgentImage} alt="" width={36} height={36} className="rounded-full shadow-xs ring-2 ring-slate-100" />
                )}
                <div>
                  <p className="text-sm font-bold text-slate-900">{ticket.assigned_employee?.name || "Not Assigned"}</p>
                  <p className="text-[10px] font-medium text-slate-500">Support Specialist</p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {lightboxData && (
        <Lightbox
          images={lightboxData.images}
          initialIndex={lightboxData.currentIndex}
          onClose={() => setLightboxData(null)}
        />
      )}
    </div>
  );
}
