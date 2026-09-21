import http from "http";
import app from "./app";
import { env } from "./config/env";
import connectDB, { disconnectDB } from "./config/db";
import { initSocketIO } from "./socket/chat.gateway";
import { seedDefaultChatRooms } from "./data/seedChatRooms";

// Connect to MongoDB and seed chat rooms
connectDB().then(() => {
  seedDefaultChatRooms();
});

// Create HTTP Server and bind Socket.io
const httpServer = http.createServer(app);
initSocketIO(httpServer);

// Start HTTP Server
const server = httpServer.listen(env.PORT, () => {
  console.log(`[Server] SmartCook Backend running at http://localhost:${env.PORT}`);
  console.log(`[Server] Socket.io Gateway initialized at ws://localhost:${env.PORT}`);
  console.log(`[Server] Environment: ${env.NODE_ENV}`);
  console.log(`[Server] API Docs: http://localhost:${env.PORT}/api-docs`);
  console.log(`[Server] Health Check: http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful Shutdown function
const gracefulShutdown = async (signal: string) => {
  console.log(`\n[Server] Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    console.log("[Server] HTTP server closed. No longer accepting connections.");
    try {
      await disconnectDB();
      console.log("[Server] Database connection closed cleanly.");
      process.exit(0);
    } catch (err) {
      console.error("[Server] Error during database disconnection:", err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if connections don't drain
  setTimeout(() => {
    console.error("[Server] Could not close connections in time, forcefully shutting down.");
    process.exit(1);
  }, 10000);
};

// Listen for process termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Handle unhandled rejections and exceptions
process.on("unhandledRejection", (err: Error) => {
  console.error("[Server] Unhandled Rejection! Shutting down...", err);
  gracefulShutdown("UNHANDLED_REJECTION");
});

process.on("uncaughtException", (err: Error) => {
  console.error("[Server] Uncaught Exception! Shutting down...", err);
  process.exit(1);
});
