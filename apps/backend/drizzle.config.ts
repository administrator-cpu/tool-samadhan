import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

const isSsl = process.env.POSTGRES_SSL !== undefined
  ? process.env.POSTGRES_SSL === 'true' || process.env.POSTGRES_SSL === '1'
  : (process.env.NODE_ENV || 'production') === 'development';

export default defineConfig({
  out: './src/database/drizzle/migrations',
  schema: './src/database/drizzle/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}${isSsl ? '?sslmode=require' : ''}`,
  },
  verbose: true,
  strict: true,
});
