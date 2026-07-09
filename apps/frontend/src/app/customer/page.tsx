"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";
import Marquee from "react-fast-marquee";
import { formatINR } from "@/lib/formatINR";

interface Ticket {
  id: number;
  ticket_no: string;
  subject: string;
  status: string;
  created_at: string;
}

export default function Home() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [outstandingBalance, setOutstandingBalance] = useState<number>(0);
  

  useEffect(() => {
    const fetchActiveTickets = async () => {
      try {
        const response = await api.get("/tickets?limit=20");
        // Show only active ones (not RESOLVED or CLOSED)
        const ticketsArray = response.data.tickets || [];
        const active = ticketsArray.filter((t: any) => !["RESOLVED", "CLOSED"].includes(t.status));
        setTickets(active.slice(0, 3)); // Show top 3
      } catch (err) {
        console.error("Failed to fetch active tickets:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchOutstandingBalance = async () => {
      try {
        const response = await api.get( `/users/outstanding-balance`);
        const outstandingBalance = response.data.outstandingBalance ?? null;
        setOutstandingBalance(outstandingBalance);
      } catch (err) {
        console.error("Failed to fetch active tickets:", err);
      }
    };

    fetchOutstandingBalance();
    fetchActiveTickets();
  }, []);

  return (
    <div className="mx-auto flex max-w-250 flex-col gap-10 px-6 py-10 md:px-12 md:py-14">
      
      {/* Status Card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-100/50 bg-white px-8 py-8 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] backdrop-blur-sm">
        <div className="absolute -right-10 -top-20 h-64 w-90 rounded-full bg-emerald-500/10 blur-3xl transition-colors duration-700" />

        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <h2
              className="text-3xl font-bold tracking-tight text-slate-900"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Samadhan - Delivering Reliable Support Service
            </h2>
            <div className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
            </div>
          </div>
          
        </div>
      </section>

      {/* Quick Actions */}
      {/*<section className="flex flex-wrap items-center gap-4">
        <Link
          href="/customer/raise-new-ticket"
          className="flex h-12 min-w-[140px] items-center justify-center rounded-full  bg-emerald-700 px-8 text-sm font-semibold tracking-wide text-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Report Issue
        </Link>
        <button
          className="flex h-12 min-w-[140px] items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-semibold tracking-wide text-slate-900 shadow-sm transition-all duration-300 hover:border-slate-300 hover:bg-slate-50"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Pay Bill
        </button>
      </section>*/}

      { outstandingBalance > 0 && (
        <section className="mt-2 bg-amber-100 text-amber-700 py-3 rounded-md">
          <Marquee
            speed={50}
            gradient={true}
            gradientColor="#FEF3C6"
            pauseOnHover
            pauseOnClick
          >
            <span className="text-lg font-medium">
              An outstanding amount of &nbsp;{formatINR(outstandingBalance)}&nbsp; is pending against your account.
            </span>
          </Marquee>
        </section>
      )}
      

      {/* Active Tickets */}
      <section className="mt-4 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3
            className="text-xl font-bold tracking-tight text-slate-900"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Active Tickets
          </h3>
          <Link href="/customer/tickets" className="text-sm font-semibold text-[#2513ec] transition-colors hover:text-indigo-800">
            View History
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-700"></div>
            </div>
          ) : tickets.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500 bg-white">
              No active tickets. Everything looks good!
            </div>
          ) : (
            tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/customer/tickets/${ticket.id}`}
                className="group flex cursor-pointer items-center gap-4 rounded-[1rem] border border-slate-100 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)]"
              >
                <div className="flex flex-1 items-center gap-5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-500 transition-colors group-hover:bg-emerald-200/70 group-hover:text-emerald-700">
                    <span className="material-symbols-outlined">
                      confirmation_number
                    </span>
                  </div>

                  <div className="flex flex-col justify-center gap-1">
                    <p
                      className="text-lg font-semibold leading-none text-slate-900"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {ticket.subject}
                    </p>
                    <p className="text-sm font-medium leading-none text-slate-500">
                      #{ticket.ticket_no} • Opened {formatDistanceToNow(new Date(ticket.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div
                    className="inline-flex h-8 items-center justify-center rounded-full px-4 text-xs font-bold uppercase tracking-wider bg-amber-100 text-amber-700"
                  >
                    {ticket.status.replace(/_/g, " ")}
                  </div>
                  <span className="material-symbols-outlined text-slate-300 transition-colors group-hover:text-[#2513ec]">
                    chevron_right
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
