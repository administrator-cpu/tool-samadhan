// sockets/callSignaling.ts
import { Server, Socket } from 'socket.io';
import { sendPushToEmail } from '../lib/push.js';
import { logger } from '../lib/logger.js';

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

async function isReachable(io: Server, email: string) {
  const sockets = await io.in(roomFor(email)).fetchSockets();
  return sockets.some((s) => s.data?.foreground !== false);
}

export function registerCallSignaling(io: Server, socket: Socket) {
  const userEmail = norm((socket as any).user?.email);
  if (!userEmail) return;

  socket.data.foreground = true;
  socket.join(roomFor(userEmail));
  replayPending(socket, userEmail);

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

          if (!(await isReachable(io, toEmail))) {
            pending.pushed = true;
            await sendPushToEmail(toEmail, {
              title: 'Incoming call',
              body: `${pending.callerName} is calling you`,
              data: { type: 'call_invite', callId, ticketId: raw.ticketId },
            });
          }
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
              data: { type: 'call_missed', callId, ticketId: raw.ticketId },
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