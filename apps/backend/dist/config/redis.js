import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from './environment.js';
export const redisConnection = new Redis({
    host: env.redis.host,
    port: env.redis.port,
    password: env.redis.password,
    maxRetriesPerRequest: null,
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
//# sourceMappingURL=redis.js.map