"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface Employee {
  employee_row_id: number;
  employee_id: string;
  joined_at: string;
  user_id: number;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  categories: { id: number; name: string }[];
}

interface EditStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee: Employee | null;
}

const HARDCODED_CATEGORIES = [
  "Link Down",
  "Packet Drops",
  "Slow Browsing",
  "Latency Very High",
  "Link Fluctuating",
  "IP Related",
  "Website Related Issue",
  "BTS Access",
  "Others"
];

export default function EditStaffModal({ isOpen, onClose, onSuccess, employee }: EditStaffModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Pre-populate form when employee changes
  useEffect(() => {
    if (employee) {
      setName(employee.name);
      setEmail(employee.email);
      setPhone(employee.phone || "");
      setSelectedCategories(employee.categories.map((cat) => cat.name));
    }
  }, [employee]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!employee) return;

    if (employee.role === "SUPPORT_AGENT" && selectedCategories.length === 0) {
      toast.error("Please select at least one specialty");
      return;
    }

    setLoading(true);

    try {
      await api.patch(`/employees/${employee.employee_row_id}`, {
        name,
        email,
        phone: phone || null,
        issueCategoryNames: employee.role === "SUPPORT_AGENT" ? selectedCategories : [],
      });

      toast.success("Staff details updated successfully!");

      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.code === "EMAIL_EXISTS" || err.statusCode === 409) {
        toast.error("This email is already in use by another account");
      } else {
        toast.error(err.message || "Failed to update staff details");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">Edit Staff</h2>
            <p className="text-indigo-200 text-xs font-medium mt-0.5">{employee.employee_id} · {employee.role.replace("_", " ")}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ajay Negi"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-hidden"
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
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-hidden"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              maxLength={10}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-hidden"
            />
            <p className="text-xs text-slate-400">Optional · 10 digits only</p>
          </div>

          {employee.role === "SUPPORT_AGENT" && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Specialties</label>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2">
                {HARDCODED_CATEGORIES.map((catName) => (
                  <label key={catName} className="flex items-center gap-2 px-2 py-1.5 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-indigo-100">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(catName)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCategories([...selectedCategories, catName]);
                        } else {
                          setSelectedCategories(selectedCategories.filter(n => n !== catName));
                        }
                      }}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-slate-600">{catName}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-700 py-4 text-sm font-bold text-white shadow-lg shadow-indigo-700/20 transition-all hover:-translate-y-0.5 hover:bg-indigo-800 disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
