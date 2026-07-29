import { INotificationStrategy, NotificationPayload } from './notification.types.js';
import { ExpoPushStrategy } from './strategies/expo-push.strategy.js';
import { logger } from '../../lib/logger.js';

class NotificationContext {
  private strategies: INotificationStrategy[] = [];

  constructor() {
    // Register Default Strategies
    this.registerStrategy(new ExpoPushStrategy());
  }

  registerStrategy(strategy: INotificationStrategy) {
    this.strategies.push(strategy);
  }

  /**
   * Dispatches the notification payload to all registered strategies.
   * This is fire-and-forget, it doesn't block the caller.
   */
  async notify(payload: NotificationPayload): Promise<void> {
    if (!payload.userIds || payload.userIds.length === 0) {
      return;
    }

    try {
      const promises = this.strategies.map((strategy) => strategy.send(payload));
      
      // Use allSettled so if one strategy fails, others still run
      const results = await Promise.allSettled(promises);
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.error(`[NOTIFICATION] Strategy at index ${index} failed:`, result.reason);
        }
      });
    } catch (error) {
      logger.error('[NOTIFICATION] Unexpected error dispatching notifications:', error);
    }
  }
}

// Export singleton instance
export const NotificationService = new NotificationContext();
