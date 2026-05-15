import { Server } from "socket.io";
import { verifyAccessToken } from "./jwt.js";
import ticketEventEmitter from "../utils/eventEmitter.js";
import postgresPool from "../config/db.js";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL)
        ? (process.env.CORS_ORIGIN || process.env.FRONTEND_URL).split(",").map((s) => s.trim())
        : "http://localhost:3000",
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[SOCKET] User connected: ${socket.user.userId} (${socket.id})`);

    // Join user-specific room for forced disconnects/notifications
    socket.join(`user:${socket.user.userId}`);

    socket.on("join_ticket", async (ticketId) => {
      try {
        const hasAccess = await checkTicketAccess(socket.user.userId, ticketId);
        if (hasAccess) {
          socket.join(`ticket_${ticketId}`);
          console.log(`[SOCKET] User ${socket.user.userId} joined room: ticket_${ticketId}`);
          socket.emit("joined_room", { ticketId });
        } else {
          socket.emit("error", { message: "Access denied to this ticket" });
        }
      } catch (err) {
        console.error("[SOCKET] Error joining ticket room:", err);
        socket.emit("error", { message: "Internal server error" });
      }
    });

    socket.on("sync_missed_events", async ({ ticketId, lastSeenEventId }) => {
      try {
        // Strict real-time access validation
        const hasAccess = await checkTicketAccess(socket.user.userId, ticketId);
        if (!hasAccess) return;

        const userRes = await postgresPool.query("SELECT role FROM users WHERE id = $1", [socket.user.userId]);
        const role = userRes.rows[0]?.role;

        // Fetch events newer than lastSeenEventId with LIMIT 201 for hasMore check
        const result = await postgresPool.query(
          `SELECT te.id, te.ticket_id, te.actor_user_id, u.name AS actor_name, 
                  te.event_type, te.message, te.metadata, te.visible_to_customer, te.created_at
           FROM ticket_events te
           LEFT JOIN users u ON u.id = te.actor_user_id
           WHERE te.ticket_id = $1 AND te.id > $2
           ORDER BY te.id ASC
           LIMIT 201`,
          [ticketId, lastSeenEventId]
        );

        let missedEvents = result.rows;
        const hasMore = missedEvents.length === 201;
        
        if (hasMore) {
          // Remove the 201st item
          missedEvents = missedEvents.slice(0, 200);
        }

        // Filter for customers
        if (role === "USER") {
          missedEvents = missedEvents.filter(e => e.visible_to_customer);
        }

        if (missedEvents.length > 0) {
          console.log(`[SOCKET] Sending ${missedEvents.length} missed events (hasMore: ${hasMore}) for ticket ${ticketId}`);
          socket.emit("missed_events", { ticketId, events: missedEvents, hasMore });
        }
      } catch (err) {
        console.error("[SOCKET] Error syncing missed events:", err);
      }
    });

    socket.on("leave_ticket", (ticketId) => {
      socket.leave(`ticket_${ticketId}`);
      console.log(`[SOCKET] User ${socket.user.userId} left room: ticket_${ticketId}`);
    });

    socket.on("disconnect", () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  // Listen for ticket events from the service
  ticketEventEmitter.on("ticket_updated", ({ ticketId, data }) => {
    console.log(`[SOCKET] Broadcasting update for ticket ${ticketId}`);
    io.to(`ticket_${ticketId}`).emit("ticket_update", data);
  });

  return io;
};

/**
 * Forcibly disconnects all active sockets for a specific user.
 * Useful for session revocation, password changes, or account locking.
 */
export const disconnectUser = (userId) => {
  if (!io) return;
  console.log(`[SOCKET] Forcibly disconnecting all sockets for user:${userId}`);
  io.to(`user:${userId}`).disconnectSockets(true);
};

const checkTicketAccess = async (userId, ticketId) => {
  const client = await postgresPool.connect();
  try {
    // 1. Check if user is an employee (employees generally have access or we check assignments)
    const userRes = await client.query("SELECT role FROM users WHERE id = $1", [userId]);
    const role = userRes.rows[0]?.role;

    if (["ADMIN", "MANAGER"].includes(role)) return true;

    if (role === "SUPPORT_AGENT") {
      const agentRes = await client.query(
        "SELECT 1 FROM tickets t JOIN employees e ON e.id = t.current_assigned_employee_id WHERE t.id = $1 AND e.user_id = $2",
        [ticketId, userId]
      );
      return agentRes.rowCount > 0;
    }

    // 2. Check if user is the customer who created the ticket
    const customerRes = await client.query(
      "SELECT 1 FROM tickets t JOIN customers c ON c.id = t.customer_id WHERE t.id = $1 AND c.user_id = $2",
      [ticketId, userId]
    );
    return customerRes.rowCount > 0;
  } finally {
    client.release();
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
