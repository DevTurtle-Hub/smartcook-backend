import mongoose from "mongoose";
import { env } from "./env";

export const connectDB = async (): Promise<void> => {
  try {
    // Event listeners
    mongoose.connection.on("connected", () => {
      console.log("[MongoDB] Database connection established.");
    });

    mongoose.connection.on("error", (err) => {
      console.error("[MongoDB] Database connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("[MongoDB] Database connection disconnected.");
    });

    const conn = await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== "production", // Tự động build index ở dev, tắt ở prod để tối ưu hiệu năng
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB] Connected successfully to host: ${conn.connection.host} | DB: ${conn.connection.name}`
    );
  } catch (error) {
    console.error("[MongoDB] Failed to connect on startup:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("[MongoDB] Connection closed successfully.");
  } catch (error) {
    console.error("[MongoDB] Error while closing connection:", error);
    throw error;
  }
};

export default connectDB;
