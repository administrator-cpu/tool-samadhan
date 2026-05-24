import dotenv from 'dotenv';
import { logger } from '../lib/logger.js';

dotenv.config();

function getEnvStr(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  if (value === undefined) {
    logger.warn(`Missing environment variable: ${key}`);
    return '';
  }
  return value;
}

function getEnvNum(key: string, defaultValue?: number): number {
  const value = process.env[key];
  if (!value) {
    if (defaultValue !== undefined) return defaultValue;
    logger.warn(`Missing environment variable: ${key}`);
    return 0;
  }
  const parsed = Number(value);
  if (isNaN(parsed)) {
    logger.error(`Environment variable ${key} is not a valid number: ${value}`);
    return defaultValue ?? 0;
  }
  return parsed;
}

export const env = {
  port: getEnvNum('PORT', 4000),
  nodeEnv: getEnvStr('NODE_ENV', 'development'),
  
  postgres: {
    user: getEnvStr('POSTGRES_USER', 'admin'),
    password: getEnvStr('POSTGRES_PASSWORD', 'your_password'),
    host: getEnvStr('POSTGRES_HOST', 'localhost'),
    database: getEnvStr('POSTGRES_DB', 'samadhandb'),
    port: getEnvNum('POSTGRES_PORT', 5432),
    poolMax: getEnvNum('PG_POOL_MAX', 10), // Increased from 1
  },

  redis: {
    host: getEnvStr('REDIS_HOST', 'localhost'),
    port: getEnvNum('REDIS_PORT', 6379),
    password: getEnvStr('REDIS_PASSWORD', ''),
  },

  jwt: {
    secret: getEnvStr('JWT_SECRET', 'secret'),
    refreshSecret: getEnvStr('JWT_REFRESH_SECRET', 'refresh_secret'),
    expiresIn: getEnvStr('JWT_EXPIRES_IN', '3d'),
    refreshExpiresIn: getEnvStr('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  cors: {
    origin: getEnvStr('CORS_ORIGIN', 'http://localhost:3000'),
  },

  emailjs: {
    serviceId: getEnvStr('EMAILJS_SERVICE_ID', ''),
    templateId: getEnvStr('EMAILJS_TEMPLATE_ID', ''),
    publicKey: getEnvStr('EMAILJS_PUBLIC_KEY', ''),
    privateKey: getEnvStr('EMAILJS_PRIVATE_KEY', ''),
    helpdeskEmail: getEnvStr('HELPDESK_EMAIL', 'helpdesk@fab5network.com'),
  }
};

export const isProd = env.nodeEnv === 'production';
