import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  retryAfterSec: number;
}

interface InMemoryWindow {
  count: number;
  resetAt: number;
}

const memoryWindows = new Map<string, InMemoryWindow>();

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return redisClient;
  }

  redisClient = new Redis({ url, token });
  return redisClient;
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "unknown";
  }
  return headers.get("x-real-ip") || "unknown";
}

function runInMemoryLimit(bucket: string, windowMs: number, limit: number): RateLimitResult {
  const now = Date.now();
  const existing = memoryWindows.get(bucket);
  if (!existing || existing.resetAt <= now) {
    memoryWindows.set(bucket, {
      count: 1,
      resetAt: now + windowMs
    });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      retryAfterSec: Math.ceil(windowMs / 1000)
    };
  }

  existing.count += 1;
  const allowed = existing.count <= limit;
  return {
    allowed,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSec: Math.ceil((existing.resetAt - now) / 1000)
  };
}

export async function checkRateLimit(
  identity: string,
  options?: { maxRequests?: number; windowMs?: number; prefix?: string }
): Promise<RateLimitResult> {
  const windowMs = options?.windowMs ?? 60_000;
  const limit = options?.maxRequests ?? 20;
  const prefix = options?.prefix ?? "tts";
  const bucketId = Math.floor(Date.now() / windowMs);
  const key = `${prefix}:${identity}:${bucketId}`;
  const redis = getRedisClient();

  if (!redis) {
    return runInMemoryLimit(key, windowMs, limit);
  }

  const count = Number(await redis.incr(key));
  if (count === 1) {
    await redis.expire(key, Math.ceil(windowMs / 1000));
  }
  return {
    allowed: count <= limit,
    limit,
    remaining: Math.max(0, limit - count),
    retryAfterSec: Math.ceil(windowMs / 1000)
  };
}
