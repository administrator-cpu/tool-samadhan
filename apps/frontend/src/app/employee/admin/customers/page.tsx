"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import AddCustomerModal from "@/components/AddCustomerModal";

interface Customer {
  customer_row_id: number;
  customer_id: string;
  joined_at: string;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Custom Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/customers?page=${page}&limit=10`);
      setCustomers(res.data.customers);
      setTotalPages(res.data.pagination.pages);
      setTotalCount(res.data.pagination.total);
    } catch (err) {
      toast.error("Failed to fetch customers list");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const openDeleteModal = (id: number) => {
    setCustomerToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/users/customers/${customerToDelete}`);
      toast.success("Customer account deleted successfully");
      setDeleteModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete customer");
    } finally {
      setDeleteLoading(false);
      setCustomerToDelete(null);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6 py-10 md:px-12 md:py-14">
      {/* Custom Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => !deleteLoading && setDeleteModalOpen(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-red-50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Delete Customer Account?</h3>
              <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                This action is permanent. Both the customer profile and their system user account will be completely removed. All associated tickets might lose their ownership reference.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-8 pt-0 bg-red-50">
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-red-600 text-sm font-bold text-white shadow-lg shadow-red-200 transition-all hover:bg-red-700 active:scale-95 disabled:opacity-50"
              >
                {deleteLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Yes, Delete Permanently"
                )}
              </button>
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={deleteLoading}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-600 border border-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Customers</h1>
          <p className="text-slate-500 font-medium font-body">Manage registered customers and their accounts.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex h-12 items-center justify-center rounded-lg bg-emerald-700 px-8 text-sm font-bold tracking-wide text-white shadow-lg shadow-emerald-700/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          Add Customer
        </button>
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
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Customer Name & ID</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Joined At</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer) => (
                  <tr key={customer.customer_row_id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                          {customer.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 uppercase">{customer.name}</span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{customer.customer_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-700">{customer.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-500">
                          {customer.phone ? customer.phone : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500 font-medium">
                      {new Date(customer.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => openDeleteModal(customer.customer_row_id)}
                        className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-lg active:scale-95"
                        title="Delete Customer Account"
                      >
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4">
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-700">
                Showing <span className="font-medium">{(page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(page * 10, totalCount)}</span> of <span className="font-medium">{totalCount}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Previous</span>
                  <span className="material-symbols-outlined text-sm">chevron_left</span>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 ${
                      page === p
                        ? "z-10 bg-emerald-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        : "text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  <span className="sr-only">Next</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      </div>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCustomers()}
      />
    </div>
  );
}
