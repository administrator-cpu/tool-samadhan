// sockets/callSignaling.ts
import { Server, Socket } from 'socket.io';
import { sendPushToEmail } from '../lib/push.js';
import { logger } from '../lib/logger.js';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';

const RELAY_EVENTS = [
  'call:invite',
  'call:offer',
  'call:answer',
  'call:ice-candidate',
  'call:accept',
  'call:reject',
  'call:cancel',
  'call:end',
  'call:busy',
] as const;

type RelayEvent = (typeof RELAY_EVENTS)[number];

type CallPayload = {
  toEmail: string;
  callId?: string;
  callerName?: string;
  ticketId?: string | number;
  [k: string]: unknown;
};

type PendingCall = {
  callId: string;
  fromEmail: string;
  callerName: string;
  events: { event: RelayEvent; payload: Record<string, unknown> }[];
  pushed: boolean;
  timer: NodeJS.Timeout;
};

const PENDING_TTL_MS = 50_000;

const RINGBACK_TUNES = new Set(['classic', 'chime', 'meadow', 'calm']);

async function getRingbackTune(email: string): Promise<string | null> {
  try {
    const res = await db.execute(sql`SELECT ringback_tune FROM users WHERE lower(email) = lower(${email}) LIMIT 1`);
    const tune = res.rows[0]?.ringback_tune;
    return typeof tune === 'string' && RINGBACK_TUNES.has(tune) ? tune : null;
  } catch (err) {
    logger.error('[CALL] Failed to read ringback tune:', err);
    return null;
  }
}

const BUFFERED_EVENTS = new Set<RelayEvent>(['call:invite', 'call:offer', 'call:ice-candidate']);
const CALLEE_SETTLES = new Set<RelayEvent>(['call:accept', 'call:answer', 'call:reject', 'call:busy']);
const CALLER_ABANDONS = new Set<RelayEvent>(['call:cancel', 'call:end']);

const pendingByCallee = new Map<string, Map<string, PendingCall>>();

const norm = (e: unknown) => String(e ?? '').trim().toLowerCase();
const roomFor = (email: string) => `email_${email}`;

function getPending(calleeEmail: string, callId: string) {
  return pendingByCallee.get(calleeEmail)?.get(callId);
}

function removePending(calleeEmail: string, callId: string) {
  const calls = pendingByCallee.get(calleeEmail);
  const pending = calls?.get(callId);
  if (!calls || !pending) return null;
  clearTimeout(pending.timer);
  calls.delete(callId);
  if (calls.size === 0) pendingByCallee.delete(calleeEmail);
  return pending;
}

function createPending(calleeEmail: string, callId: string, fromEmail: string, callerName: string) {
  removePending(calleeEmail, callId);
  const pending: PendingCall = {
    callId,
    fromEmail,
    callerName,
    events: [],
    pushed: false,
    timer: setTimeout(() => removePending(calleeEmail, callId), PENDING_TTL_MS),
  };
  if (!pendingByCallee.has(calleeEmail)) pendingByCallee.set(calleeEmail, new Map());
  pendingByCallee.get(calleeEmail)!.set(callId, pending);
  return pending;
}

function replayPending(socket: Socket, calleeEmail: string) {
  const calls = pendingByCallee.get(calleeEmail);
  if (!calls) return;
  for (const pending of calls.values()) {
    for (const { event, payload } of pending.events) socket.emit(event, payload);
    logger.info(`[CALL] Replayed ${pending.events.length} events for ${pending.callId} to ${calleeEmail}`);
  }
}

async function presenceOf(io: Server, email: string) {
  const sockets = await io.in(roomFor(email)).fetchSockets();
  return {
    connected: sockets.length > 0,
    foreground: sockets.some((s) => s.data?.foreground !== false),
  };
}

