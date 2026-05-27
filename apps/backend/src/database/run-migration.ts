import { postgresPool } from '../config/database.js';

async function run() {
  try {
    await postgresPool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;');
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await postgresPool.end();
  }
}
run();
