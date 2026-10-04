import fs from "fs";
import path from "path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "./env";

// Định nghĩa thư mục lưu trữ file logs
const LOG_DIR = path.resolve(process.cwd(), "logs");

// Tự động tạo thư mục logs nếu chưa tồn tại
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// Cấu hình log levels & colors chuẩn
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "cyan",
};

winston.addColors(colors);

// Định dạng JSON có cấu trúc cho File / Production Observability
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Định dạng màu sắc trực quan cho Console trong môi trường Development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level}]: ${message}${stack ? `\n${stack}` : ""}${metaStr}`;
  })
);

// Transports xoay vòng file log theo ngày (Daily Rotate File)
const transports: winston.transport[] = [
  // Console Transport
  new winston.transports.Console({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    format: env.NODE_ENV === "production" ? fileFormat : consoleFormat,
  }),

  // File lưu trữ Error logs riêng biệt (TTL 14 ngày, max 20MB/file, nén gzip)
  new DailyRotateFile({
    level: "error",
    dirname: LOG_DIR,
    filename: "error-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }),

  // File lưu trữ Combined Application logs (TTL 14 ngày, max 20MB/file, nén gzip)
  new DailyRotateFile({
    level: "info",
    dirname: LOG_DIR,
    filename: "combined-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d",
    format: fileFormat,
  }),

  // File lưu trữ HTTP Request logs riêng biệt (TTL 7 ngày)
  new DailyRotateFile({
    level: "http",
    dirname: LOG_DIR,
    filename: "http-%DATE%.log",
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "7d",
    format: fileFormat,
  }),
];

// Khởi tạo Winston Logger Instance
export const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  levels,
  transports,
  exitOnError: false,
});

// Stream tích hợp trực tiếp với Morgan middleware
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};

export default logger;
