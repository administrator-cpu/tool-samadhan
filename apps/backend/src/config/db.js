import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config();

const postgresPool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  port: Number(process.env.POSTGRES_PORT),
  max: Number(process.env.PG_POOL_MAX || 1),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: {
    rejectUnauthorized: false,
  },
});

console.log(`[DB] Attempting to connect to ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}...`);

postgresPool.on("connect", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log("Connected to the database.");
  }
});

postgresPool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
  process.exit(1);
});

export default postgresPool;
