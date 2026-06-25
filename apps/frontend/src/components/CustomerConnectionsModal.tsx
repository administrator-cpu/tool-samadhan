"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";

interface Connection {
  id: string;
  fabCircuitId: string;
  opportunityId: string;
  aEndBtsId: string;
  bEndBtsId: string;
}

interface CustomerConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerRowId: number | null;
  customerName?: string;
}

export default function CustomerConnectionsModal({
  isOpen,
  onClose,
  customerRowId,
  customerName,
}: CustomerConnectionsModalProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !customerRowId) return;

    const fetchConnections = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/users/customers/${customerRowId}/connections`);
        setConnections(response.data.connections || []);
      } catch (err: any) {
        console.error("Failed to fetch connections:", err);
        setError("Failed to load customer connections. Please try again later.");
        toast.error("Failed to fetch connections");
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, [isOpen, customerRowId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-white font-heading">
            Connections: {customerName || "Customer"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto bg-slate-50">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center items-center p-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : error ? (
                <div className="p-10 text-center text-red-500">{error}</div>
              ) : connections.length === 0 ? (
                <div className="p-20 text-center text-slate-500">
                  <span className="material-symbols-outlined text-6xl mb-4">cable</span>
                  <p>No connections found for this customer.</p>
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/50">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        S.no
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        FAB LSI
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        A END BTS ID
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        B END BTS ID
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
                          {conn.aEndBtsId || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-600">
                          {conn.bEndBtsId || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
