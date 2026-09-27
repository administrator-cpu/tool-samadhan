import React from "react";

interface TableSkeletonProps {
  columns?: number;
  rows?: number;
}

export default function TableSkeleton({ columns = 6, rows = 5 }: TableSkeletonProps) {
  return (
    <div className="w-full animate-pulse">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/50">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={`th-${i}`} className="px-6 py-5">
                <div className="h-4 w-24 rounded bg-slate-200"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={`tr-${rowIndex}`}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={`td-${rowIndex}-${colIndex}`} className="px-6 py-5">
                  <div 
                    className="h-4 rounded bg-slate-100" 
                    style={{ width: `${40 + ((rowIndex * 7 + colIndex * 13) % 40)}%` }}
                  ></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
