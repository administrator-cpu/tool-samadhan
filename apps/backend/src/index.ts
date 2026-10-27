import http from 'http';
import app from './app.js';
import { env } from './config/environment.js';
import { logger } from './lib/logger.js';
import { postgresPool } from './config/database.js';
import { initSocket } from './services/socket.service.js';
import { applyMigrations } from './database/migrate.js';
import { ticketAutomationWorker } from './workers/ticket-automation.worker.js';
import { translationWorker } from './workers/translation.worker.js';
import { ticketAutomationQueue } from './config/redis.js';
import { sendServerErrorEmail } from './services/email.service.js';

const PORT = env.port;
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Start server function
const startServer = async () => {
  try {
    // Wait for DB to be ready
    logger.info('[DB] Database is ready.');

    // Automatically apply migrations
    await applyMigrations();

    server.listen(PORT, () => {
      logger.info(`[SERVER] Running in ${env.nodeEnv} mode on port ${PORT}`);
    });

    // Schedule fallback cron job asynchronously (does not block HTTP server startup)
    ticketAutomationQueue.add(
      'BULK_CLOSE_RESOLVED_TICKETS',
      {},
      {
        repeat: { pattern: '0 3 * * *' }, // 3 AM every day
        jobId: 'bulk-close-resolved-tickets-cron'
      }
    ).then(() => {
      logger.info('[CRON] Bulk close tickets fallback job scheduled for 3 AM daily.');
    }).catch((queueError) => {
      logger.warn('[CRON] Failed to schedule ticket automation cron job (Redis may be unavailable):', queueError);
    });
  } catch (error) {
    logger.error('[APP-INIT] Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown Function
const gracefulShutdown = async (signal: string) => {
  logger.info(`[SHUTDOWN] Received ${signal}. Starting graceful shutdown...`);

  try {
    await ticketAutomationWorker.close();
    await translationWorker.close();
    logger.info('[BULLMQ] Worker closed.');

    server.close(() => {
      logger.info('[SERVER] HTTP server closed.');
    });

    await postgresPool.end();
    logger.info('[DB] PostgreSQL pool closed.');

    process.exit(0);
  } catch (error) {
    logger.error('[SHUTDOWN] Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Catch unhandled rejections and uncaught exceptions
process.on('unhandledRejection', (reason: any, promise) => {
  logger.error('[UNHANDLED-REJECTION] Unhandled Rejection at: promise, reason: ', reason);
  
  sendServerErrorEmail({
    timestamp: new Date().toISOString(),
    errorType: 'Unhandled Rejection',
    errorMessage: reason instanceof Error ? reason.message : String(reason),
    stackTrace: reason instanceof Error ? reason.stack : undefined,
    path: 'Process Level',
  }).catch(e => logger.error('[EMAIL-SERVICE] Failed to send server error email', e));
  
  // Optional: gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  logger.error('[UNCAUGHT-EXCEPTION] Uncaught Exception thrown:', error);
  
  sendServerErrorEmail({
    timestamp: new Date().toISOString(),
    errorType: 'Uncaught Exception',
    errorMessage: error.message,
    stackTrace: error.stack,
    path: 'Process Level',
  })
    .catch(e => logger.error('[EMAIL-SERVICE] Failed to send server error email', e))
    .finally(() => {
      // Graceful shutdown after attempting to send the email
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });
});
