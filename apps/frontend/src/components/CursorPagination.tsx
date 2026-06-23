import React from 'react';

interface CursorPaginationProps {
  currentPage: number;
  pageMap: Record<number, { cursor: string | null; hasNext: boolean }>;
  onPageChange: (page: number) => void;
  loading: boolean;
}

export default function CursorPagination({
  currentPage,
  pageMap,
  onPageChange,
  loading,
}: CursorPaginationProps) {
  const knownPages = Object.keys(pageMap).map(Number);
  const maxKnownPage = Math.max(...knownPages, 1);
  
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(maxKnownPage, currentPage + 2);

  const visiblePages = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  if (visiblePages.length <= 1 && !pageMap[1]?.hasNext) {
    return null;
  }

  return (
    <div className="flex items-end justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
      <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1 || loading}
          className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
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
                ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                : 'text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!pageMap[currentPage]?.hasNext || loading}
          className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
        >
          <span className="sr-only">Next</span>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
        </button>
      </nav>
    </div>
  );
}
