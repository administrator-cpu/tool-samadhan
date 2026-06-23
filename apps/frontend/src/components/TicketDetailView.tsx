"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import AgentImage from "@/assets/agent.png";
import Timeline from "@/components/ChatBoxTimelineMessages";
import { api } from "@/lib/api";
import { quickReplies } from "@/lib/quickReplies";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { ChevronDown, CheckCircle2, XCircle, TrendingUp, User as UserIcon, Calendar, Info, Send, MessageSquare, Zap } from "lucide-react";
import ProviderOutageTracker from "@/components/ProviderOutageTracker";
import { useSocket } from "@/hooks/useSocket";
import { useSocketStore } from "@/store/useSocketStore";
import TicketReplyForm from "./ticket/TicketReplyForm";
import TicketRcaEditor from "./ticket/TicketRcaEditor";
import ReopenTicketModal from "@/components/ReopenTicketModal";

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
    allow_customer_reply: boolean;
    resolved_at?: string | null;
    alternate_email?: string | null;
  };
  events: TicketEvent[];
}

const getStatusBadgeConfig = (status: string) => {
  switch (status) {
    case "OPEN":
      return {
        dotClass: "bg-red-500",
        pingClass: "bg-red-400",
        textClass: "text-red-600",
      };
    case "IN_PROGRESS":
    case "ESCALATED":
      return {
        dotClass: "bg-amber-500",
        pingClass: "bg-amber-400",
        textClass: "text-amber-600",
      };
    case "RESOLVED":
      return {
        dotClass: "bg-emerald-500",
        pingClass: "bg-emerald-400",
        textClass: "text-emerald-600",
      };
    case "CLOSED":
    default:
      return {
        dotClass: "bg-slate-400",
        pingClass: "bg-slate-300",
        textClass: "text-slate-500",
      };
  }
};

interface TicketDetailViewProps {
  userRole: "ADMIN" | "AGENT";
  basePath: string;
  replyEventType: "ADMIN_REPLY" | "AGENT_REPLY";
}

