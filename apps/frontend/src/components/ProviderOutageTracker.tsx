"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface ProviderOutageTrackerProps {
  ticketId: number;
  problemSide: string | null;
  externalTicketNo: string | null;
  onUpdate: (problemSide: string | null, externalTicketNo: string | null) => void;
}

export default function ProviderOutageTracker({
  ticketId,
  problemSide,
  externalTicketNo,
  onUpdate,
}: ProviderOutageTrackerProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempProblemSide, setTempProblemSide] = useState<string>("");
  const [tempTicketNo, setTempTicketNo] = useState<string>("");

  // Sync state whenever props change
  useEffect(() => {
    setTempProblemSide(problemSide || "");
    setTempTicketNo(externalTicketNo || "");
  }, [problemSide, externalTicketNo]);

  const handleSave = async () => {
    try {
      const pSide = tempProblemSide ? tempProblemSide : null;
      const tNo = tempTicketNo && tempTicketNo.trim() ? tempTicketNo.trim() : null;

      await api.patch(`/tickets/${ticketId}/outage`, {
        problemSide: pSide,
        externalTicketNo: tNo,
      });

      onUpdate(pSide, tNo);
      setIsEditing(false);
      toast.success("Outage details updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update outage details");
    }
  };

  const handleCopy = () => {
    if (externalTicketNo) {
      navigator.clipboard.writeText(externalTicketNo);
      toast.success("Ticket number copied!");
    }
  };

  return (
    <div className="space-y-4 pt-1">
      <div className="flex items-center justify-between border-t border-slate-100 pt-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
          Provider Outage
        </h4>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-emerald-600 hover:text-emerald-700 font-bold uppercase tracking-wider text-[9px] cursor-pointer"
          >
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {/* Dropdown */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">
              Problem Side
            </label>
            <select
              value={tempProblemSide}
              onChange={(e) => setTempProblemSide(e.target.value)}
              className="text-sm font-bold text-slate-900 bg-white border border-slate-200 rounded-lg w-full px-2.5 py-1.5 outline-none focus:border-emerald-600"
            >
              <option value="">Select Provider...</option>
              <option value="Fab5">Fab5</option>
              <option value="Airtel">Airtel</option>
              <option value="Vodafone">Vodafone</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Ticket No Input */}
          <div>
            <label className="text-[9px] font-black uppercase tracking-wider text-slate-400 block mb-1">Telco SR Number</label>
            <input
              type="text"
              value={tempTicketNo}
              onChange={(e) => setTempTicketNo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
              placeholder="e.g. TT-128492"
              className="text-sm font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg w-full px-2.5 py-1.5 outline-none focus:border-emerald-600"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg py-1.5 text-xs font-black transition-colors cursor-pointer"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTempProblemSide(problemSide || "");
                setTempTicketNo(externalTicketNo || "");
                setIsEditing(false);
              }}
              className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg py-1.5 text-xs font-black transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* View Problem Side */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Problem Side</p>
            <p className="text-[14px] font-bold text-slate-900">
              {problemSide || <span className="text-slate-400 font-medium italic">Not Linked</span>}
            </p>
          </div>

          {/* View Ticket No. */}
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-0.5">Telco SR Number</p>
            {externalTicketNo ? (
              <div
                onClick={handleCopy}
                className="cursor-pointer hover:text-emerald-600 transition-colors"
                title="Click to copy"
              >
                <p className="text-[14px] font-bold text-slate-900">{externalTicketNo}</p>
              </div>
            ) : (
              <p className="text-[14px] font-medium text-slate-400 italic">Not Linked</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
