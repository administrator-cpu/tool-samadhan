import { eq, inArray } from 'drizzle-orm';
import { db } from '../config/database.js';
import { pushTokens } from '../database/drizzle/schema.js';
import { logger } from '../lib/logger.js';

export class PushTokenRepository {
  /**
   * Upserts a push token. If the token already exists, reassigns it to the new user.
   */
  static async upsertToken(userId: number, token: string, platform?: string) {
    try {
      await db.insert(pushTokens)
        .values({
          user_id: userId,
          token,
          platform
        })
        .onConflictDoUpdate({
          target: pushTokens.token,
          set: {
            user_id: userId,
            platform,
            created_at: new Date()
          }
        });
      return true;
    } catch (error) {
      logger.error('[DB] Error upserting push token:', error);
      throw error;
    }
  }

  /**
   * Removes a specific push token (e.g. on logout)
   */
  static async removeToken(token: string) {
    try {
      await db.delete(pushTokens).where(eq(pushTokens.token, token));
      return true;
    } catch (error) {
      logger.error('[DB] Error removing push token:', error);
      throw error;
    }
  }

  /**
   * Removes multiple push tokens (e.g. invalid tokens detected from Expo)
   */
  static async removeTokens(tokens: string[]) {
    if (!tokens || tokens.length === 0) return;
    try {
      await db.delete(pushTokens).where(inArray(pushTokens.token, tokens));
      return true;
    } catch (error) {
      logger.error('[DB] Error removing multiple push tokens:', error);
      throw error;
    }
  }

  /**
   * Gets push tokens for an array of user IDs
   */
  static async getTokensByUserIds(userIds: number[]) {
    if (!userIds || userIds.length === 0) return [];
    try {
      return await db.query.pushTokens.findMany({
        where: inArray(pushTokens.user_id, userIds)
      });
    } catch (error) {
      logger.error('[DB] Error fetching push tokens by user IDs:', error);
      throw error;
    }
  }
}
