"use client";

import Link from "next/link";
import Image from "next/image";
import AgentImage from "@/assets/agent.png";
import Timeline from "@/components/CustomerTimeline";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { format } from "date-fns";

interface Ticket {
  id: number;
  ticket_no: string;
  status: string;
  priority: string;
  subject: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  resolved_at: string | null;
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

export default function TicketDetailPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTicketDetails = async () => {
      try {
        const response = await api.get(`/tickets/${id}`);
        setTicket(response.data.ticket);
        setEvents(response.data.events);
      } catch (err: any) {
        console.error("Failed to fetch ticket details:", err);
        setError("Failed to load ticket details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchTicketDetails();
  }, [id]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await api.patch(`/tickets/${id}`, { status: newStatus });
      // Refresh data
      const response = await api.get(`/tickets/${id}`);
      setTicket(response.data.ticket);
      setEvents(response.data.events);
    } catch (err: any) {
      console.error("Failed to update ticket status:", err);
      alert(err.message || "Failed to update ticket status");
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
    <div className="min-h-screen flex flex-col bg-[#faf9fa] text-slate-900">
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
          <div className="relative inline-grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
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

          {ticket.status !== "CLOSED" ? (
            <button
              onClick={() => handleStatusUpdate("CLOSED")}
              className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-semibold active:scale-95 transition-transform hover:bg-red-100"
            >
              <span className="material-symbols-outlined text-sm">close</span>
              Close Ticket
            </button>
          ) : (
            // Only show reopen if within 24 hours
            (() => {
              const closedAt = new Date(ticket.closed_at || ticket.updated_at);
              const now = new Date();
              const diffHours = (now.getTime() - closedAt.getTime()) / (1000 * 60 * 60);
              
              if (diffHours <= 24) {
                return (
                  <button
                    onClick={() => handleStatusUpdate("OPEN")}
                    className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-semibold active:scale-95 transition-transform hover:bg-emerald-100"
                  >
                    <span className="material-symbols-outlined text-sm">restart_alt</span>
                    Reopen Ticket
                  </button>
                );
              }
              return null;
            })()
          )}
        </div>
      </header>

      {/* Layout */}
      <main className="flex flex-1 overflow-hidden max-w-[1400px] mx-auto w-full">
        {/* Timeline */}
        <section className="flex-1 flex flex-col relative overflow-y-auto">
          <Timeline events={events} />
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
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <p className="text-text-main text-[15px] font-medium">{ticket.status.replace(/_/g, " ")}</p>
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
          </div>
        </div>
      </main>
    </div>
  );
}