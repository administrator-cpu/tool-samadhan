import { useState, useCallback, useRef, useEffect } from 'react';
import { api } from '@/lib/api';

export interface PageMetadata {
  cursor: string | null;
  hasNext: boolean;
}

interface UseCursorPaginationOptions {
  fetchUrl: string;
  limit?: number;
  queryParams?: Record<string, any>;
}

export function useCursorPagination({ fetchUrl, limit = 10, queryParams = {} }: UseCursorPaginationOptions) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageMap, setPageMap] = useState<Record<number, PageMetadata>>({
    1: { cursor: null, hasNext: true },
  });

  const prefetchedPages = useRef<Set<number>>(new Set());
  const queryParamsRef = useRef(queryParams);

  useEffect(() => {
    queryParamsRef.current = queryParams;
  }, [queryParams]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
    setPageMap({ 1: { cursor: null, hasNext: true } });
    prefetchedPages.current.clear();
  }, []);

  const prefetchNextPage = useCallback(async (pageToPrefetch: number, cursor: string) => {
    if (prefetchedPages.current.has(pageToPrefetch)) return;
    prefetchedPages.current.add(pageToPrefetch);

    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('cursor', cursor);
      
      Object.entries(queryParamsRef.current).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const url = `${fetchUrl}${fetchUrl.includes('?') ? '&' : '?'}${params.toString()}`;
      const res = await api.get(url);
      
      const pagination = res.data.pagination;
      if (!pagination) return;
      
      const { nextCursor, hasNext } = pagination;

      setPageMap((prev) => {
        const newMap = { ...prev };
        if (hasNext && nextCursor) {
          newMap[pageToPrefetch + 1] = { cursor: nextCursor, hasNext: true };
        } else {
          if (newMap[pageToPrefetch]) {
            newMap[pageToPrefetch] = { ...newMap[pageToPrefetch], hasNext: false };
          }
        }
        return newMap;
      });
    } catch (error) {
      console.error('Failed to prefetch next page metadata', error);
      prefetchedPages.current.delete(pageToPrefetch);
    }
  }, [fetchUrl, limit]);

  const handlePageResponse = useCallback((page: number, nextCursor: string | null, hasNext: boolean) => {
    setPageMap((prev) => {
      const newMap = { ...prev };
      
      if (hasNext && nextCursor) {
        newMap[page + 1] = { cursor: nextCursor, hasNext: true };
      } else {
        if (newMap[page]) {
          newMap[page] = { ...newMap[page], hasNext: false };
        }
      }
      return newMap;
    });

    if (hasNext && nextCursor) {
      // Fire background request silently
      prefetchNextPage(page + 1, nextCursor);
    }
  }, [prefetchNextPage]);

  return {
    currentPage,
    setCurrentPage,
    pageMap,
    resetPagination,
    handlePageResponse,
  };
}
