export function getVisiblePages(currentPage: number, totalPages: number): number[] {
  const start = Math.max(1, currentPage - 4);
  const end = Math.min(totalPages, currentPage + 4);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
