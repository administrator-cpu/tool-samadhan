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
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">

        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
           className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-emerald-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
        >
          <span className="sr-only">Previous</span>
          <span className="material-symbols-outlined text-sm">chevron_left</span>
        </button>

          {visiblePages.map((p) => (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              disabled={loading}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 focus:outline-offset-0 disabled:opacity-50 ${
              currentPage === p
                ? 'z-10 bg-emerald-600 hover:bg-emerald-800 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-emerald-50'
            }`}
            >
              {p}
            </button>
          ))}

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages || loading}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-emerald-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
        >
          <span className="sr-only">Next</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </nav>
    </div>
  );
}
