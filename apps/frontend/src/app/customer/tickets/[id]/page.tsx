"use client";

import Link from "next/link";
import Image from "next/image";
import AgentImage from "@/assets/agent.png";
import Timeline from "@/components/ChatBoxTimelineMessages";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { useSocket } from "@/hooks/useSocket";
import { useSocketStore } from "@/store/useSocketStore";
import { toast } from "sonner";

interface Ticket {
  id: number;
  ticket_no: string;
  status: string;
  subject: string;
  circuit_description: string | null;
  rca: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  resolved_at: string | null;
  rating: number | null;
  rating_feedback: string | null;
  allow_customer_reply: boolean;
  customer: {
    id: number;
    customer_id: string;
    name: string;
  };
  assigned_employee: {
    id: number;
    name: string;
  } | null;
}

interface TicketEvent {
  id: number;
  event_type: string;
  message: string;
  actor_name: string | null;
  created_at: string;
  metadata: any;
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
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  const statusConfig = ticket ? getStatusBadgeConfig(ticket.status) : { dotClass: "", pingClass: "", textClass: "" };

  useEffect(() => {
    if (!id) return;

    const fetchTicketDetails = async () => {
      try {
        const response = await api.get(`/tickets/${id}`);
        setTicket(response.data.ticket);
        setEvents(response.data.events);
      } catch (err: any) {
        if (err.code === "SESSION_CLEARED_SILENT") return;
        console.error("Failed to fetch ticket details:", err);
        setError("Failed to load ticket details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id]);

  const { socket } = useSocket(id as string);
  const markEventSeen = useSocketStore((state) => state.markEventSeen);

  useEffect(() => {
    if (!socket) return;

    const handleUpdate = (data: any) => {
      console.log("[SOCKET] Received update:", data);

      if (data.event && data.event.visible_to_customer !== false) {
        setEvents((prev) => {
          if (prev.some((e) => e.id === data.event.id)) return prev;
          return [...prev, data.event].sort((a, b) => a.id - b.id);
        });
        markEventSeen(Number(id), data.event.id);
      }

      if (data.type === "NEW_EVENT") {
        // No toast needed, the message is automatically appended to the timeline above
      } else if (data.type === "REPLY_TOGGLED") {
        setTicket((prev) => {
          if (!prev) return null;
          return { ...prev, allow_customer_reply: data.allow_customer_reply };
        });
      } else if (data.type === "TICKET_STATUS_UPDATED") {
        setTicket((prev) => {
          if (!prev) return null;
          return { ...prev, ...data.ticket };
        });
        toast.success(`Ticket status updated to ${data.ticket?.status || "a new status"}`);
      } else if (data.type === "TICKET_ASSIGNED") {
        toast.info("Ticket assignment has been updated");
      } else if (data.type === "TICKET_RCA_UPDATED") {
        setTicket((prev) => {
          if (!prev) return null;
          return { ...prev, rca: data.rca };
        });
        toast.success("Root Cause Analysis (RCA) report has been updated!");
      } else if (data.type === "TICKET_RATING_UPDATED") {
        setTicket((prev) => {
          if (!prev) return null;
          return { ...prev, rating: data.rating, rating_feedback: data.rating_feedback };
        });
        toast.info("Ticket feedback rating has been updated!");
      } else if (data.type === "OUTAGE_DETAILS_UPDATED") {
        setTicket((prev) => {
          if (!prev) return null;
          return { ...prev, ...data.ticket };
        });
      }
    };

    const handleMissedEvents = (data: { ticketId: number, events: TicketEvent[] }) => {
      if (Number(data.ticketId) !== Number(id)) return;

      console.log(`[SOCKET] Received ${data.events.length} missed events`);
      setEvents((prev) => {
        const newEvents = data.events.filter(e => !prev.some(p => p.id === e.id));
        if (newEvents.length === 0) return prev;

        const combined = [...prev, ...newEvents].sort((a, b) => a.id - b.id);

        const lastEvent = combined[combined.length - 1];
        if (lastEvent) {
          markEventSeen(Number(id), lastEvent.id);
        }

        return combined;
      });

      toast.info(`Synced ${data.events.length} new updates`);
    };

    socket.on("ticket_update", handleUpdate);
    socket.on("missed_events", handleMissedEvents);

    return () => {
      socket.off("ticket_update", handleUpdate);
      socket.off("missed_events", handleMissedEvents);
    };
  }, [socket, id, markEventSeen]);

  useEffect(() => {
    if (events && events.length > 0 && id) {
      const lastEvent = events[events.length - 1];
      markEventSeen(Number(id), lastEvent.id);
    }
  }, [events?.length, id, markEventSeen]);


  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await api.patch(`/tickets/${id}/status`, { status: newStatus });
      // Refresh data
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.ticket);
      setEvents(response.data.events);
    } catch (err: any) {
      if (err.code === "SESSION_CLEARED_SILENT") return;
      console.error("Failed to update ticket status:", err);
      toast.error(err.message || "Failed to update ticket status");
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim()) return;
    setSending(true);
    try {
      await api.post(`/tickets/${id}/events`, {
        event_type: "USER_REPLY",
        message: replyMessage.trim()
      });
      setReplyMessage("");
      toast.success("Reply sent successfully");
      
      const response = await api.get(`/tickets/${id}`);
      setEvents(response.data.events);
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9fa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#faf9fa] p-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">{error || "Ticket not found"}</h1>
        <Link href="/customer/tickets" className="text-emerald-700 font-medium hover:underline">
          Back to My Tickets
        </Link>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#faf9fa] text-slate-900 overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-6 py-4 bg-white border-b border-gray-100 shadow-sm z-10">
        <Link
          href="/customer/tickets"
          className="mr-4 flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>

        <div>
          <h1 className="text-xl font-semibold break-words">{ticket.subject}</h1>
          <p className="text-sm text-slate-500">Ticket #{ticket.ticket_no}</p>
        </div>

        <div className="ml-auto flex items-center gap-6">
          <div className="relative hidden grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
            <input
              type="radio"
              name="language"
              id="lang-en"
              className="peer/en sr-only hover:cursor-pointer"
              defaultChecked
            />
            <input type="radio" name="language" id="lang-hi" className="peer/hi sr-only hover:cursor-pointer" />
            <div className="absolute inset-y-1 left-1 w-12 rounded-lg bg-white shadow-sm transition-transform duration-300 ease-out peer-checked/hi:translate-x-12" />
            <label
              htmlFor="lang-en"
              className="relative z-10 flex h-9 w-12 cursor-pointer items-center justify-center rounded-lg text-xs font-medium text-slate-900 transition-colors duration-300 peer-checked/hi:text-slate-500 hover:cursor-pointer"
            >
              EN
            </label>
            <label
              htmlFor="lang-hi"
              className="relative z-10 flex h-9 w-12 cursor-pointer items-center justify-center rounded-lg text-xs font-medium text-slate-500 transition-colors duration-300 peer-checked/hi:text-slate-900 hover:cursor-pointer"
            >
              हिन्दी
            </label>
          </div>

          {ticket.status === "RESOLVED" && ticket.resolved_at && (() => {
            const resolvedAt = new Date(ticket.resolved_at);
            const now = new Date();
            const diffHours = (now.getTime() - resolvedAt.getTime()) / (1000 * 60 * 60);

            if (diffHours <= 24) {
              return (
                <button
                  onClick={() => handleStatusUpdate("REOPENED")}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold active:scale-95 transition-transform hover:bg-emerald-100"
                >
                  <span className="material-symbols-outlined text-sm">restart_alt</span>
                  Reopen Ticket
                </button>
              );
            }
            return null;
          })()}
        </div>
      </header>

      {/* Layout */}
      <main className="flex flex-1 overflow-hidden max-w-[1400px] mx-auto w-full">
        <section className="flex-1 flex flex-col relative px-5 overflow-y-auto pt-6">
          <Timeline events={events} />
          
          {ticket.allow_customer_reply && !["RESOLVED", "CLOSED"].includes(ticket.status) && (
            <div className="mt-4 mb-6 rounded-lg border border-slate-200 bg-white p-2 shadow-xl focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all shrink-0">
              <div className="px-4 pt-3 flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-emerald-600 text-[18px]">chat</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Send a Reply</h3>
              </div>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (replyMessage.trim() && !sending) {
                      handleSendReply();
                    }
                  }
                }}
                placeholder="Agent requested more information. Type your message here..."
                className="w-full min-h-[100px] resize-none border-none bg-transparent p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
              />
              <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400">Agent will be notified immediately.</p>
                <button
                  onClick={handleSendReply}
                  disabled={sending || !replyMessage.trim()}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Send Reply"}
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </div>
          )}

          {ticket.rca && (
            <div className="mt-0 mb-6 rounded-lg border border-emerald-100 bg-emerald-50/30 p-6 shadow-xs backdrop-blur-xs shrink-0">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-2xl font-bold text-emerald-500">verified</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-black uppercase tracking-wider text-emerald-900">Root Cause Analysis (RCA)</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-emerald-700">
                      OFFICIAL REPORT
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] font-bold text-slate-400 leading-snug uppercase tracking-widest">
                    Technical Resolution Summary
                  </p>
                  <div className="mt-3 rounded-lg bg-white/80 border border-emerald-50 px-4 py-2 shadow-2xs">
                    <p className="whitespace-pre-line text-sm font-medium text-slate-800 leading-relaxed">
                      {ticket.rca}
                    </p>
                    {ticket.resolved_at && (
                      <span className="flex justify-end text-[11px] font-bold text-emerald-700/80">
                        Resolved on {format(new Date(ticket.resolved_at), "MMM d, yyyy, h:mm a")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {["RESOLVED", "CLOSED"].includes(ticket.status) && (
            <RatingSection
              ticket={ticket}
              onUpdateRating={(rating, feedback) => {
                setTicket((prev) => {
                  if (!prev) return null;
                  return { ...prev, rating, rating_feedback: feedback };
                });
              }}
            />
          )}
        </section>

        <div className="hidden lg:block w-[300px] xl:w-[340px] shrink-0 p-6 bg-surface border-l border-gray-100 overflow-y-auto">
          {/* Status Stepper */}
          <div className="mb-10">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-text-main">
                {ticket.status.replace(/_/g, " ")}
              </h3>
            </div>

            {/* Progress Line */}
            <div className="relative mb-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{
                    width: ticket.status === "OPEN" ? "33%" : ticket.status === "IN_PROGRESS" ? "50%" : "100%"
                  }}
                />
              </div>

              <div className="absolute inset-0 flex items-center justify-between">
                {/* Received Point */}
                <div className="relative flex flex-col items-center">
                  {ticket.status === "OPEN" ? (
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-300 opacity-40" />
                      <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    </div>
                  ) : (
                    <span className="h-4 w-4 rounded-full border-4 border-white shadow-sm bg-primary" />
                  )}
                </div>

                {/* Investigating Point */}
                <div className="relative flex flex-col items-center">
                  {ticket.status === "IN_PROGRESS" ? (
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-40" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                    </div>
                  ) : (
                    <span className={`h-4 w-4 rounded-full border-4 border-white shadow-sm ${["RESOLVED", "CLOSED"].includes(ticket.status) ? "bg-primary" : "bg-slate-300"}`} />
                  )}
                </div>

                {/* Resolved Point */}
                <div className="relative flex flex-col items-center">
                  {/* {["RESOLVED", "CLOSED"].includes(ticket.status) ? (
                    <div className="relative flex h-4 w-4 items-center justify-center">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                    </div>
                  ) : (
                    <span className="h-4 w-4 rounded-full border-4 border-white shadow-sm bg-slate-300" />
                  )} */}
                  <span className="h-4 w-4 rounded-full border-4 border-white shadow-sm bg-slate-300" />
                </div>
              </div>
            </div>

            <div className="flex justify-between text-xs font-medium">
              <span className={ticket.status === "OPEN" ? "text-amber-500 font-bold" : "text-primary"}>Received</span>
              <span className={ticket.status === "IN_PROGRESS" ? "text-amber-500 font-bold" : "text-slate-400"}>Investigating</span>
              <span className={["RESOLVED", "CLOSED"].includes(ticket.status) ? "text-emerald-500 font-bold" : "text-slate-400"}>Resolved</span>
            </div>
          </div>

          <hr className="border-gray-100 mb-8" />

          {/* Ticket Details */}
          <h4 className="font-headings font-semibold text-text-main text-base mb-6">Ticket Details</h4>
          <div className="space-y-6">
            <div>
              <p className="text-muted text-xs font-bold tracking-wide uppercase mb-1">Status</p>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  {ticket.status !== "CLOSED" && (
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.pingClass}`}></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusConfig.dotClass}`}></span>
                </span>
                <p className={`text-[15px] font-bold uppercase ${statusConfig.textClass}`}>{ticket.status.replace(/_/g, " ")}</p>
              </div>
            </div>
            <div>
              <p className="text-muted text-xs font-bold tracking-wide uppercase mb-1">Agent Assigned</p>
              <div className="flex items-center gap-3 mt-1.5">
                <Image src={AgentImage} alt="" width={30} height={30} className="rounded-full" />
                <p className="text-text-main text-[15px] font-medium">
                  {ticket.assigned_employee?.name || "Assigning..."}
                </p>
              </div>
            </div>

            <div>
              <p className="text-muted text-xs font-bold tracking-wide uppercase mb-1">Created</p>
              <p className="text-text-main text-[15px] font-medium">
                {format(new Date(ticket.created_at), "MMM d, yyyy, h:mm a")}
              </p>
            </div>

            {ticket.circuit_description && (
              <div>
                <p className="text-muted text-xs font-bold tracking-wide uppercase mb-1">Circuit Description</p>
                <p className="text-text-main text-[15px] font-medium">{ticket.circuit_description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function RatingSection({ ticket, onUpdateRating }: { ticket: Ticket; onUpdateRating: (r: number, f: string | null) => void }) {
  const [rating, setRating] = useState<number>(ticket.rating || 0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>(ticket.rating_feedback || "");
  const [isEditing, setIsEditing] = useState<boolean>(!ticket.rating);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!isEditing) {
      setRating(ticket.rating || 0);
      setFeedback(ticket.rating_feedback || "");
    }
  }, [ticket.rating, ticket.rating_feedback, isEditing]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating");
      return;
    }
    setLoading(true);
    try {
      await api.post(`/tickets/${ticket.id}/rate`, {
        rating,
        feedback: feedback.trim() || null
      });
      toast.success("Thank you for your feedback!");
      onUpdateRating(rating, feedback.trim() || null);
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="mt-4 mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xs shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Your Feedback</h3>
            <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Post-Resolution Satisfaction
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 text-xs font-bold text-[#4b8264] hover:text-emerald-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">edit</span>
            Edit Feedback
          </button>
        </div>

        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFilled = i < rating;
            return (
              <span
                key={i}
                className={`material-symbols-outlined text-[24px] ${
                  isFilled ? "text-amber-500" : "text-slate-300"
                }`}
                style={{ fontVariationSettings: isFilled ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            );
          })}
          <span className="ml-2 text-sm font-black text-slate-700">{rating} / 5 Stars</span>
        </div>

        {ticket.rating_feedback && (
          <div className="mt-3 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">
              "{ticket.rating_feedback}"
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-xs shrink-0 transition-all">
      <div>
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Rate Your Experience</h3>
        <p className="mt-0.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Help us improve our support quality
        </p>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const starVal = i + 1;
          const isActive = starVal <= (hoverRating || rating);
          return (
            <button
              key={i}
              type="button"
              onMouseEnter={() => setHoverRating(starVal)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(starVal)}
              className="focus:outline-hidden hover:scale-110 transition-transform"
            >
              <span
                className={`material-symbols-outlined text-[32px] ${
                  isActive ? "text-amber-500" : "text-slate-300"
                }`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                star
              </span>
            </button>
          );
        })}
        {rating > 0 && (
          <span className="ml-2 text-xs font-black text-slate-500 uppercase tracking-wider">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Comments (Optional)</label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="Share your thoughts on how we handled your issue..."
          rows={3}
          className="w-full mt-2 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:bg-white outline-hidden transition-all placeholder:text-slate-400 font-medium"
        />
      </div>

      <div className="mt-4 flex justify-end gap-3">
        {ticket.rating && (
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading || rating === 0}
          className="px-5 py-2.5 bg-[#4b8264] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
        >
          {loading ? "Submitting..." : ticket.rating ? "Update Feedback" : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}