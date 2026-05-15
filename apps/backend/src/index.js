import dotenv from "dotenv";
import http from "http";

dotenv.config();

import app from "./app.js";
import postgresPool from "./config/db.js";
import { createDatabaseTables } from "./models/userModel.js";
import { initSocket } from "./services/socketService.js";
import "./workers/ticketAutomationWorker.js"; // Initialize worker

const PORT = Number(process.env.BACKEND_PORT || 4000);

const start = async () => {
  await createDatabaseTables();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (HTTP + WebSocket)`);
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