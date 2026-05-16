"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AgentImage from "@/assets/agent.png";
import Timeline from "@/components/CustomerTimeline";
import { api } from "@/lib/api";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { quickReplies } from "@/lib/quickReplies";
import { ChevronDown, CheckCircle2, XCircle, TrendingUp, User as UserIcon, Calendar, Info, Send, MessageSquare, Zap } from "lucide-react";
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
    priority: string;
    subject: string;
    created_at: string;
    updated_at: string;
    customer: {
      name: string;
    };
    assigned_employee: {
      name: string;
    } | null;
    circuit_description: string | null;
    rca: string | null;
  };
  events: TicketEvent[];
}

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export default function TicketDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [rcaText, setRcaText] = useState("");
  const [savingRca, setSavingRca] = useState(false);

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

      if (data.type === "EVENT_ADDED") {
        setData((prev) => {
          if (!prev) return null;
          if (prev.events.some((e) => e.id === data.event.id)) return prev;
          return {
            ...prev,
            events: [...prev.events, data.event].sort((a, b) => a.id - b.id)
          };
        });
        
        markEventSeen(Number(id), data.event.id);
        
        if (data.event.event_type !== "INTERNAL_NOTE") {
           toast.info(`New update: ${data.event.message.substring(0, 50)}...`);
        }
      } else if (data.type === "TICKET_STATUS_UPDATED") {
        setData((prev) => {
          if (!prev) return null;
          return { 
            ...prev, 
            ticket: { ...prev.ticket, ...data.ticket } 
          };
        });
        toast.success(`Ticket status updated to ${data.ticket.status}`);
      }
    };

    const handleMissedEvents = (data: { ticketId: number, events: TicketEvent[] }) => {
      if (Number(data.ticketId) !== Number(id)) return;
      
      console.log(`[SOCKET] Received ${data.events.length} missed events for agent`);
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

  const handleUpdate = async (updates: { status?: string; priority?: string }) => {
    setUpdating(true);
    try {
      await api.patch(`/tickets/${id}`, updates);
      toast.success("Ticket updated successfully");
      await fetchTicket();
    } catch (err: any) {
      if (err.code === "SESSION_CLEARED_SILENT") return;
      toast.error(err.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };
  const handleUpdateRca = async () => {
    if (!rcaText.trim()) {
      toast.error("Please enter RCA details");
      return;
    }

    try {
      setSavingRca(true);
      await api.patch(`/tickets/${id}/rca`, { rca: rcaText });
      toast.success("Root Cause Analysis updated successfully");
      await fetchTicket();
    } catch (err: any) {
      toast.error(err.message || "Failed to update RCA");
    } finally {
      setSavingRca(false);
    }
  };

  const handleSendReply = async (message: string) => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/events`, {
        event_type: "AGENT_REPLY",
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
    <div className="min-h-screen flex flex-col bg-white text-slate-900 antialiased">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center px-6 py-4 bg-white border-b border-slate-200 shadow-xs">
        <Link
          href="/employee/support-agent/tickets"
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
              {/* Reopen Button - Only for RESOLVED */}
              {ticket.status === "RESOLVED" ? (
                <button
                  onClick={() => handleUpdate({ status: "OPEN" })}
                  disabled={updating}
                  className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600 hover:bg-indigo-100 transition-all disabled:opacity-50"
                >
                  <TrendingUp size={18} className="rotate-180" />
                  Reopen Ticket
                </button>
              ) : (
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

              {/* Close Button - For everything except CLOSED */}
              <button
                onClick={() => handleUpdate({ status: "CLOSED" })}
                disabled={updating}
                className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                <XCircle size={18} />
                Close
              </button>
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
            <div className="max-w-4xl mx-auto w-full mt-10 pt-10 border-t border-slate-100 pb-10">
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
                    className="text-left p-4 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-200 transition-all group disabled:opacity-50"
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
                <div className="relative rounded-3xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/5 transition-all">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Compose your custom tactical update..."
                    className="w-full min-h-[120px] resize-none border-none bg-transparent p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
                  />
                  <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
                    <p className="text-[10px] font-bold text-slate-400">Pressing Send will notify the customer immediately.</p>
                    <button
                      onClick={() => handleSendReply(replyMessage)}
                      disabled={sending || !replyMessage.trim()}
                      className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-black text-white hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-lg shadow-indigo-200"
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
                {ticket.rca && (
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md border border-emerald-100">
                    REPORT FILED
                  </span>
                )}
              </div>

              <div className="relative rounded-3xl border border-emerald-100 bg-white p-2 shadow-xl shadow-emerald-500/5 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
                <textarea
                  value={rcaText}
                  onChange={(e) => setRcaText(e.target.value)}
                  placeholder="Document the technical root cause and resolution steps here for internal audit..."
                  className="w-full min-h-[160px] resize-none border-none bg-transparent p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
                />
                <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 italic">This information is only visible to the Samadhan Support Team.</p>
                  <button
                    onClick={handleUpdateRca}
                    disabled={savingRca || !rcaText.trim()}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
                  >
                    {savingRca ? "Saving Report..." : "Update RCA"}
                    <CheckCircle2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar */}
        <aside className="w-[320px] bg-white overflow-y-auto p-8 flex flex-col gap-10 shrink-0">
          <section>
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 flex items-center gap-2">
              <Info size={14} />
              Ticket Properties
            </h3>
            
            <div className="flex flex-col gap-8">
              
              <div className="flex flex-col gap-6">
                <PropertyItem 
                  icon={<div className="h-2 w-2 rounded-full bg-indigo-500 mt-1" />}
                  label="Status" 
                  value={ticket.status.replace("_", " ")} 
                />
                
                <PropertyItem 
                  icon={<TrendingUp size={16} className="text-amber-500" />}
                  label="Priority" 
                  value={ticket.priority} 
                />

                <PropertyItem 
                  icon={<UserIcon size={16} className="text-slate-400" />}
                  label="Customer" 
                  value={ticket.customer.name} 
                />

                <PropertyItem 
                  icon={<Calendar size={16} className="text-slate-400" />}
                  label="Opened On" 
                  value={format(new Date(ticket.created_at), "MMM d, yyyy")} 
                />

                {ticket.circuit_description && (
                  <PropertyItem 
                    icon={<Info size={16} className="text-slate-400" />}
                    label="Circuit ID" 
                    value={ticket.circuit_description} 
                  />
                )}
              </div>

              <hr className="border-slate-100" />

              {/* Priority Selector */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Priority</label>
                <div className="relative">
                  <select
                    value={ticket.priority}
                    onChange={(e) => handleUpdate({ priority: e.target.value })}
                    disabled={updating}
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                  >
                    {priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

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

            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function PropertyItem({ icon, label, value }: { icon: React.ReactNode, label: string, value: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50">
        {icon}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{label}</span>
        <span className="text-sm font-bold text-slate-900 leading-tight">{value}</span>
      </div>
    </div>
  );
}