export function registerCallSignaling(io: Server, socket: Socket) {
  const userEmail = norm((socket as any).user?.email);
  if (!userEmail) return;

  socket.data.foreground = true;
  socket.join(roomFor(userEmail));
  replayPending(socket, userEmail);

  type Ack = (res: Record<string, unknown>) => void;

  socket.on('call:tune:get', async (_payload: unknown, ack?: Ack) => {
    if (typeof ack !== 'function') return;
    ack({ ok: true, tune: await getRingbackTune(userEmail) });
  });

  socket.on('call:tune:set', async (payload: { tune?: unknown }, ack?: Ack) => {
    const reply = typeof ack === 'function' ? ack : () => {};
    const tune = typeof payload?.tune === 'string' ? payload.tune : '';
    if (!RINGBACK_TUNES.has(tune)) return reply({ ok: false, error: 'invalid_tune' });
    try {
      await db.execute(
        sql`UPDATE users SET ringback_tune = ${tune}, updated_at = CURRENT_TIMESTAMP WHERE lower(email) = lower(${userEmail})`
      );
      reply({ ok: true, tune });
    } catch (err) {
      logger.error('[CALL] Failed to save ringback tune:', err);
      reply({ ok: false, error: 'server_error' });
    }
  });

  socket.on('app:state', (state: string) => {
    const foreground = state === 'active';
    const wasForeground = socket.data.foreground;
    socket.data.foreground = foreground;
    if (foreground && !wasForeground) replayPending(socket, userEmail);
  });

  RELAY_EVENTS.forEach((event) => {
    socket.on(event, async (raw: CallPayload) => {
      try {
        const toEmail = norm(raw?.toEmail);
        const callId = raw?.callId ? String(raw.callId) : '';
        if (!toEmail || !callId) return;

        const payload = { ...raw, toEmail, callId, fromEmail: userEmail };

        if (event === 'call:invite') {
          const pending = createPending(toEmail, callId, userEmail, String(raw.callerName || 'Someone'));
          pending.events.push({ event, payload });

          io.to(roomFor(toEmail)).emit(event, payload);

          const presence = await presenceOf(io, toEmail);
          let delivered = presence.connected;

          if (!presence.foreground) {
            const sent = await sendPushToEmail(toEmail, {
              title: 'Incoming call',
              body: `${pending.callerName} is calling you`,
              data: {
                type: 'call_invite',
                callId,
                ticketId: raw.ticketId ?? null,
                callerName: pending.callerName,
                fromEmail: userEmail,
              },
              channelId: 'incoming_call',
              categoryId: 'incoming_call',
              ttl: Math.ceil(PENDING_TTL_MS / 1000),
            });
            pending.pushed = sent > 0;
            delivered = delivered || sent > 0;
          }

          if (!delivered) {
            removePending(toEmail, callId);
            socket.emit('call:unavailable', { callId, fromEmail: toEmail });
            logger.info(`[CALL] ${callId}: ${toEmail} unreachable (no socket, no push)`);
            return;
          }

          socket.emit('call:ringing', { callId, fromEmail: toEmail, tune: await getRingbackTune(toEmail) });
          return;
        }

        if (BUFFERED_EVENTS.has(event)) {
          getPending(toEmail, callId)?.events.push({ event, payload });
          io.to(roomFor(toEmail)).emit(event, payload);
          return;
        }

        if (CALLER_ABANDONS.has(event)) {
          const pending = removePending(toEmail, callId);
          io.to(roomFor(toEmail)).emit(event, payload);
          if (pending?.pushed) {
            await sendPushToEmail(toEmail, {
              title: 'Missed call',
              body: `Missed call from ${pending.callerName}`,
              data: { type: 'call_missed', callId, ticketId: raw.ticketId ?? null },
              channelId: 'missed_call',
            });
          }
          return;
        }

        if (CALLEE_SETTLES.has(event)) {
          removePending(userEmail, callId);
          if (event === 'call:accept' || event === 'call:reject') {
            socket.to(roomFor(userEmail)).emit('call:cancel', { callId, fromEmail: toEmail });
          }
        }

        io.to(roomFor(toEmail)).emit(event, payload);
      } catch (err) {
        logger.error(`[CALL] Failed to relay ${event}:`, err);
      }
    });
  });
}