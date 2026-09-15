import "dotenv/config";

interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  MONGODB_URI: string;
  CORS_ORIGIN: string;
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX: number;
}

const getEnv = (): EnvConfig => {
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
  const NODE_ENV = process.env.NODE_ENV || "development";
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/smartcook_db";
  const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
  const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS
    ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
    : 15 * 60 * 1000; // 15 mins
  const RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX
    ? parseInt(process.env.RATE_LIMIT_MAX, 10)
    : 100;

  return {
    PORT,
    NODE_ENV,
    MONGODB_URI,
    CORS_ORIGIN,
    RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX,
  };
};

export const env = getEnv();
