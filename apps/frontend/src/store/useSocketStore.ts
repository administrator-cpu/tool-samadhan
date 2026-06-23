import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useAuthStore } from "./useAuthStore";

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api", "") || "http://localhost:4000";
let socketTokenRefresh: Promise<string | null> | null = null;

interface SocketState {
  socket: Socket | null;
  isConnected: boolean;
  joinedRooms: Set<number>;
  lastSeenEventIdMap: Record<number, number>;
  connect: (token: string) => void;
  disconnect: () => void;
  updateToken: (token: string) => void;
  joinRoom: (ticketId: number) => void;
  leaveRoom: (ticketId: number) => void;
  markEventSeen: (ticketId: number, eventId: number) => void;
}

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  isConnected: false,
  joinedRooms: new Set(),
  lastSeenEventIdMap: {},

  connect: (token: string) => {
    const { socket } = get();
    if (socket) return;

    console.log("[SOCKET-STORE] Initializing global singleton connection...");
    const s = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity, // Never give up
      reconnectionDelay: 1000,
      reconnectionDelayMax: 30000, // Max 30s backoff
      randomizationFactor: 0.5,
    });

    s.on("connect", () => {
      console.log("[SOCKET-STORE] Global socket connected");
      set({ isConnected: true });

      // Automatic Re-join Logic
      const { joinedRooms } = get();
      if (joinedRooms.size > 0) {
        console.log(`[SOCKET-STORE] Re-joining ${joinedRooms.size} rooms after reconnect`);
        joinedRooms.forEach((id) => {
          s.emit("join_ticket", id);

          // Trigger initial sync if we have a last seen ID
          const lastId = get().lastSeenEventIdMap[id];
          if (lastId) {
            s.emit("sync_missed_events", { ticketId: id, lastSeenEventId: lastId });
          }
        });
      }
    });

    s.on("missed_events", (data: { ticketId: number, events: any[], hasMore: boolean }) => {
      const { ticketId, events, hasMore } = data;
      if (!events || events.length === 0) return;

      console.log(`[SOCKET-STORE] Sync received ${events.length} events for ticket ${ticketId}. hasMore: ${hasMore}`);

      // We don't update the UI state directly here (components listen for missed_events)
      // but we update our lastSeen tracking to ensure continuity
      const lastEvent = events[events.length - 1];
      if (lastEvent) {
        get().markEventSeen(ticketId, lastEvent.id);

        // Continuation Sync: Fetch the next batch if hasMore is true
        if (hasMore) {
          console.log(`[SOCKET-STORE] Continuation sync triggered for ticket ${ticketId}...`);
          s.emit("sync_missed_events", { ticketId, lastSeenEventId: lastEvent.id });
        }
      }
    });

    s.on("disconnect", (reason) => {
      console.log(`[SOCKET-STORE] Global socket disconnected: ${reason}`);
      set({ isConnected: false });
    });

    s.on("connect_error", async (err) => {
      set({ isConnected: false });

      if (err.message.includes("Authentication error")) {
        console.warn("[SOCKET-STORE] Socket auth expired. Refreshing token...");

        try {
          if (!socketTokenRefresh) {
            socketTokenRefresh = import("@/lib/api")
              .then(({ refreshToken }) => refreshToken())
              .then((data) => data?.data?.accessToken ?? null)
              .finally(() => {
                socketTokenRefresh = null;
              });
          }

          const freshToken = await socketTokenRefresh;

          if (freshToken) {
            console.log("[SOCKET-STORE] Token refreshed. Reconnecting socket...");
            s.auth = { token: freshToken };
            s.connect();
            return;
          }

          console.warn("[SOCKET-STORE] Token refresh failed. Ending socket session.");
          get().disconnect();
          useAuthStore.getState().clearAuth();

          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("auth-session-expired"));
          }
        } catch (refreshError) {
          console.error("[SOCKET-STORE] Socket token refresh failed:", refreshError);
        }

        return;
      }

      console.error("[SOCKET-STORE] Connection error:", err.message);
    });

    s.on("reconnect_attempt", (attempt) => {
      console.log(`[SOCKET-STORE] Reconnection attempt #${attempt}`);
    });

    s.on("reconnect_failed", () => {
      console.error("[SOCKET-STORE] Reconnection failed after all attempts");
    });

    set({ socket: s });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      console.log("[SOCKET-STORE] Disconnecting global singleton...");
      socket.disconnect();
      set({ socket: null, isConnected: false, joinedRooms: new Set(), lastSeenEventIdMap: {} });
    }
  },

  updateToken: (token: string) => {
    const { socket, isConnected } = get();
    if (socket) {
      console.log("[SOCKET-STORE] Updating global auth token");
      socket.auth = { token };

      // During socket auth recovery, the connect_error handler owns reconnecting.
      if (!isConnected && !socketTokenRefresh) {
        console.log("[SOCKET-STORE] Socket disconnected, attempting to connect with new token...");
        socket.connect();
      }
    }
  },

  joinRoom: (ticketId: number) => {
    const { socket, isConnected, joinedRooms, lastSeenEventIdMap } = get();
    if (!socket || !isConnected) return;

    if (joinedRooms.has(ticketId)) {
      console.log(`[SOCKET-STORE] Already joined room for ticket ${ticketId}, skipping.`);
      return;
    }

    console.log(`[SOCKET-STORE] Joining ticket room: ${ticketId}`);
    socket.emit("join_ticket", ticketId);

    // Also sync missed events immediately on join if we have history
    const lastId = lastSeenEventIdMap[ticketId];
    if (lastId) {
      socket.emit("sync_missed_events", { ticketId, lastSeenEventId: lastId });
    }

    const newRooms = new Set(joinedRooms);
    newRooms.add(ticketId);
    set({ joinedRooms: newRooms });
  },

  leaveRoom: (ticketId: number) => {
    const { socket, joinedRooms } = get();
    if (!socket) return;

    if (!joinedRooms.has(ticketId)) return;

    console.log(`[SOCKET-STORE] Leaving ticket room: ${ticketId}`);
    socket.emit("leave_ticket", ticketId);

    const newRooms = new Set(joinedRooms);
    newRooms.delete(ticketId);
    set({ joinedRooms: newRooms });
  },

  markEventSeen: (ticketId: number, eventId: number) => {
    const { lastSeenEventIdMap } = get();
    const currentMax = lastSeenEventIdMap[ticketId] || 0;

    if (eventId > currentMax) {
      set({
        lastSeenEventIdMap: {
          ...lastSeenEventIdMap,
          [ticketId]: eventId,
        },
      });
    }
  },
}));
