import { create } from "zustand";
import { api } from "@/lib/api";
import { useConnectionStore } from "./useConnectionStore";

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Hours

interface MetricsState {
  metrics: any | null;
  loadingMetrics: boolean;
  metricError: string | null;
  lastFetched: number | null;
  selectedCircuit: string;
  hasFetched: boolean;

  fetchMetrics: (circuitId?: string, forceRefresh?: boolean) => Promise<void>;
  clearMetrics: () => void;
}

export const useCustomerMetricsStore = create<MetricsState>((set, get) => ({
  metrics: null,
  loadingMetrics: false,
  metricError: null,
  lastFetched: null,
  selectedCircuit: "ALL",
  hasFetched: false,

  fetchMetrics: async (circuitId = "ALL", forceRefresh = false) => {
    const state = get();
    const now = Date.now();

    // Check if cache is still valid (within 24h) and circuit hasn't changed
    if (
      !forceRefresh &&
      state.metrics &&
      state.selectedCircuit === circuitId &&
      state.lastFetched &&
      now - state.lastFetched < CACHE_DURATION
    ) {
      if (!state.hasFetched) set({ hasFetched: true });
      return; // Return cached metrics immediately (0ms)
    }

    if (state.loadingMetrics) return; // Prevent duplicate parallel requests

    set({ loadingMetrics: true, metricError: null });

    try {
      // Ensure connection store is fetched to obtain connection count
      const connStore = useConnectionStore.getState();
      if (!connStore.hasFetched) {
        await connStore.fetchConnections();
      }
      const connLength = useConnectionStore.getState().connections.length;
      const totalCircuitsParam = connLength > 0 ? `&totalCircuits=${connLength}` : "";

      const response = await api.get(
        `/tickets/customer-metrics?circuitId=${circuitId}${totalCircuitsParam}`
      );

      set({
        metrics: response.data,
        selectedCircuit: circuitId,
        lastFetched: Date.now(),
        hasFetched: true,
        loadingMetrics: false,
        metricError: null,
      });
    } catch (err: any) {
      console.error("Failed to fetch customer metrics in Zustand store:", err);
      set({
        metricError: "Failed to load metrics",
        loadingMetrics: false,
        hasFetched: true,
      });
    }
  },

  clearMetrics: () =>
    set({
      metrics: null,
      loadingMetrics: false,
      metricError: null,
      lastFetched: null,
      selectedCircuit: "ALL",
      hasFetched: false,
    }),
}));
