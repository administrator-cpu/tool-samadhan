"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface SuggestedCustomer {
  samadhanId: number;
  samadhanName: string;
  crmName: string | null;
  score: number;
}

export default function ConnectionsPage() {
  const [customers, setCustomers] = useState<SuggestedCustomer[]>([]);
  const [loading, setLoading] = useState(true);


  const fetchCustomers = useCallback(async () => {
    setLoading(true);
  
    try {
      const res = await api.get("/users/customers/not-linked");
      setCustomers(res.data);
    } catch {
      toast.error("Failed to fetch customers list");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  
  return (
    <div className="mx-auto flex max-w-350 flex-col gap-10 px-6 py-10 md:px-12 md:py-14">


      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Unlinked Customers</h1>
          <p className="text-slate-500 font-medium font-body">These customers exist in Samadhan but could not be matched in the CRM. Update the customer names to link them.</p>
        </div>
      </div>


      

    <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-700"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-500">
          <span className="material-symbols-outlined text-5xl">groups</span>
          <p className="font-medium">No customers found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
                
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Samadhan Customer
                </th>
            
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                  CRM Suggestion
                </th>
            
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">
                  Match Score
                </th>
              </tr>
            </thead>
                
            <tbody className="divide-y divide-slate-50">
              {customers.map((customer) => (
                <tr
                  key={customer.samadhanId}
                  className="transition-colors hover:bg-slate-50"
                >
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-slate-700">
                      {customer.samadhanName}
                    </span>
                  </td>
            
                  <td className="px-6 py-4">
                    {customer.crmName ? (
                      <span className="text-sm font-semibold text-slate-500">
                        {customer.crmName}
                      </span>
                    ) : (
                      <span className="text-red-600 font-medium">
                        No suggestion
                      </span>
                    )}
                  </td>
            
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        customer.score >= 90
                          ? "bg-green-100 text-green-700"
                          : customer.score >= 75
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {customer.score}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
  </div>

      
  );
}
