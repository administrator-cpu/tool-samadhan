import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from './environment.js';
import { logger } from '../lib/logger.js';

export const redisConnection = new Redis({
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password,
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err) => {
  logger.error('[REDIS] Connection error:', err);
});

export const ticketAutomationQueue = new Queue('ticket-automation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: {
      age: 86400, // 1 day
    },
    removeOnFail: {
      age: 604800, // 7 days
    },
  },
});

ticketAutomationQueue.on('error', (err) => {
  logger.error('[BULLMQ QUEUE] Error:', err);
});

export const translationQueue = new Queue('translation-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

translationQueue.on('error', (err) => {
  logger.error('[TRANSLATION QUEUE] Error:', err);
});

// Consumed by the standalone Notification Service. Do not add a Worker for this queue in the backend.
export const NOTIFICATIONS_QUEUE_NAME = 'notifications';

export const notificationsQueue = new Queue(NOTIFICATIONS_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

notificationsQueue.on('error', (err) => {
  logger.error('[NOTIFICATIONS QUEUE] Error:', err);
});

// Consumed by the Notification Service (APNs VoIP / FCM). Latency-critical: few, fast retries.
export const CALLS_QUEUE_NAME = 'calls';

export const callsQueue = new Queue(CALLS_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 1000 },
    removeOnComplete: { age: 3600 },
    removeOnFail: { age: 86400 },
  },
});

callsQueue.on('error', (err) => {
  logger.error('[CALLS QUEUE] Error:', err);
});
