import mongoose from "mongoose";

export class HealthService {
  public static getHealthStatus() {
    const dbStateMap: Record<number, string> = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    const dbStatus = dbStateMap[mongoose.connection.readyState] || "unknown";

    return {
      status: "ok",
      version: "2.1.0-deep-culinary-vision",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: {
        status: dbStatus,
        name: mongoose.connection.name || "none",
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memoryUsage: process.memoryUsage(),
      },
    };
  }
}
