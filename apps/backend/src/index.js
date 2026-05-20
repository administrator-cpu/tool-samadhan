import dotenv from "dotenv";
import http from "http";

dotenv.config();

import app from "./app.js";
import postgresPool from "./config/db.js";
import { createDatabaseTables } from "./models/migration.js";
import { initSocket, getIO } from "./services/socketService.js";
import { ticketAutomationWorker } from "./workers/ticketAutomationWorker.js";
import { redisConnection } from "./config/queue.js";

const PORT = Number(process.env.BACKEND_PORT || 4000);

const start = async () => {
  await createDatabaseTables();

  const server = http.createServer(app);
  initSocket(server);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (HTTP + WebSocket)`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[SHUTDOWN] ${signal} received. Cleaning up...`);

    const io = getIO();
    
    // 1. Close Socket.IO server (stops new connections)
    if (io) {
      console.log("[SHUTDOWN] Closing Socket.IO server...");
      io.close();
    }

    // 2. Close HTTP server
    server.close(async () => {
      console.log("[SHUTDOWN] HTTP server closed.");
      try {
        // 3. Stop background workers
        console.log("[SHUTDOWN] Closing BullMQ workers...");
        await ticketAutomationWorker.close();

        // 4. Close Redis connection
        console.log("[SHUTDOWN] Closing Redis connection...");
        await redisConnection.quit();

        // 5. Close Database pool
        console.log("[SHUTDOWN] Closing PostgreSQL pool...");
        await postgresPool.end();
        
        console.log("[SHUTDOWN] Graceful exit complete.");
        process.exit(0);
      } catch (err) {
        console.error("[SHUTDOWN] Error during cleanup:", err);
        process.exit(1);
      }
    });

    // Force exit after 10 seconds if cleanup hangs
    setTimeout(() => {
      console.error("[SHUTDOWN] Forced exit due to timeout.");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
};

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});