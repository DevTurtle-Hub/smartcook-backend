import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { env } from "../config/env";
import { logger } from "../config/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors: any = err.errors || undefined;

  // Mongoose invalid ObjectId (CastError)
  if (err.name === "CastError") {
    message = `Invalid format for field '${err.path}': ${err.value}`;
    statusCode = 400;
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    const value = err.keyValue ? err.keyValue[field] : "";
    message = `Duplicate value '${value}' for field '${field}'. Please use another value.`;
    statusCode = 409;
  }

  // Mongoose schema validation error
  if (err.name === "ValidationError") {
    message = "Database Validation Failed";
    statusCode = 422;
    errors = Object.values(err.errors || {}).map((val: any) => ({
      field: val.path,
      message: val.message,
    }));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    message = "Invalid authentication token. Please log in again.";
    statusCode = 401;
  }

  if (err.name === "TokenExpiredError") {
    message = "Authentication token has expired. Please refresh your session.";
    statusCode = 401;
  }

  // Joi validation error check
  if (err.isJoi) {
    message = "Input validation error";
    statusCode = 400;
    errors = err.details?.map((detail: any) => ({
      field: detail.path.join("."),
      message: detail.message.replace(/['"]/g, ""),
    }));
  }

  // Log error details for server diagnostics
  if (env.NODE_ENV !== "test") {
    logger.error(`${req.method} ${req.originalUrl}: ${err.message}`, {
      name: err.name,
      statusCode,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    timestamp: new Date().toISOString(),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
