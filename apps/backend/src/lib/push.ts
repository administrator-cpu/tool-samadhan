import { Expo } from 'expo-server-sdk';
import { db } from '../config/database.js';
import { sql } from 'drizzle-orm';
import { logger } from './logger.js';

const expo = new Expo();

export async function sendPushToEmail(email: string, { title, body, data }: { title: string, body: string, data?: any }) {
  try {
    const res = await db.execute(sql`
      SELECT pt.token
      FROM push_tokens pt
      JOIN users u ON u.id = pt.user_id
      WHERE u.email = ${email}
    `);

    const tokens = res.rows.map((r) => r.token).filter((t) => Expo.isExpoPushToken(t));
    if (tokens.length === 0) return;

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default' as const,
      title,
      body,
      data,
      priority: 'high' as const,
      channelId: 'default',
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      logger.info(`[PUSH] Sent ${chunk.length} to ${email}`, tickets);
    }
  } catch (err) {
    logger.error('[PUSH] Failed to send push:', err);
  }
}