"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useConnectionStore } from "@/store/useCircuitIDStore";

export default function MyConnectionsPage() {
  const { connections, loadingConnection, connectionError, fetchConnections } = useConnectionStore();

  useEffect(() => {
     fetchConnections();
   }, [fetchConnections]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-900">
      <main className="mx-auto w-full max-w-350 p-6 md:p-10">
        {/* Page Header */}
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
              My Connections
            </h1>
          </div>
        </div>

        {/* Connections Table */}
        <section className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="overflow-x-auto">
            {loadingConnection ? (
              <div className="flex justify-center items-center p-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2513ec]"></div>
              </div>
            ) : connectionError ? (
              <div className="p-10 text-center text-red-500">{connectionError}</div>
            ) : connections.length === 0 ? (
              <div className="p-20 text-center text-slate-500">
                <span className="material-symbols-outlined text-6xl mb-4">cable</span>
                <p>No connections found.</p>
              </div>
            ) : (
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      S.no
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Circuit ID
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Service Type
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Installation Code
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      bandwidth
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {connections.map((conn, idx) => (
                    <tr key={conn.id || idx} className="transition-colors hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {idx + 1}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {conn.opportunityId || "N/A"}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {conn.serviceType || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {conn.bEndBtsId !== "N/A" ? conn.bEndBtsId : conn.aEndBtsId}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {conn.bandwidth || "N/A"}
                      </td>

                      
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/customer/raise-new-ticket?circuitId=${conn.fabCircuitId || conn.bEndBtsId}`}
                          className="
                            group inline-flex items-center gap-1.5 rounded-md
                            border border-indigo-300 bg-indigo-50 px-3 py-1.5
                            text-sm font-medium text-indigo-800
                            shadow-sm transition-all duration-200
                            hover:-translate-y-0.5 hover:border-[#2513ec] hover:bg-white hover:text-[#2513ec] hover:shadow
                            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2
                            active:translate-y-0
                          "
                        >
                          <span>Raise Ticket</span>
                          <span
                            className="
                              material-symbols-outlined text-[18px] leading-none
                              transition-transform duration-200
                              group-hover:translate-x-0.5
                            "
                          >
                            report
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
