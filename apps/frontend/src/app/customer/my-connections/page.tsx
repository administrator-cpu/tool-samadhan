"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import { useConnectionStore } from "@/store/useCircuitIDStore";

export default function MyConnectionsPage() {
  const { connections, loadingConnection, connectionError, fetchConnections } = useConnectionStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const filteredConnections = useMemo(() => {
    if (!searchQuery.trim()) return connections;
    const query = searchQuery.toLowerCase().trim();

    const matchesWithScore = connections
      .map((conn) => {
        const opportunity = conn.opportunityId?.toLowerCase() || "";
        const fabCircuit = conn.fabCircuitId?.toLowerCase() || "";
        const serviceType = conn.serviceType?.toLowerCase() || "";
        // Use the exact installation code rendered in the UI
        const activeInstallationCode = (
          conn.bEndBtsId !== "N/A" && conn.bEndBtsId ? conn.bEndBtsId : conn.aEndBtsId
        )?.toLowerCase() || "";

        let score = 0;

        // 1. Highest priority: Circuit ID matches (opportunityId / fabCircuitId)
        if (opportunity === query || fabCircuit === query) score += 100;
        else if (opportunity.startsWith(query) || fabCircuit.startsWith(query)) score += 80;
        else if (opportunity.includes(query) || fabCircuit.includes(query)) score += 60;

        // 2. High priority: Visible Installation Code matches
        if (activeInstallationCode.startsWith(query)) score += 50;
        else if (activeInstallationCode.includes(query)) score += 40;

        // 3. Priority: Service Type matches
        if (serviceType.startsWith(query)) score += 30;
        else if (serviceType.includes(query)) score += 20;

        return { conn, score };
      })
      .filter((item) => item.score > 0);

    // Sort descending by relevance score so the best matches float to the top
    matchesWithScore.sort((a, b) => b.score - a.score);

    return matchesWithScore.map((item) => item.conn);
  }, [connections, searchQuery]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F8FAFC] text-slate-900">
      <main className="mx-auto w-full max-w-350 p-6 md:p-10">
        {/* Page Header & Search Bar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[32px] font-bold tracking-tight text-slate-900">
              My Connections
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View and search through all your registered connections by Circuit ID or details.
            </p>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-slate-400 text-xl pointer-events-none">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Circuit ID..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-9 text-sm text-slate-800 placeholder-slate-400 shadow-sm transition-all focus:border-[#2513ec] focus:outline-none focus:ring-2 focus:ring-[#2513ec]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 transition-colors p-1 flex items-center justify-center rounded-full hover:bg-slate-100"
                  title="Clear search"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>
            {searchQuery && !loadingConnection && (
              <p className="mt-1.5 text-xs text-slate-500 pl-1">
                Found {filteredConnections.length} of {connections.length} connection{connections.length !== 1 ? "s" : ""}
              </p>
            )}
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
            ) : filteredConnections.length === 0 ? (
              <div className="p-16 text-center text-slate-500">
                <span className="material-symbols-outlined text-5xl mb-3 text-slate-400">search_off</span>
                <p className="text-base font-medium text-slate-700">No matching connections</p>
                <p className="text-sm text-slate-400 mt-1">No connections found matching &quot;{searchQuery}&quot;</p>
                <button
                  onClick={() => setSearchQuery("")}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#2513ec] bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">clear_all</span>
                  Clear Search
                </button>
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
                  {filteredConnections.map((conn, idx) => (
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

