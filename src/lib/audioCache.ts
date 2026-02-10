import { createHash } from "crypto";
import { Redis } from "@upstash/redis";

const MAX_CACHEABLE_TEXT_LENGTH = 2000;
const TTL_SECONDS = 60 * 60 * 24; // 24 hours

let redisClient: Redis | null | undefined;

function getRedisClient(): Redis | null {
  if (redisClient !== undefined) return redisClient;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

function buildCacheKey(text: string, locale: string, readerId: string, speed: number): string {
  const payload = `${text}|${locale}|${readerId}|${speed}`;
  const hash = createHash("sha256").update(payload).digest("hex");
  return `audio:${hash}`;
}

export async function getCachedAudio(
  text: string,
  locale: string,
  readerId: string,
  speed: number
): Promise<Buffer | null> {
  if (text.length > MAX_CACHEABLE_TEXT_LENGTH) return null;
  const redis = getRedisClient();
  if (!redis) return null;

  const key = buildCacheKey(text, locale, readerId, speed);
  const cached = await redis.get<string>(key);
  if (!cached) return null;
  return Buffer.from(cached, "base64");
}

export async function setCachedAudio(
  text: string,
  locale: string,
  readerId: string,
  speed: number,
  audio: Buffer
): Promise<void> {
  if (text.length > MAX_CACHEABLE_TEXT_LENGTH) return;
  const redis = getRedisClient();
  if (!redis) return;

  const key = buildCacheKey(text, locale, readerId, speed);
  const encoded = audio.toString("base64");
  await redis.set(key, encoded, { ex: TTL_SECONDS });
}
