"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useCategoryStore } from "@/store/useCategoryStore";

interface AddStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"SUPPORT_AGENT" | "SALES">("SUPPORT_AGENT");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { categories, fetchCategories } = useCategoryStore();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const generatePassword = () => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0; i < 10; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return retVal;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (role === "SUPPORT_AGENT" && selectedCategories.length === 0) {
      toast.error("Please select at least one specialty");
      return;
    }

    setLoading(true);
    const password = generatePassword();

    try {
      // 1. Create account (Backend will now handle email sending)
      await api.post("/users/employees", {
        name,
        email,
        password,
        role,
        issueCategories: role === "SUPPORT_AGENT" ? selectedCategories : [],
      });

      toast.success("Staff account created successfully!");
      
      onSuccess();
      onClose();
      // Reset form
      setName("");
      setEmail("");
      setRole("SUPPORT_AGENT");
      setSelectedCategories([]);
    } catch (err: any) {
      toast.error(err.message || "Failed to create staff account");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-emerald-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-heading">Add New Staff</h2>
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
              placeholder="e.g. ajaynegi@example.com"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "SUPPORT_AGENT" | "SALES")}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-hidden text-sm font-medium"
            >
              <option value="SUPPORT_AGENT">Support Agent</option>
              <option value="SALES">Sales Person</option>
            </select>
          </div>

          {role === "SUPPORT_AGENT" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Specialties</label>
              <div className="grid grid-cols-2 gap-2 max-h-65 overflow-y-auto p-2">
                {categories.map((cat) => (
                  <label key={cat.name} className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-100">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, cat.name]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(name => name !== cat.name));
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm font-medium text-slate-600">{cat.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
