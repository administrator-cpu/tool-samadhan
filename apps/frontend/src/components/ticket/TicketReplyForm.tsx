"use client";

import { useState } from "react";
import { Zap, MessageSquare, Send } from "lucide-react";
import { quickReplies } from "@/lib/quickReplies";

interface TicketReplyFormProps {
  onSendReply: (message: string, sendEmail: boolean) => Promise<void>;
  sending: boolean;
}

export default function TicketReplyForm({ onSendReply, sending }: TicketReplyFormProps) {
  const [replyMessage, setReplyMessage] = useState("");
  const [sendEmail, setSendEmail] = useState(true);

  const handleSend = async () => {
    if (replyMessage.trim() && !sending) {
      await onSendReply(replyMessage, sendEmail);
      setReplyMessage("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full mt-10 pt-10 border-t border-slate-100 pb-10">
      <div className="mb-6 flex items-center gap-2">
        <Zap size={18} className="text-amber-500" />
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Intelligent Quick Replies</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {quickReplies.map((msg, idx) => (
          <button
            key={idx}
            onClick={() => setReplyMessage(msg)}
            disabled={sending}
            className="text-left p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group disabled:opacity-50"
          >
            <p className="text-xs font-medium text-slate-600 line-clamp-3 group-hover:text-emerald-700">{msg}</p>
          </button>
        ))}
      </div>

      <div className="relative">
        <div className="mb-3 flex items-center gap-2">
          <MessageSquare size={18} className="text-emerald-600" />
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Custom Response</h3>
        </div>
        <div className="relative rounded-xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-500/5 transition-all">
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Compose your custom tactical update..."
            className="w-full min-h-[120px] resize-none border-none bg-transparent p-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 outline-hidden"
          />
          <div className="flex items-center justify-between px-4 pb-2 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={sendEmail} 
                    onChange={(e) => setSendEmail(e.target.checked)} 
                    disabled={sending}
                  />
                  <div className="w-8 h-4 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className={`text-[10px] font-black uppercase tracking-wider ${sendEmail ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {sendEmail ? 'Email ON' : 'Email OFF'}
                </span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 hidden sm:block">
                {sendEmail ? "Pressing Send will email the customer immediately." : "Pressing Send will only update the ticket timeline."}
              </p>
            </div>
            <button
              onClick={handleSend}
              disabled={sending || !replyMessage.trim()}
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-black text-white hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-black-"
            >
              {sending ? "Transmitting..." : "Send Reply"}
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
