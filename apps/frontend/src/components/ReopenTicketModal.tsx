"use client";

import { useState, useEffect } from "react";
import { X, AlertCircle } from "lucide-react";

interface ReopenTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function ReopenTicketModal({ isOpen, onClose, onConfirm }: ReopenTicketModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("New issue");
  const [newIssueDetails, setNewIssueDetails] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsSubmitting(false);
      setSelectedReason("New issue");
      setNewIssueDetails("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    if (selectedReason === "New issue") {
      onConfirm(`Ticket reopened reason: New issue - ${newIssueDetails.trim()}`);
    } else {
      onConfirm(`Ticket reopened reason: ${selectedReason}`);
    }
  };

  const isConfirmDisabled = isSubmitting || (selectedReason === "New issue" && newIssueDetails.trim() === "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm  transition-opacity animate-in fade-in duration-300" 
        onClick={() => !isSubmitting && onClose()} 
      />
      <div className="relative w-full max-w-lg overflow-hidden rounded-[1rem] bg-white shadow-2xl animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <span className="material-symbols-outlined">restart_alt</span>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Reopen Ticket</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">Select a reason</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6 rounded-xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex gap-2">
              <AlertCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <p className="text-sm text-slate-600 font-medium">
                Please indicate why this ticket is being reopened. The selected reason will be logged in the ticket's history.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <label 
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                selectedReason === "New issue" 
                  ? "border-emerald-600 bg-emerald-50/50 shadow-[0_0_0_1px_#059669]" 
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex h-5 items-center">
                <input
                  type="radio"
                  name="reopenReason"
                  value="New issue"
                  checked={selectedReason === "New issue"}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col w-full">
                <span className="text-sm font-bold text-slate-900">New issue</span>
                <span className="text-xs font-medium text-slate-500 mt-0.5">This relates to a different problem.</span>
                
                {selectedReason === "New issue" && (
                  <div className="mt-3 animate-in slide-in-from-top-1 fade-in duration-200">
                    <textarea
                      value={newIssueDetails}
                      onChange={(e) => setNewIssueDetails(e.target.value)}
                      placeholder="Please briefly describe the new issue..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                      rows={7}
                    />
                  </div>
                )}
              </div>
            </label>

            <label 
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                selectedReason === "Issue not resolved" 
                  ? "border-emerald-600 bg-emerald-50/50 shadow-[0_0_0_1px_#059669]" 
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex h-5 items-center">
                <input
                  type="radio"
                  name="reopenReason"
                  value="Issue not resolved"
                  checked={selectedReason === "Issue not resolved"}
                  onChange={(e) => setSelectedReason(e.target.value)}
                  className="h-4 w-4 border-slate-300 text-emerald-600 focus:ring-emerald-600"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Issue not resolved</span>
                <span className="text-xs font-medium text-slate-500 mt-0.5">The original problem still persists.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-6 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-emerald-700 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Confirm Reopen
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
