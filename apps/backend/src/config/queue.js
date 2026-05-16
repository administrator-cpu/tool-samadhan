import { Queue } from "bullmq";
import ioredis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

export const redisConnection = new ioredis(redisConfig);

export const ticketAutomationQueue = new Queue("ticket-automation", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
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
