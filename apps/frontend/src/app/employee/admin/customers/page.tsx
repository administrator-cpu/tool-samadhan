"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { toast } from "sonner";
import AddCustomerModal from "@/components/AddCustomerModal";
import EditCustomerModal from "@/components/EditCustomerModal";
import CustomerConnectionsModal from "@/components/CustomerConnectionsModal";
import CustomerGraphModal from "@/components/CustomerGraphModal";
import StandardPagination from "@/components/StandardPagination";
import { formatINR } from "@/lib/formatINR";
import { useAuthStore } from "@/store/useAuthStore";


interface Customer {
  customer_row_id: number;
  customer_id: string;
  joined_at: string;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  profile_image?: string | null;
  outstanding: number;
  is_active?: boolean;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  
  // Custom Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status Dropdown & Modal State
  const [openDropdownRowId, setOpenDropdownRowId] = useState<number | null>(null);
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [customerToDeactivate, setCustomerToDeactivate] = useState<Customer | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);

  // Connections Modal State
  const [connectionsModalOpen, setConnectionsModalOpen] = useState(false);
  const [customerForConnections, setCustomerForConnections] = useState<Customer | null>(null);

  // Graph Modal State
  const [graphModalOpen, setGraphModalOpen] = useState(false);
  const [customerForGraph, setCustomerForGraph] = useState<Customer | null>(null);

  const { user } = useAuthStore();

  const hideOutstandingBalanceAdmin = "abhishek@fab5network.com";

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest(".status-dropdown-container")) {
        setOpenDropdownRowId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/customers?page=${page}&limit=10${appliedSearchTerm ? `&search=${encodeURIComponent(appliedSearchTerm)}` : ''}`);
      setCustomers(res.data.customers);
      setTotalPages(res.data.pagination.pages);
      setTotalCount(res.data.pagination.total);
    } catch (err) {
      toast.error("Failed to fetch customers list");
    } finally {
      setLoading(false);
    }
  }, [page, appliedSearchTerm]);

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

  const handleSetStatus = async (customer: Customer, newStatus: boolean) => {
    setStatusUpdatingId(customer.customer_row_id);
    setOpenDropdownRowId(null);
    try {
      await api.patch(`/users/customers/${customer.customer_row_id}/status`, { is_active: newStatus });
      toast.success(`Customer ${customer.name} ${newStatus ? "activated" : "deactivated"} successfully`);
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer_row_id === customer.customer_row_id ? { ...c, is_active: newStatus } : c
        )
      );
    } catch (err: any) {
      toast.error(err.message || "Failed to update customer status");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const confirmDeactivate = async () => {
    if (!customerToDeactivate) return;
    setStatusUpdatingId(customerToDeactivate.customer_row_id);
    try {
      await api.patch(`/users/customers/${customerToDeactivate.customer_row_id}/status`, { is_active: false });
      toast.success(`Customer ${customerToDeactivate.name} deactivated`);
      setCustomers((prev) =>
        prev.map((c) =>
          c.customer_row_id === customerToDeactivate.customer_row_id ? { ...c, is_active: false } : c
        )
      );
      setDeactivateModalOpen(false);
      setCustomerToDeactivate(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate customer");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-10 px-6 py-10 md:px-12 md:py-14">      
      {/* Custom Deactivate Confirmation Modal */}
      {deactivateModalOpen && customerToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => statusUpdatingId === null && setDeactivateModalOpen(false)}
          />
          <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="bg-amber-50/80 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600">
                <span className="material-symbols-outlined text-3xl">block</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Deactivate Customer Access?</h3>
              <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                Deactivating <span className="font-semibold text-slate-800 uppercase">{customerToDeactivate.name}</span> will immediately terminate their active session and prevent them from logging in. You can reactivate their account at any time.
              </p>
            </div>
            <div className="flex flex-col gap-3 p-8 pt-0 bg-amber-50/80">
              <button
                onClick={confirmDeactivate}
                disabled={statusUpdatingId === customerToDeactivate.customer_row_id}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white shadow-lg shadow-amber-200 transition-all hover:bg-amber-700 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                {statusUpdatingId === customerToDeactivate.customer_row_id ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  "Yes, Deactivate Account"
                )}
              </button>
              <button
                onClick={() => { setDeactivateModalOpen(false); setCustomerToDeactivate(null); }}
                disabled={statusUpdatingId === customerToDeactivate.customer_row_id}
                className="flex h-12 w-full items-center justify-center rounded-xl bg-white text-sm font-bold text-slate-600 border border-slate-200 transition-all hover:bg-slate-50 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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

      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Customers</h1>
          <p className="text-slate-500 font-medium font-body">Manage registered customers and their accounts.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setAppliedSearchTerm(searchTerm);
                }
              }}
              className="h-12 w-full sm:w-64 rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm font-medium text-slate-900 focus:border-primary focus:outline-hidden focus:ring-4 focus:ring-primary/20 transition-all"
            />
            {appliedSearchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setAppliedSearchTerm("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex h-12 items-center justify-center rounded-lg bg-brand-gradient px-8 text-sm font-bold tracking-wide text-white shadow transition-all hover:-translate-y-0.5 hover:opacity-90 shrink-0"
          >
            Add Customer
          </button>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
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

                  {user?.email !== hideOutstandingBalanceAdmin && <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Outstanding</th>}

                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Email</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Phone</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Joined At</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Actions</th>
                </tr>
              </thead>
                  
              <tbody className="divide-y divide-slate-50">
                {customers.map((customer) => (
                  <tr key={customer.customer_row_id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-4 py-4 max-w-125">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F5821F]/10 text-primary font-bold overflow-hidden relative">
                          {customer.profile_image ? (
                            <Image src={customer.profile_image} alt={customer.name} fill className="object-cover" />
                          ) : (
                            customer.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900 uppercase">{customer.name}</span>
                          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">{customer.customer_id}</span>
                        </div>
                      </div>
                    </td>
                    

                    {user?.email !== hideOutstandingBalanceAdmin && <td className="px-4 py-4 max-w-70 min-w-25 wrap-break-word">
                      <div className="flex flex-col gap-1">
                        {customer.outstanding !== null ? <span className="text-sm font-medium text-slate-700 text-center">{formatINR(customer.outstanding)}</span> : <span className="text-sm font-medium text-red-500 text-center">N/A</span>} 
                      </div>
                    </td>}

                    
                    <td className="px-4 py-4 max-w-70 min-w-25 wrap-break-word">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-700">{customer.email}</span>
                      </div>
                    </td>
          
                    <td className="px-4 py-4 w-25">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-slate-500 text-center">
                          {customer.phone ? customer.phone : "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500 font-medium w-25">
                      {new Date(customer.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 w-36">
                      <div className="relative status-dropdown-container">
                        <button
                          type="button"
                          disabled={statusUpdatingId === customer.customer_row_id}
                          onClick={() => setOpenDropdownRowId(openDropdownRowId === customer.customer_row_id ? null : customer.customer_row_id)}
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wide border shadow-xs transition-all active:scale-95 cursor-pointer disabled:opacity-60 ${
                            customer.is_active !== false
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70"
                              : "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70"
                          }`}
                        >
                          {statusUpdatingId === customer.customer_row_id ? (
                            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          ) : (
                            <span
                              className={`h-2 w-2 rounded-full ${
                                customer.is_active !== false ? "bg-emerald-500 shadow-xs shadow-emerald-400" : "bg-rose-500"
                              }`}
                            />
                          )}
                          <span>{customer.is_active !== false ? "Active" : "Inactive"}</span>
                          <span className="material-symbols-outlined text-[16px] text-slate-400">
                            expand_more
                          </span>
                        </button>

                        {openDropdownRowId === customer.customer_row_id && (
                          <div className="absolute left-0 top-full mt-1.5 z-40 w-36 overflow-hidden rounded-xl bg-white p-1 shadow-xl ring-1 ring-slate-900/10 animate-in fade-in zoom-in-95 duration-150">
                            <button
                              type="button"
                              onClick={() => {
                                if (customer.is_active === false) {
                                  handleSetStatus(customer, true);
                                } else {
                                  setOpenDropdownRowId(null);
                                }
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                customer.is_active !== false
                                  ? "bg-emerald-50 text-emerald-800"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>Active</span>
                              </div>
                              {customer.is_active !== false && (
                                <span className="material-symbols-outlined text-sm text-emerald-600">check</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (customer.is_active !== false) {
                                  setCustomerToDeactivate(customer);
                                  setDeactivateModalOpen(true);
                                  setOpenDropdownRowId(null);
                                } else {
                                  setOpenDropdownRowId(null);
                                }
                              }}
                              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-xs font-semibold cursor-pointer transition-colors ${
                                customer.is_active === false
                                  ? "bg-rose-50 text-rose-800"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-rose-500" />
                                <span>Inactive</span>
                              </div>
                              {customer.is_active === false && (
                                <span className="material-symbols-outlined text-sm text-rose-600">check</span>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => { setCustomerForConnections(customer); setConnectionsModalOpen(true); }}
                          className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-lg active:scale-95"
                          title="View Connections"
                        >
                          <span className="material-symbols-outlined">cable</span>
                        </button>
                        <button 
                          onClick={() => { setCustomerForGraph(customer); setGraphModalOpen(true); }}
                          className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-sky-600 transition-all hover:bg-sky-50 rounded-lg active:scale-95"
                          title="View Analytics Graph"
                        >
                          <span className="material-symbols-outlined">monitoring</span>
                        </button>
                        <button 
                          onClick={() => { setCustomerToEdit(customer); setIsEditModalOpen(true); }}
                          className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-primary transition-all hover:bg-[#F5821F]/10 rounded-lg active:scale-95"
                          title="Edit Customer"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button 
                          onClick={() => openDeleteModal(customer.customer_row_id)}
                          className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-lg active:scale-95"
                          title="Delete Customer Account"
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        <StandardPagination
          currentPage={page}
          totalPages={totalPages}
          totalCount={totalCount}
          itemName="customers"
          onPageChange={setPage}
          loading={loading}
        />
      </div>

      <AddCustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchCustomers()}
      />

      <EditCustomerModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setCustomerToEdit(null); }}
        onSuccess={() => fetchCustomers()}
        customer={customerToEdit}
      />

      <CustomerConnectionsModal
        isOpen={connectionsModalOpen}
        onClose={() => setConnectionsModalOpen(false)}
        customerRowId={customerForConnections?.customer_row_id || null}
        customerName={customerForConnections?.name}
      />

      <CustomerGraphModal
        isOpen={graphModalOpen}
        onClose={() => setGraphModalOpen(false)}
        customerRowId={customerForGraph?.customer_row_id || null}
        customerName={customerForGraph?.name}
      />
    </div>
  );
}
