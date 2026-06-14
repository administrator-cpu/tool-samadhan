"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import AddStaffModal from "@/components/AddStaffModal";
import EditStaffModal from "@/components/EditStaffModal";
import { getVisiblePages } from "@/lib/pagination";

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

export default function StaffPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Custom Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<Employee | null>(null);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/employees?page=${page}&limit=10`);
      setEmployees(res.data.employees);
      setTotalPages(res.data.pagination.pages);
      setTotalCount(res.data.pagination.total);
    } catch (err) {
      toast.error("Failed to fetch staff list");
    } finally {
      setLoading(false);
    }
  }, [page]);

  const openDeleteModal = (id: number) => {
    setEmployeeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    
    setDeleteLoading(true);
    try {
      await api.delete(`/users/employees/${employeeToDelete}`);
      toast.success("Staff member deleted successfully");
      setDeleteModalOpen(false);
      fetchEmployees();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete staff member");
    } finally {
      setDeleteLoading(false);
      setEmployeeToDelete(null);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);


  const hideAdminEmail = ["ajay@finviatech.co", "administrator@fab5network.com"];

  return (
    <div className="mx-auto flex max-w-[1400px] flex-col gap-10 px-6 py-10 md:px-12 md:py-14">
    
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
              <h3 className="text-xl font-bold text-slate-900">Delete Account?</h3>
              <p className="mt-2 text-sm font-medium text-slate-500 leading-relaxed">
                This action is permanent. Both the employee profile and their system user account will be completely removed.
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
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-heading">Staff Management</h1>
          <p className="text-slate-500 font-medium font-body">Manage your support agents and their specialties.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex h-12 items-center justify-center rounded-lg bg-emerald-700 px-8 text-sm font-bold tracking-wide text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-emerald-800"
        >
          Add Staff
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-emerald-700"></div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-slate-500">
            <span className="material-symbols-outlined text-5xl">badge</span>
            <p className="font-medium">No staff members found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Role</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Specialties</th>
                  <th className="px-2 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-center">Joined At</th>
                  <th className="px-2 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {employees.filter((emp) => !hideAdminEmail.includes(emp.email)).map((emp) => (
                  <tr key={emp.employee_row_id} className="group transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold">
                          {emp.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{emp.name}</span>
                          <span className="text-xs text-slate-500">{emp.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 uppercase tracking-tight">
                        {emp.role.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-2 py-4">
                      <div className="flex flex-wrap gap-1 max-w-sm">
                        {emp.categories.map((cat) => (
                          <span key={cat.id} className="inline-flex rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 uppercase border border-emerald-100 mb-1 mr-1">
                            {cat.name}
                          </span>
                        ))}
                        {emp.categories.length === 0 && (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-sm text-slate-500 font-medium text-center">
                      {new Date(emp.joined_at).toLocaleDateString()}
                    </td>
                    <td className="px-2 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => { setEmployeeToEdit(emp); setIsEditModalOpen(true); }}
                          className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-indigo-600 transition-all hover:bg-indigo-50 rounded-lg active:scale-95"
                          title="Edit Employee"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button 
                          onClick={() => openDeleteModal(emp.employee_row_id)}
                          className="pt-1.5 pb-0 px-2 text-slate-400 hover:text-red-600 transition-all hover:bg-red-50 rounded-lg active:scale-95"
                          title="Delete Employee Account"
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
                  {getVisiblePages(page, totalPages).map((p) => (
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

      <AddStaffModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchEmployees}
      />

      <EditStaffModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEmployeeToEdit(null); }}
        onSuccess={fetchEmployees}
        employee={employeeToEdit}
      />
    </div>
  );
}
