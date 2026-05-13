import dotenv from "dotenv";

import app from "./app.js";
import postgresPool from "./config/db.js";
import { createDatabaseTables } from "./models/userModel.js";

const PORT = Number(process.env.BACKEND_PORT || 4000);

const start = async () => {
  await createDatabaseTables();

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
      try {
        await postgresPool.end();
      } finally {
        process.exit(0);
      }
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});