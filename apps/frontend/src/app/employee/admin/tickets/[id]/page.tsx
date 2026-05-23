"use client";

import { useCallback, useEffect, useState } from "react";
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
    allow_customer_reply: boolean;
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

export default function TicketDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [rcaText, setRcaText] = useState("");
  const [savingRca, setSavingRca] = useState(false);
  const [isEditingRca, setIsEditingRca] = useState(false);
  const [togglingReply, setTogglingReply] = useState(false);
  const statusConfig = data?.ticket ? getStatusBadgeConfig(data.ticket.status) : { dotClass: "", pingClass: "", textClass: "" };

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

      console.log(`[SOCKET] Received ${data.events.length} missed events for admin`);
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
  }, [socket, id, markEventSeen]);

  // Mark initial events as seen
  useEffect(() => {
    if (data?.events?.length && id) {
      const lastEvent = data.events[data.events.length - 1];
      markEventSeen(Number(id), lastEvent.id);
    }
  }, [data?.events?.length, id, markEventSeen]);

  useEffect(() => {
    if (data?.ticket?.rca) {
      setRcaText(data.ticket.rca);
    }
  }, [data]);

  const handleUpdateRca = async () => {
    if (!rcaText.trim()) {
      toast.error("Please enter RCA details");
      return;
    }

    try {
      setSavingRca(true);
      await api.patch(`/tickets/${id}/rca`, { rca: rcaText });
      toast.success("Root Cause Analysis updated successfully");
      setIsEditingRca(false);
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to update RCA");
    } finally {
      setSavingRca(false);
    }
  };

  const handleUpdate = async (updates: { status?: string }) => {
    setUpdating(true);
    try {
      await api.patch(`/tickets/${id}/status`, updates);
      toast.success("Ticket updated successfully");
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleSendReply = async (message: string) => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/events`, {
        event_type: "ADMIN_REPLY", // This will be ADMIN_REPLY for this page
        message: message.trim()
      });
      setReplyMessage("");
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
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-indigo-600"></div>
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
          href="/employee/admin/tickets"
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
                    ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
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
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-5 py-8 border-r border-slate-100 flex flex-col">
          <div className="max-w-4xl mx-auto w-full flex-1">
            <Timeline events={events} />
          </div>

          {/* Dynamic Action Section: Reply or RCA */}
          {!["RESOLVED", "CLOSED"].includes(ticket.status) ? (
            <div className="max-w-4xl mx-auto w-full mt-10 pt-10 px-5 border-t border-slate-100 pb-10">
              <div className="mb-6 flex items-center gap-2">
                <Zap size={18} className="text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Intelligent Quick Replies</h3>
              </div>

              {/* Quick Reply Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {quickReplies.map((msg, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReplyMessage(msg)}
                    disabled={sending}
                    className="text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group disabled:opacity-50"
                  >
                    <p className="text-xs font-medium text-slate-600 line-clamp-3 group-hover:text-indigo-700">{msg}</p>
                  </button>
                ))}
              </div>

              {/* Custom Message */}
              <div className="relative">
                <div className="mb-3 flex items-center gap-2">
                  <MessageSquare size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Custom Response</h3>
                </div>
                <div className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (replyMessage.trim() && !sending) {
                          handleSendReply(replyMessage);
                        }
                      }
                    }}
                    placeholder="Compose your custom tactical update..."
                    className="w-full min-h-[120px] resize-none border-none bg-transparent p-4 text-sm font-medium font-body text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
                  />
                  <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400">Pressing Send will notify the customer immediately.</p>
                    <button
                      onClick={() => handleSendReply(replyMessage)}
                      disabled={sending || !replyMessage.trim()}
                      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
                    >
                      {sending ? "Transmitting..." : "Send Reply"}
                      <Send size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* RCA Section - Only for RESOLVED/CLOSED */
            <div className="max-w-4xl mx-auto w-full mt-10 pt-10 border-t border-slate-100 pb-10">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Info size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Root Cause Analysis</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Internal Investigation Report</p>
                  </div>
                </div>
                {ticket.rca ? (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">
                    REPORT FILED
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-amber-50 text-amber-600 px-2 py-1 rounded-md border border-amber-100">
                    PENDING AGENT SUBMISSION
                  </span>
                )}
              </div>

              {ticket.rca && !isEditingRca ? (
                /* Premium Read-Only View with Edit Button */
                <div className="relative rounded-3xl border border-slate-200 bg-slate-50/50 p-6 shadow-sm">
                  <div className="whitespace-pre-line text-sm font-medium text-slate-800 leading-relaxed">
                    {ticket.rca}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-[10px] font-bold text-slate-400 italic">This information is only visible to the Samadhan Support Team and Customer.</p>
                    <button
                      onClick={() => {
                        setRcaText(ticket.rca || "");
                        setIsEditingRca(true);
                      }}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-xs">edit</span>
                      Edit RCA
                    </button>
                  </div>
                </div>
              ) : (
                /* Interactive RCA Editor */
                <div className="relative rounded-3xl border border-emerald-100 bg-white p-2 shadow-xl shadow-emerald-500/5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
                  <textarea
                    value={rcaText}
                    onChange={(e) => setRcaText(e.target.value)}
                    placeholder="Document the technical root cause and resolution steps here for internal audit..."
                    className="w-full min-h-[160px] resize-none border-none bg-transparent p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
                  />
                  <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400 italic">This information is only visible to the Samadhan Support Team.</p>
                    <div className="flex items-center gap-2">
                      {ticket.rca && (
                        <button
                          type="button"
                          onClick={() => setIsEditingRca(false)}
                          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all active:scale-95"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={async () => {
                          await handleUpdateRca();
                          setIsEditingRca(false);
                        }}
                        disabled={savingRca || !rcaText.trim()}
                        className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                      >
                        {savingRca ? "Saving Report..." : ticket.rca ? "Save Changes" : "Submit RCA"}
                        <CheckCircle2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
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
                  {ticket.customer.email && (
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