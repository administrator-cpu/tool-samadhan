import http from 'http';
import app from './app.js';
import { env } from './config/environment.js';
import { logger } from './lib/logger.js';
import { postgresPool } from './config/database.js';
import { initSocket } from './services/socket.service.js';
import { applyMigrations } from './database/migrate.js';
import { ticketAutomationWorker } from './workers/ticket-automation.worker.js';
import { ticketAutomationQueue } from './config/redis.js';

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

    // Schedule fallback cron job
    await ticketAutomationQueue.add(
      'BULK_CLOSE_RESOLVED_TICKETS',
      {},
      {
        repeat: { pattern: '0 3 * * *' }, // 3 AM every day
        jobId: 'bulk-close-resolved-tickets-cron'
      }
    );
    logger.info('[CRON] Bulk close tickets fallback job scheduled for 3 AM daily.');

    server.listen(PORT, () => {
      logger.info(`[SERVER] Running in ${env.nodeEnv} mode on port ${PORT}`);
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
process.on('unhandledRejection', (reason, promise) => {
  logger.error('[UNHANDLED-REJECTION] Unhandled Rejection at: promise, reason: ', reason);
  // Optional: gracefulShutdown('UNHANDLED_REJECTION');
});

process.on('uncaughtException', (error) => {
  logger.error('[UNCAUGHT-EXCEPTION] Uncaught Exception thrown:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});
