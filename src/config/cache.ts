import Redis from "ioredis";
import { env } from "./env";

interface MemoryCacheEntry {
  value: string;
  expiresAt: number | null;
}

export class CacheService {
  private redisClient: Redis | null = null;
  private isRedisAvailable = false;
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();

  constructor() {
    this.initRedis();
  }

  private initRedis() {
    try {
      this.redisClient = new Redis(env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy: () => null, // Do not spam reconnects if Redis server is down
        lazyConnect: true,
      });

      this.redisClient.connect().then(() => {
        this.isRedisAvailable = true;
        console.log(`[CacheService] Kết nối Redis thành công tại ${env.REDIS_URL}`);
      }).catch(() => {
        this.isRedisAvailable = false;
        console.log("[CacheService] Không tìm thấy máy chủ Redis, tự động chuyển sang bộ nhớ đệm In-Memory High-Speed Cache");
      });

      this.redisClient.on("error", () => {
        this.isRedisAvailable = false;
      });
    } catch {
      this.isRedisAvailable = false;
    }
  }

  /**
   * Get provider currently in use
   */
  getProvider(): "redis" | "memory" {
    return this.isRedisAvailable ? "redis" : "memory";
  }

  /**
   * Get cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const raw = await this.redisClient.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        // Fallback to memory if redis operation fails
      }
    }

    // Memory cache fallback
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    try {
      return JSON.parse(entry.value) as T;
    } catch {
      return null;
    }
  }

  /**
   * Set cached value with optional TTL in seconds
   */
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    const serialized = JSON.stringify(value);

    if (this.isRedisAvailable && this.redisClient) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await this.redisClient.setex(key, ttlSeconds, serialized);
        } else {
          await this.redisClient.set(key, serialized);
        }
        return;
      } catch {
        // Fallback to memory
      }
    }

    // Memory cache
    const expiresAt = ttlSeconds && ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value: serialized, expiresAt });

    // Clean up memory cache if size exceeds 2000 entries
    if (this.memoryCache.size > 2000) {
      const now = Date.now();
      for (const [k, v] of this.memoryCache.entries()) {
        if (v.expiresAt && now > v.expiresAt) {
          this.memoryCache.delete(k);
        }
      }
    }
  }

  /**
   * Delete a key or array of keys
   */
  async del(key: string | string[]): Promise<void> {
    const keys = Array.isArray(key) ? key : [key];

    if (this.isRedisAvailable && this.redisClient && keys.length > 0) {
      try {
        await this.redisClient.del(...keys);
      } catch {
        // ignore
      }
    }

    for (const k of keys) {
      this.memoryCache.delete(k);
    }
  }

  /**
   * Delete keys matching a pattern (e.g. "categories:*")
   */
  async delByPattern(pattern: string): Promise<void> {
    // In-memory pattern matching
    const regexPattern = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    for (const k of this.memoryCache.keys()) {
      if (regexPattern.test(k)) {
        this.memoryCache.delete(k);
      }
    }

    // Redis pattern matching
    if (this.isRedisAvailable && this.redisClient) {
      try {
        const matchingKeys = await this.redisClient.keys(pattern);
        if (matchingKeys.length > 0) {
          await this.redisClient.del(...matchingKeys);
        }
      } catch {
        // ignore
      }
    }
  }

  /**
   * Flush entire cache
   */
  async flush(): Promise<void> {
    this.memoryCache.clear();
    if (this.isRedisAvailable && this.redisClient) {
      try {
        await this.redisClient.flushdb();
      } catch {
        // ignore
      }
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
