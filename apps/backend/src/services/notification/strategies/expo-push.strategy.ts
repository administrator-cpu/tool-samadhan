import { INotificationStrategy, NotificationPayload } from '../notification.types.js';
import { PushTokenRepository } from '../../../repositories/index.js';
import { logger } from '../../../lib/logger.js';

export class ExpoPushStrategy implements INotificationStrategy {
  private readonly EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
  private readonly CHUNK_SIZE = 100; // Expo allows max 100 messages per request

  async send(payload: NotificationPayload): Promise<void> {
    const { userIds, title, body, data } = payload;
    if (!userIds || userIds.length === 0) return;

    try {
      // 1. Fetch valid push tokens for users
      const pushTokensList = await PushTokenRepository.getTokensByUserIds(userIds);
      if (!pushTokensList || pushTokensList.length === 0) {
        return; // No tokens for these users
      }

      // 2. Prepare Expo messages
      const messages = pushTokensList.map((pt) => ({
        to: pt.token,
        title,
        body,
        data,
      }));

      // 3. Chunk messages
      const chunks = this.chunkArray(messages, this.CHUNK_SIZE);

      // 4. Send to Expo push API
      const invalidTokens: string[] = [];
      for (const chunk of chunks) {
        try {
          const response = await fetch(this.EXPO_PUSH_URL, {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(chunk),
          });

          if (!response.ok) {
            const errorText = await response.text();
            logger.error(`[EXPO-PUSH] Error response from Expo: ${response.status} - ${errorText}`);
            continue;
          }

          const result = await response.json();
          // Expo returns an array of receipts (or error tickets) in result.data
          if (result.data && Array.isArray(result.data)) {
            result.data.forEach((ticket: any, index: number) => {
              if (ticket.status === 'error') {
                logger.warn(`[EXPO-PUSH] Error sending to token ${(chunk[index] as any).to}: ${ticket.message}`);
                if (
                  ticket.details &&
                  ticket.details.error === 'DeviceNotRegistered'
                ) {
                  // Mark this token for deletion
                  invalidTokens.push((chunk[index] as any).to);
                }
              }
            });
          }
        } catch (fetchError) {
          logger.error('[EXPO-PUSH] Network error sending chunk:', fetchError);
        }
      }

      // 5. Cleanup dead tokens
      if (invalidTokens.length > 0) {
        await PushTokenRepository.removeTokens(invalidTokens);
        logger.info(`[EXPO-PUSH] Removed ${invalidTokens.length} unregistered tokens.`);
      }

    } catch (error) {
      logger.error('[EXPO-PUSH] Unexpected error in PushNotificationStrategy:', error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunked_arr: T[][] = [];
    let index = 0;
    while (index < array.length) {
      chunked_arr.push(array.slice(index, size + index));
      index += size;
    }
    return chunked_arr;
  }
}
