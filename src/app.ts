import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import swaggerSpec from "./config/swagger";
import { apiLimiter } from "./middlewares/rateLimit";
import { mongoSanitize, hppProtection } from "./middlewares/security";
import apiRoutes from "./routes";
import errorHandler from "./middlewares/errorHandler";

import { logger, morganStream } from "./config/logger";

const app: Application = express();

// Security HTTP Headers
app.use(helmet());

// Gzip compression
app.use(compression());

// HTTP Request Logging with Winston
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev", { stream: morganStream }));

// CORS Configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Body Parsers
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// NoSQL Injection Sanitization & HTTP Parameter Pollution (HPP) Protection
app.use(mongoSanitize);
app.use(hppProtection());

// Swagger UI Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root route
app.get("/", (req: Request, res: Response) => {
  res.json({
    name: "SmartCook Backend API",
    version: "1.0.0",
    docs: "/api-docs",
    health: "/api/v1/health",
  });
});

// Apply Rate Limiting to all /api routes
app.use("/api", apiLimiter);

// API Routes
app.use("/api/v1", apiRoutes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use(errorHandler);

export default app;
