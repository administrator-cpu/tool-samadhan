import { useEffect } from "react";
import { useSocketStore } from "@/store/useSocketStore";

export const useSocket = (ticketId?: string | number) => {
  const { socket, isConnected, joinRoom, leaveRoom } = useSocketStore();

  useEffect(() => {
    if (socket && isConnected && ticketId) {
      const id = Number(ticketId);
      joinRoom(id);

      return () => {
        leaveRoom(id);
      };
    }
  }, [ticketId, isConnected, socket, joinRoom, leaveRoom]);

  return { socket, isConnected };
};
