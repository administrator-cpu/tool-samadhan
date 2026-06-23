import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from './jwt.service.js';
import ticketEventEmitter from '../lib/event-emitter.js';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { env } from '../config/environment.js';

let io: Server;

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: env.cors.origin ? env.cors.origin.split(',').map((s) => s.trim()) : 'http://localhost:3000',
      credentials: true,
    },
  });

  io.use((socket: Socket & { user?: any }, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = verifyAccessToken(token);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket & { user?: any }) => {
    logger.info(`[SOCKET] User connected: ${socket.user.userId} (${socket.id})`);

    socket.join(`user:${socket.user.userId}`);

    socket.on('join_ticket', async (ticketId: string) => {
      try {
        const hasAccess = await checkTicketAccess(socket.user.userId, ticketId);
        if (hasAccess) {
          socket.join(`ticket_${ticketId}`);
          logger.info(`[SOCKET] User ${socket.user.userId} joined room: ticket_${ticketId}`);
          socket.emit('joined_room', { ticketId });
        } else {
          socket.emit('error', { message: 'Access denied to this ticket' });
        }
      } catch (err) {
        logger.error('[SOCKET] Error joining ticket room:', err);
        socket.emit('error', { message: 'Internal server error' });
      }
    });

    socket.on('sync_missed_events', async ({ ticketId, lastSeenEventId }: any) => {
      try {
        const hasAccess = await checkTicketAccess(socket.user.userId, ticketId);
        if (!hasAccess) return;

        const userRes = await db.execute(sql`SELECT role FROM users WHERE id = ${socket.user.userId}`);
        const role = userRes.rows[0]?.role as string;

        const result = await db.execute(sql`
          SELECT te.id, te.ticket_id, te.actor_user_id, u.name AS actor_name, 
                  te.event_type, te.message, te.metadata, te.visible_to_customer, te.created_at
           FROM ticket_events te
           LEFT JOIN users u ON u.id = te.actor_user_id
           WHERE te.ticket_id = ${ticketId} AND te.id > ${lastSeenEventId}
           ORDER BY te.id ASC
           LIMIT 201
        `);

        let missedEvents = result.rows;
        const hasMore = missedEvents.length === 201;

        if (hasMore) {
          missedEvents = missedEvents.slice(0, 200);
        }

        if (role === 'USER') {
          missedEvents = missedEvents.filter(e => e.visible_to_customer);
        }

        if (missedEvents.length > 0) {
          logger.info(`[SOCKET] Sending ${missedEvents.length} missed events for ticket ${ticketId}`);
          socket.emit('missed_events', { ticketId, events: missedEvents, hasMore });
        }
      } catch (err) {
        logger.error('[SOCKET] Error syncing missed events:', err);
      }
    });

    socket.on('leave_ticket', (ticketId: string) => {
      socket.leave(`ticket_${ticketId}`);
      logger.info(`[SOCKET] User ${socket.user.userId} left room: ticket_${ticketId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  ticketEventEmitter.on('ticket_updated', ({ ticketId, data }: any) => {
    logger.info(`[SOCKET] Broadcasting update for ticket ${ticketId}`);
    io.to(`ticket_${ticketId}`).emit('ticket_update', data);
  });

  return io;
};

export const disconnectUser = (userId: string) => {
  if (!io) return;
  logger.info(`[SOCKET] Forcibly disconnecting all sockets for user:${userId}`);
  io.to(`user:${userId}`).disconnectSockets(true);
};

const checkTicketAccess = async (userId: string, ticketId: string) => {
  try {
    const userRes = await db.execute(sql`SELECT role FROM users WHERE id = ${userId}`);
    const role = userRes.rows[0]?.role as string;

    // Notice we've kept 'MANAGER' logic intact here because it represents business logic, 
    // even though it's not strictly an enum on the DB.
    if (['ADMIN', 'MANAGER'].includes(role as string)) return true;

    if (role === 'SUPPORT_AGENT') {
      const agentRes = await db.execute(sql`SELECT 1 FROM tickets t JOIN employees e ON e.id = t.current_assigned_employee_id WHERE t.id = ${ticketId} AND e.user_id = ${userId}`);
      return agentRes.rowCount !== null && agentRes.rowCount > 0;
    }

    const customerRes = await db.execute(sql`SELECT 1 FROM tickets t JOIN customers c ON c.id = t.customer_id WHERE t.id = ${ticketId} AND c.user_id = ${userId}`);
    return customerRes.rowCount !== null && customerRes.rowCount > 0;
  } catch (err) {
    logger.error('[SOCKET] Ticket access check failed:', err);
    throw err;
  } finally {
  }
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
