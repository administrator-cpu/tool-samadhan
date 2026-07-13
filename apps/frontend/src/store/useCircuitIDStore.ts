import { create } from "zustand";
import { api } from "@/lib/api";

export interface Connection {
  id: string;
  fabCircuitId: string;
  opportunityId: string;
  serviceType: string;
  aEndBtsId: string;
  bEndBtsId: string;
  bandwidth: number;
}

const CACHE_DURATION = 1 * 60 * 60 * 1000; // 1 hour

interface ConnectionState {
  connections: Connection[];
  loading: boolean; // Whether connections are currently being loaded
  error: string | null; // Error message if loading fails
  lastFetched: number | null; // Timestamp of the last successful fetch

  fetchConnections: () => Promise<void>; // Function to fetch connections
  clearConnections: () => void; // Function to clear connections
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  loading: false,
  error: null,
  lastFetched: null,

  fetchConnections: async () => {
    const { loading, connections, lastFetched } = get();

    if (loading) return; // Already loading, return early

    if (connections.length > 0 && lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      return; // Cache hit, return early
    }

    set({ loading: true, error: null });

    try {
      const response = await api.get("/users/my-connections");
      
      set({ // Update connections and last fetched timestamp
        connections: response.data.connections || [],
        lastFetched: Date.now(),
      });
      
    } catch (err) {
      console.error("Failed to fetch connections:", err);
      set({ error: "Failed to load your connections. Please try again later." });
      
    } finally {
      set({ loading: false });
    }
  },

  clearConnections: () => // Clear connections and reset state
    set({
      connections: [],
      error: null,
      lastFetched: null,
    }),
}));