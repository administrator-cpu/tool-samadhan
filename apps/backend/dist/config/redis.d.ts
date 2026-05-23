import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
export declare const redisConnection: Redis;
export declare const ticketAutomationQueue: Queue<any, any, string, any, any, string>;
//# sourceMappingURL=redis.d.ts.map