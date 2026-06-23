import React from 'react';
import { getVisiblePages } from '@/lib/pagination';

interface StandardPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  itemName: string;
  onPageChange: (page: number) => void;
  loading?: boolean;
}

export default function StandardPagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  itemName,
  onPageChange,
  loading = false,
}: StandardPaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalCount);
  
  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <div className="flex w-full flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 bg-white px-8 py-5">
      {/* Left Text */}
      <div className="text-sm font-semibold text-slate-500">
        Showing <span className="font-bold text-slate-700">{start}</span> to <span className="font-bold text-slate-700">{end}</span> of <span className="font-bold text-slate-700">{totalCount}</span> {itemName}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
        >
          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          Previous
        </button>

        <div className="flex items-center gap-1 mx-2">
          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold transition-all ${
                currentPage === p
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-600 hover:bg-slate-100 active:scale-95"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          className="flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition-all hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
        >
          Next
          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
