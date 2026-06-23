import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '../config/database.js';
import { logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { env } from '../config/environment.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const applyMigrations = async () => {
  if (env.nodeEnv === 'development') {
    logger.info('[DB] Development mode: Automatically generating migrations...');
    try {
      execSync('npm run db:generate', { stdio: 'inherit' });
    } catch (e) {
      logger.error('[DB] Failed to generate migrations. Schema might have errors.');
      throw e;
    }
  }

  logger.info('[DB] Starting automatic database migration...');
  try {
    const migrationsFolder = path.join(__dirname, 'drizzle/migrations');
    
    await migrate(db, { migrationsFolder });
    logger.info('[DB] Database migration completed successfully.');
  } catch (error) {
    logger.error('[DB] Database migration failed:', error);
    throw error;
  }
};