export default function TicketDetailView({ userRole, basePath, replyEventType }: TicketDetailViewProps) {
  const { id } = useParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [sending, setSending] = useState(false);
  const [savingRca, setSavingRca] = useState(false);
  const [togglingReply, setTogglingReply] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  const statusConfig = data?.ticket ? getStatusBadgeConfig(data.ticket.status) : { dotClass: "", pingClass: "", textClass: "" };

  const fetchTicket = useCallback(async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setData(res.data);
    } catch (err: any) {
      if (err.code === "SESSION_CLEARED_SILENT") return;
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

  const { socket } = useSocket(id as string);
  const markEventSeen = useSocketStore((state) => state.markEventSeen);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: any) => {
      console.log("[SOCKET] Received update:", data);

      if (data.event) {
        setData((prev) => {
          if (!prev) return null;
          if (prev.events.some((e) => e.id === data.event.id)) return prev;

          return {
            ...prev,
            events: [...prev.events, data.event].sort((a, b) => a.id - b.id)
          };
        });
        markEventSeen(Number(id), data.event.id);
      }

      if (data.type === "NEW_EVENT") {
        // No toast needed, the message is automatically appended to the timeline above
      } else if (data.type === "REPLY_TOGGLED") {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ticket: { ...prev.ticket, allow_customer_reply: data.allow_customer_reply }
          };
        });
        toast.info(`Customer reply ${data.allow_customer_reply ? "enabled" : "disabled"}`);
      } else if (data.type === "TICKET_STATUS_UPDATED") {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ticket: { ...prev.ticket, ...data.ticket }
          };
        });
        toast.success(`Ticket status updated to ${data.ticket?.status || "a new status"}`);
      } else if (data.type === "TICKET_ASSIGNED") {
        toast.info("Ticket assignment has been updated");
      } else if (data.type === "OUTAGE_DETAILS_UPDATED") {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ticket: { ...prev.ticket, ...data.ticket }
          };
        });
        toast.info("Provider outage details updated in real-time");
      } else if (data.type === "TICKET_RCA_UPDATED") {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ticket: { ...prev.ticket, rca: data.rca }
          };
        });
        toast.info("Root Cause Analysis (RCA) report has been updated!");
      } else if (data.type === "TICKET_RATING_UPDATED") {
        setData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ticket: { ...prev.ticket, rating: data.rating, rating_feedback: data.rating_feedback }
          };
        });
        toast.info("Customer has submitted feedback rating!");
      }
    };

    const handleMissedEvents = (data: { ticketId: number, events: TicketEvent[] }) => {
      if (Number(data.ticketId) !== Number(id)) return;

      console.log(`[SOCKET] Received ${data.events.length} missed events for ${userRole.toLowerCase()}`);
      setData((prev) => {
        if (!prev) return null;
        const newEvents = data.events.filter(e => !prev.events.some(p => p.id === e.id));
        if (newEvents.length === 0) return prev;

        const combinedEvents = [...prev.events, ...newEvents].sort((a, b) => a.id - b.id);

        const lastEvent = combinedEvents[combinedEvents.length - 1];
        if (lastEvent) {
          markEventSeen(Number(id), lastEvent.id);
        }

        return {
          ...prev,
          events: combinedEvents
        };
      });

      toast.info(`Synced ${data.events.length} missed updates`);
    };

    socket.on("ticket_update", handleUpdate);
    socket.on("missed_events", handleMissedEvents);

    return () => {
      socket.off("ticket_update", handleUpdate);
      socket.off("missed_events", handleMissedEvents);
    };
  }, [socket, id, markEventSeen, userRole]);

  // Mark initial events as seen
  useEffect(() => {
    if (data?.events?.length && id) {
      const lastEvent = data.events[data.events.length - 1];
      markEventSeen(Number(id), lastEvent.id);
    }
  }, [data?.events?.length, id, markEventSeen]);




  const handleUpdate = async (updates: { status?: string; message?: string }) => {
    setUpdating(true);
    try {
      await api.patch(`/tickets/${id}/status`, updates);
      toast.success("Ticket updated successfully");
      await fetchTicket();
    } catch (err: any) {
      if (err.code === "SESSION_CLEARED_SILENT") return;
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };
  const handleUpdateRca = async (formData: FormData) => {
    try {
      setSavingRca(true);
      await api.patch(`/tickets/${id}/rca`, formData);
      toast.success("Root Cause Analysis updated successfully");
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to update RCA");
    } finally {
      setSavingRca(false);
    }
  };

  const handleSendReply = async (message: string, sendEmail: boolean, attachments?: File[]) => {
    if (!message.trim() && (!attachments || attachments.length === 0)) return;
    setSending(true);
    try {
      if (attachments && attachments.length > 0) {
        const formData = new FormData();
        formData.append("event_type", replyEventType);
        formData.append("message", message.trim());
        formData.append("send_email", String(sendEmail));
        
        attachments.forEach(file => {
          formData.append("files", file);
        });

        await api.post(`/tickets/${id}/events`, formData);
      } else {
        await api.post(`/tickets/${id}/events`, {
          event_type: replyEventType,
          message: message.trim(),
          send_email: sendEmail
        });
      }

      toast.success("Reply sent");
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const handleToggleCustomerReply = async () => {
    if (!data?.ticket) return;
    setTogglingReply(true);
    try {
      await api.patch(`/tickets/${id}/reply-status`, {
        allowCustomerReply: !data.ticket.allow_customer_reply
      });
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to toggle customer reply");
    } finally {
      setTogglingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!data) return null;

  const { ticket, events } = data;

  return (
    <div className="h-screen flex flex-col bg-white text-slate-900 antialiased overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center px-6 py-4 bg-white border-b border-slate-200 shadow-xs">
        <Link
          href={basePath}
          className="mr-6 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 break-words">{ticket.subject}</h1>
            <span className="px-2.5 py-0.5 rounded-md text-[12px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200">
              #{ticket.ticket_no}
            </span>
          </div>
          <p className="text-sm font-medium text-slate-500">Opened by {ticket.customer.name}</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {ticket.status !== "CLOSED" && (
            <>
              {/* Customer Reply Toggle */}
              <button
                onClick={handleToggleCustomerReply}
                disabled={updating || togglingReply || ticket.status === "RESOLVED"}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all disabled:opacity-50 ${
                  ticket.allow_customer_reply
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <MessageSquare size={18} />
                {ticket.allow_customer_reply ? "Customer Reply ON" : "Customer Reply OFF"}
              </button>

              {ticket.status !== "RESOLVED" && (
                <>
                  {/* Resolve Button - For everything except CLOSED/RESOLVED */}
                  <button
                    onClick={() => handleUpdate({ status: "RESOLVED" })}
                    disabled={updating}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-600 hover:bg-emerald-100 transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 size={18} />
                    Resolve
                  </button>

                  {/* Escalate Button - For OPEN or IN_PROGRESS */}
                  {["OPEN", "IN_PROGRESS"].includes(ticket.status) && (
                    <button
                      onClick={() => handleUpdate({ status: "ESCALATED" })}
                      disabled={updating}
                      className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 shadow-lg shadow-red-200 transition-all disabled:opacity-50"
                    >
                      <TrendingUp size={18} />
                      Escalate
                    </button>
                  )}
                </>
              )}

              {/* Close Button - Only when RESOLVED and RCA is filled */}
              {ticket.status === "RESOLVED" && ticket.rca && (
                <button
                  onClick={() => handleUpdate({ status: "CLOSED" })}
                  disabled={updating}
                  className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  <XCircle size={18} />
                  Close
                </button>
              )}

              {/* Reopen Button */}
              {ticket.status === "RESOLVED" && ticket.resolved_at && (() => {
                const resolvedAt = new Date(ticket.resolved_at);
                const now = new Date();
                const diffHours = (now.getTime() - resolvedAt.getTime()) / (1000 * 60 * 60);

                if (diffHours <= 24) {
                  return (
                    <button
                      onClick={() => setIsReopenModalOpen(true)}
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
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 py-8 border-r border-slate-100 flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1">
            <Timeline events={events} />
          </div>

          {/* Dynamic Action Section: Reply or RCA */}
          {!["RESOLVED", "CLOSED"].includes(ticket.status) ? (
            <TicketReplyForm onSendReply={handleSendReply} sending={sending} />
          ) : (
            <TicketRcaEditor rca={ticket.rca} rcaImages={ticket.rca_images} onUpdateRca={handleUpdateRca} savingRca={savingRca} />
          )}

          {ticket.rating && (
            <div className="max-w-4xl mx-auto w-full mt-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xs shrink-0">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500">
                  <span className="material-symbols-outlined text-[18px]">star</span>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Customer Rating & Feedback</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Post-Resolution Satisfaction</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => {
                  const isFilled = i < (ticket.rating || 0);
                  return (
                    <span
                      key={i}
                      className={`material-symbols-outlined text-[20px] ${
                        isFilled ? "text-amber-500" : "text-slate-200"
                      }`}
                      style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      star
                    </span>
                  );
                })}
                <span className="ml-2 text-sm font-black text-slate-700">
                  {ticket.rating} / 5 Stars
                </span>
              </div>

              {ticket.rating_feedback && (
                <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
                    "{ticket.rating_feedback}"
                  </p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-[260px] bg-white overflow-y-auto p-6 flex flex-col gap-6 shrink-0">
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
                    <span className={`text-sm font-bold uppercase ${statusConfig.textClass}`}>{ticket.status.replace(/_/g, " ")}</span>
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

                {/* Outage Details */}
                <ProviderOutageTracker
                  ticketId={ticket.id}
                  problemSide={ticket.problem_side}
                  externalTicketNo={ticket.telco_sr_number}
                  onUpdate={() => {
                    fetchTicket();
                  }}
                />
              </div>
            </div>

            <hr className="border-slate-100" />

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

      <ReopenTicketModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        onConfirm={(reason) => {
          setIsReopenModalOpen(false);
          handleUpdate({ status: "REOPENED", message: reason });
        }}
      />
    </div>
  );
}
