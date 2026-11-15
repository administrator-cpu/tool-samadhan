import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { logger } from './logger.js';
import { callsQueue } from '../config/redis.js';
import { env } from '../config/environment.js';

const expo = new Expo();

type PushOptions = {
  title?: string;
  body?: string;
  /** Data-only message: no visible notification; wakes the app's background notification task. */
  dataOnly?: boolean;
  data?: Record<string, unknown>;
  channelId?: string;
  categoryId?: string;
  ttl?: number;
};

/** Sends a push to every device of the user. Returns how many devices accepted it. */
export async function sendPushToEmail(
  email: string,
  { title, body, data, dataOnly = false, channelId = 'default', categoryId, ttl }: PushOptions
): Promise<number> {
  try {
    const res = await db.execute(sql`
      SELECT pt.token
      FROM push_tokens pt
      JOIN users u ON u.id = pt.user_id
      WHERE lower(u.email) = lower(${email})
    `);

    const tokens = res.rows.map((r) => String(r.token)).filter((t) => Expo.isExpoPushToken(t));
    if (tokens.length === 0) {
      logger.warn(`[PUSH] No push tokens for ${email}`);
      return 0;
    }

    const messages: ExpoPushMessage[] = tokens.map((token) =>
      dataOnly
        ? {
            to: token,
            data,
            priority: 'high',
            _contentAvailable: true,
            ...(ttl ? { ttl } : {}),
          }
        : {
            to: token,
            sound: 'default',
            title,
            body,
            data,
            priority: 'high',
            channelId,
            ...(categoryId ? { categoryId } : {}),
            ...(ttl ? { ttl } : {}),
          }
    );

    let accepted = 0;
    const deadTokens: string[] = [];

    for (const chunk of expo.chunkPushNotifications(messages)) {
      const tickets: ExpoPushTicket[] = await expo.sendPushNotificationsAsync(chunk);
      tickets.forEach((ticket, i) => {
        const token = String(chunk[i]?.to);
        if (ticket.status === 'ok') {
          accepted += 1;
          return;
        }
        logger.error(`[PUSH] Rejected for ${email}: ${ticket.message} (${ticket.details?.error ?? 'unknown'})`);
        if (ticket.details?.error === 'DeviceNotRegistered') deadTokens.push(token);
      });
    }

    if (deadTokens.length) {
      await db.execute(
        sql`DELETE FROM push_tokens WHERE token IN (${sql.join(deadTokens.map((t) => sql`${t}`), sql`, `)})`
      );
      logger.info(`[PUSH] Removed ${deadTokens.length} dead token(s) for ${email}`);
    }

    logger.info(`[PUSH] ${accepted}/${tokens.length} accepted for ${email}`);
    return accepted;
  } catch (err) {
    logger.error('[PUSH] Failed to send push:', err);
    return 0;
  }
}

/* ── Calls ─────────────────────────────────────────────────────────────
 * Call pushes go to the Notification Service "calls" queue, which rings the phone natively
 * (APNs VoIP → CallKit, FCM high-priority data → full-screen call). Contract version 1:
 * notification-service src/calls/contract.ts.
 * Devices without a native call token (older app builds) keep the in-process Expo data push.
 */

export const CALL_CONTRACT_VERSION = 1;

export type CallPushType = 'call_invite' | 'call_cancel' | 'call_missed';
export type CallCancelReason = 'caller_cancelled' | 'answered_elsewhere' | 'declined_elsewhere';

export interface CallPushInput {
  callId: string;
  ttlSec: number;
  ticketId?: string | number | null;
  ticketNumber?: string | number | null;
  callerName?: string | null;
  fromEmail?: string | null;
  declineToken?: string | null;
  reason?: CallCancelReason | null;
  /** The callee device that answered/declined: it must not get its own cancel. */
  excludeDeviceId?: string | null;
}

type CallRecipient = { userId: string; nativeTokens: number };

async function getCallRecipient(email: string): Promise<CallRecipient | null> {
  const res = await db.execute(sql`
    SELECT u.id::text AS id,
           (SELECT count(*) FROM notif.device_tokens dt
             WHERE dt.user_id = u.id AND dt.kind IN ('apns_voip', 'fcm'))::int AS native
      FROM users u
     WHERE lower(u.email) = lower(${email})
     LIMIT 1
  `);
  const row = res.rows[0];
  return row ? { userId: String(row.id), nativeTokens: Number(row.native) || 0 } : null;
}

const nullable = (v: unknown) => (v === undefined || v === null || v === '' ? null : String(v));

async function sendLegacyCallPush(email: string, type: CallPushType, input: CallPushInput): Promise<number> {
  if (type === 'call_invite') {
    return sendPushToEmail(email, {
      dataOnly: true,
      data: {
        type,
        callId: input.callId,
        ticketId: input.ticketId ?? null,
        ticketNumber: input.ticketNumber ?? null,
        callerName: input.callerName ?? null,
        fromEmail: input.fromEmail ?? null,
        declineToken: input.declineToken ?? null,
      },
      ttl: input.ttlSec,
    });
  }
  if (type === 'call_cancel') {
    return sendPushToEmail(email, { dataOnly: true, data: { type, callId: input.callId }, ttl: input.ttlSec });
  }
  return sendPushToEmail(email, {
    title: 'Missed call',
    body: `Missed call from ${input.callerName || 'Someone'}`,
    data: { type, callId: input.callId, ticketId: input.ticketId ?? null },
    channelId: 'missed_call',
  });
}

/**
 * Rings / stops ringing / reports a missed call on every device of the callee.
 * Returns how many devices it was handed to (0 = callee unreachable by push).
 */
export async function sendCallPush(email: string, type: CallPushType, input: CallPushInput): Promise<number> {
  if (!env.calls.queueEnabled) return sendLegacyCallPush(email, type, input);

  let recipient: CallRecipient | null = null;
  try {
    recipient = await getCallRecipient(email);
  } catch (err) {
    logger.error('[CALL PUSH] Token lookup failed; using Expo push:', err);
    return sendLegacyCallPush(email, type, input);
  }
  if (!recipient) {
    logger.warn(`[CALL PUSH] No user for ${email}`);
    return 0;
  }

  if (type !== 'call_missed' && recipient.nativeTokens === 0) {
    // Old app build: only an Expo token exists.
    return sendLegacyCallPush(email, type, input);
  }

  const now = Date.now();
  const jobId = randomUUID();
  const job = {
    version: CALL_CONTRACT_VERSION,
    jobId,
    type,
    toEmail: email.trim().toLowerCase(),
    toUserId: recipient.userId,
    callId: input.callId,
    ticketId: nullable(input.ticketId),
    ticketNumber: nullable(input.ticketNumber),
    callerName: nullable(input.callerName),
    fromEmail: nullable(input.fromEmail),
    declineToken: nullable(input.declineToken),
    reason: input.reason ?? null,
    excludeDeviceId: nullable(input.excludeDeviceId),
    ttlSec: input.ttlSec,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + input.ttlSec * 1000).toISOString(),
  };

  try {
    await callsQueue.add(type, job, { jobId });
  } catch (err) {
    logger.error(`[CALL PUSH] Failed to enqueue ${type} for ${email}; using Expo push:`, err);
    return sendLegacyCallPush(email, type, input);
  }

  logger.info(`[CALL PUSH] ${type} ${input.callId} queued for ${email} (${recipient.nativeTokens} native device(s))`);
  return type === 'call_missed' ? 1 : recipient.nativeTokens;
}
