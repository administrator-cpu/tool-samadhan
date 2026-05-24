"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useUICacheStore } from "@/store/useUICacheStore";

interface Agent {
  id: number;
  name: string;
  email: string;
}

interface ReassignModalProps {
  isOpen: boolean;
  ticketId: number;
  currentAgentId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReassignModal({ isOpen, ticketId, currentAgentId, onClose, onSuccess }: ReassignModalProps) {
  const { agentsList, agentsLastFetched, setAgentsList } = useUICacheStore();
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const fetchAgents = async () => {
    // 1-day cache expiry
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const isCacheValid = agentsList && agentsLastFetched && (Date.now() - agentsLastFetched < ONE_DAY);

    if (isCacheValid) {
      console.log("[AGENTS] Using cached agent list");
      return;
    }

    try {
      console.log("[AGENTS] Fetching fresh agent list from DB...");
      const res = await api.get("/users/agents");
      setAgentsList(res.data);
    } catch (err) {
      toast.error("Failed to load agents");
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
      setSelectedAgentId(currentAgentId?.toString() || "");
    }
  }, [isOpen, currentAgentId]);

  const handleReassign = async () => {
    if (!selectedAgentId) {
      toast.error("Please select an agent");
      return;
    }

    setLoading(true);
    try {
      await api.post(`/tickets/${ticketId}/reassign`, {
        employeeId: selectedAgentId,
      });
      toast.success("Ticket reassigned successfully");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to reassign ticket");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const agents = agentsList || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Re-assign Ticket</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Select Support Agent</label>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 outline-hidden"
            >
              <option value="" disabled>Select an agent</option>
              {agents.map((agent: Agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleReassign}
              disabled={loading}
              className="flex-1 rounded-xl bg-indigo-700 py-3 text-sm font-bold text-white shadow-lg hover:bg-indigo-800 disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign Agent"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
