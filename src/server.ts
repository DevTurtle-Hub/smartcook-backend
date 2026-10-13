import http from "http";
import app from "./app";
import { env } from "./config/env";
import connectDB, { disconnectDB } from "./config/db";
import { initSocketIO } from "./socket/chat.gateway";
import { seedDefaultChatRooms } from "./data/seedChatRooms";
import { logger } from "./config/logger";

// Connect to MongoDB and seed chat rooms
connectDB().then(() => {
  seedDefaultChatRooms();
});

// Create HTTP Server and bind Socket.io
const httpServer = http.createServer(app);
initSocketIO(httpServer);

// Start HTTP Server
const server = httpServer.listen(env.PORT, "0.0.0.0", () => {
  logger.info(`[Server] SmartCook Backend running at http://0.0.0.0:${env.PORT}`);
  logger.info(`[Server] Socket.io Gateway initialized at ws://0.0.0.0:${env.PORT}`);
  logger.info(`[Server] Environment: ${env.NODE_ENV}`);
  logger.info(`[Server] API Docs: http://localhost:${env.PORT}/api-docs`);
  logger.info(`[Server] Health Check: http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful Shutdown function
const gracefulShutdown = async (signal: string) => {
  logger.warn(`[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info("[Server] HTTP server closed. No longer accepting connections.");
    try {
      await disconnectDB();
      logger.info("[Server] Database connection closed cleanly.");
      process.exit(0);
    } catch (err) {
      logger.error("[Server] Error during database disconnection:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if connections don't drain
  setTimeout(() => {
    logger.error("[Server] Could not close connections in time, forcefully shutting down.");
    process.exit(1);
  }, 10000);
};

// Listen for process termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (err: Error) => {
  logger.error("[Server] Unhandled Rejection! Shutting down...", err);
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (err: Error) => {
  logger.error("[Server] Uncaught Exception! Shutting down...", err);
  process.exit(1);
});
