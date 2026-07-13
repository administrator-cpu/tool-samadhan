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
  loadingConnection: boolean; // Whether connections are currently being loaded
  connectionError: string | null; // Error message if loading fails
  lastFetched: number | null; // Timestamp of the last successful fetch
  hasFetched: boolean;


  fetchConnections: () => Promise<void>; // Function to fetch connections
  clearConnections: () => void; // Function to clear connections
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  connections: [],
  loadingConnection: false,
  connectionError: null,
  lastFetched: null,
  hasFetched: false,

  fetchConnections: async () => {
    const { loadingConnection, lastFetched, hasFetched } = get();

    if (loadingConnection) return; // Already loading, return early

    if (lastFetched && Date.now() - lastFetched < CACHE_DURATION) {
      if (!hasFetched) {
        set({ hasFetched: true });
      }
      return; // Cache hit, return early
    }

    set({ loadingConnection: true, connectionError: null });

    try {
      const response = await api.get("/users/my-connections");
      
      set({ // Update connections and last fetched timestamp
        connections: response.data.connections || [],
        lastFetched: Date.now(),
      });
      
    } catch (err) {
      console.error("Failed to fetch connections:", err);
      set({ connectionError: "Failed to load your connections. Please try again later."});
      
    } finally {
      set({ loadingConnection: false,  hasFetched: true, });
    }
  },

  clearConnections: () => // Clear connections and reset state
    set({
      connections: [],
      connectionError: null,
      lastFetched: null,
      hasFetched: false,
    }),
}));