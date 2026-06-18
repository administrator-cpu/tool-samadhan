import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, postgresPool } from '../config/database.js';
import { logger } from '../lib/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  logger.info('Starting database migration...');
  try {
    // This will run migrations on the database, skipping the ones already applied
    await migrate(db, { migrationsFolder: path.join(__dirname, 'drizzle/migrations') });
    logger.info('Database migration completed successfully.');
  } catch (error) {
    logger.error('Database migration failed:', error);
    process.exit(1);
  } finally {
    await postgresPool.end();
  }
}

run();
