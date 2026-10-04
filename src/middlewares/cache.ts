import { Request, Response, NextFunction } from "express";
import { cacheService } from "../config/cache";

/**
 * Express middleware to cache GET endpoint responses in Redis or in-memory
 * @param ttlSeconds Cache time-to-live in seconds
 * @param keyPrefix Optional custom key prefix (defaults to req.baseUrl)
 */
export const cacheMiddleware = (ttlSeconds: number, keyPrefix?: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Only cache safe GET requests
    if (req.method !== "GET") {
      return next();
    }

    const prefix = keyPrefix || req.baseUrl.replace(/^\//, "") || "cache";
    const queryString = Object.keys(req.query || {})
      .sort()
      .map((k) => `${k}=${req.query[k]}`)
      .join("&");
    const cacheKey = `${prefix}:${req.path}:${queryString}`;

    try {
      const cachedData = await cacheService.get<any>(cacheKey);
      if (cachedData !== null) {
        res.setHeader("X-Cache", "HIT");
        res.setHeader("X-Cache-Provider", cacheService.getProvider());
        res.status(200).json(cachedData);
        return;
      }

      res.setHeader("X-Cache", "MISS");
      res.setHeader("X-Cache-Provider", cacheService.getProvider());

      // Intercept res.json to capture and save the response payload
      const originalJson = res.json.bind(res);
      res.json = (body: any) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cacheService.set(cacheKey, body, ttlSeconds).catch(() => {});
        }
        return originalJson(body);
      };

      next();
    } catch {
      next();
    }
  };
};
