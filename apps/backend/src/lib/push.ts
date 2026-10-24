import { Expo, type ExpoPushMessage, type ExpoPushTicket } from 'expo-server-sdk';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import { logger } from './logger.js';

const expo = new Expo();

type PushOptions = {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  channelId?: string;
  categoryId?: string;
  ttl?: number;
};

/** Sends a push to every device of the user. Returns how many devices accepted it. */
export async function sendPushToEmail(
  email: string,
  { title, body, data, channelId = 'default', categoryId, ttl }: PushOptions
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

    const messages: ExpoPushMessage[] = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
      channelId,
      ...(categoryId ? { categoryId } : {}),
      ...(ttl ? { ttl } : {}),
    }));

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
