import { Pool, PoolClient } from 'pg';
import { env } from './environment.js';
import { logger } from '../lib/logger.js';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../database/drizzle/schema.js';

export const postgresPool = new Pool({
  user: env.postgres.user,
  password: env.postgres.password,
  host: env.postgres.host,
  database: env.postgres.database,
  port: env.postgres.port,
  max: env.postgres.poolMax || 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10_000,
  ssl: {
    rejectUnauthorized: false,
  },
});

postgresPool.on('connect', (client) => {
});

export const db = drizzle(postgresPool, { schema });

logger.info(`[DB] Attempting to connect to ${env.postgres.host}:${env.postgres.port}...`);

postgresPool.on('error', (err) => {
  logger.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Utility function to manage database transactions.
 * Automates checking out a client, BEGIN, COMMIT/ROLLBACK, and release.
 */
export async function withTransaction<T>( work: (client: PoolClient) => Promise<T> ): Promise<T> {
  const client = await postgresPool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      logger.error('Error during transaction rollback', rollbackError);
    }
    throw error;
  } finally {
    client.release();
  }
}
