"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { X, RefreshCw } from "lucide-react";

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCustomerModal({ isOpen, onClose, onSuccess }: AddCustomerModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const generatePassword = () => {
    const charset = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz234679";
    const randomValues = crypto.getRandomValues(new Uint32Array(12));

    return Array.from(randomValues, value => charset[value % charset.length]).join("");
  };

  useEffect(() => {
    if (isOpen) {
      setPassword(generatePassword());
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post("/users/customers", {
        name,
        email,
        phone,
        password,
      });

      toast.success("Customer account created successfully!");
      
      onSuccess();
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setPhone("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create customer account");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">Add New Customer</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2 ">
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ajay Negi"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ajay@example.com"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone Number <span className="text-slate-400 font-normal">(Optional)</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPhone(val);
              }}
              placeholder="e.g. 1234567890"
              maxLength={10}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center justify-between text-sm font-semibold text-slate-700">
              <span>Temporary Password</span>
              <button 
                type="button" 
                onClick={() => setPassword(generatePassword())}
                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
              >
                <RefreshCw size={12} />
                Regenerate
              </button>
            </label>
            <input
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Temporary Password"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 font-mono tracking-widest focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden"
            />
            <p className="text-xs text-slate-500 mt-1">
              An email will be sent to the customer with these login details. They will be forced to change this password on their first login.
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-700 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
