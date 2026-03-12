import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto";
import { Redis } from "@upstash/redis";
import { isPublicVariant } from "@/lib/appVariant";
import { getClientIp } from "@/lib/rateLimit";
import {
  VIDEO_AD_GATE_SESSION_TTL_MS,
  VIDEO_AD_GATE_TOKEN_TTL_MS,
  type AdGateSession,
  type VideoAdOutcome,
} from "@/lib/videoAdGate";

interface MemoryRecord {
  expiresAt: number;
  value: string;
}

interface StoredAdGateToken {
  createdAt: number;
  expiresAt: number;
  id: string;
  ipHash: string;
  sessionId: string;
  usedAt: number | null;
  userAgentHash: string;
}

type AdGateValidationResult =
  | { ok: true; tokenId: string }
  | { ok: false; reason: "expired" | "identity_mismatch" | "invalid" | "missing" | "used" };

const SESSION_PREFIX = "adgate:session";
const TOKEN_PREFIX = "adgate:token";
const memoryStore = new Map<string, MemoryRecord>();

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

function getSecret(): string {
  return (process.env.WEB_AD_GATE_SECRET ?? "").trim();
}

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function signValue(payload: Record<string, unknown>): string {
  const secret = getSecret();
  if (!secret) {
    throw new Error("missing_ad_gate_secret");
  }

  const body = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function parseSignedValue<T>(value: string): T | null {
  const secret = getSecret();
  if (!secret) {
    return null;
  }

  const [body, signature] = value.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = createHmac("sha256", secret).update(body).digest();
  const received = Buffer.from(signature, "base64url");

  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    return null;
  }

  try {
    const decoded = Buffer.from(body, "base64url").toString("utf8");
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function buildKey(prefix: string, id: string): string {
  return `${prefix}:${id}`;
}

function hashIdentity(value: string): string {
  return createHash("sha256").update(`${getSecret()}:${value}`).digest("hex");
}

function getIdentity(headers: Headers): { ipHash: string; userAgentHash: string } {
  const ip = getClientIp(headers);
  const userAgent = headers.get("user-agent") || "unknown";
  return {
    ipHash: hashIdentity(ip),
    userAgentHash: hashIdentity(userAgent),
  };
}

async function readRecord(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) {
    const entry = memoryStore.get(key);
    if (!entry) {
      return null;
    }
    if (entry.expiresAt <= Date.now()) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  const value = await redis.get<string>(key);
  return value ?? null;
}

async function writeRecord(key: string, value: string, ttlMs: number): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryStore.set(key, { expiresAt: Date.now() + ttlMs, value });
    return;
  }

  await redis.set(key, value, { ex: Math.ceil(ttlMs / 1000) });
}

export function isVideoAdGateEnabledServer(): boolean {
  const featureEnabled = (process.env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED ?? "").trim().toLowerCase() === "true";
  const provider = (process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER ?? "").trim();
  return (
    isPublicVariant() &&
    featureEnabled &&
    provider.length > 0 &&
    getSecret().length > 0
  );
}

export async function createAdGateSession(
  headers: Headers
): Promise<{ expiresAt: number; provider: string; sessionId: string }> {
  const provider = (process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER ?? "").trim();
  const id = randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + VIDEO_AD_GATE_SESSION_TTL_MS;
  const { ipHash, userAgentHash } = getIdentity(headers);

  const session: AdGateSession = {
    createdAt,
    expiresAt,
    id,
    ipHash,
    provider,
    status: "created",
    tokenId: null,
    userAgentHash,
  };

  await writeRecord(buildKey(SESSION_PREFIX, id), JSON.stringify(session), VIDEO_AD_GATE_SESSION_TTL_MS);

  return {
    expiresAt,
    provider,
    sessionId: signValue({ expiresAt, id, kind: "session" }),
  };
}

export async function completeAdGateSession(input: {
  headers: Headers;
  outcome: Exclude<VideoAdOutcome, "blocked">;
  sessionId: string;
}): Promise<{ adGateToken: string; expiresAt: number }> {
  const payload = parseSignedValue<{ expiresAt: number; id: string; kind: string }>(input.sessionId);
  if (!payload || payload.kind !== "session" || payload.expiresAt <= Date.now()) {
    throw new Error("invalid_session");
  }

  const raw = await readRecord(buildKey(SESSION_PREFIX, payload.id));
  if (!raw) {
    throw new Error("invalid_session");
  }

  const session = JSON.parse(raw) as AdGateSession;
  if (session.status === "completed" || session.expiresAt <= Date.now()) {
    throw new Error("invalid_session");
  }

  const identity = getIdentity(input.headers);
  if (session.ipHash !== identity.ipHash || session.userAgentHash !== identity.userAgentHash) {
    throw new Error("invalid_session");
  }

  const tokenId = randomUUID();
  const createdAt = Date.now();
  const expiresAt = createdAt + VIDEO_AD_GATE_TOKEN_TTL_MS;
  const token: StoredAdGateToken = {
    createdAt,
    expiresAt,
    id: tokenId,
    ipHash: identity.ipHash,
    sessionId: session.id,
    usedAt: null,
    userAgentHash: identity.userAgentHash,
  };

  await Promise.all([
    writeRecord(
      buildKey(SESSION_PREFIX, session.id),
      JSON.stringify({
        ...session,
        outcome: input.outcome,
        status: "completed",
        tokenId,
      } satisfies AdGateSession),
      Math.max(1, session.expiresAt - Date.now())
    ),
    writeRecord(buildKey(TOKEN_PREFIX, tokenId), JSON.stringify(token), VIDEO_AD_GATE_TOKEN_TTL_MS),
  ]);

  return {
    adGateToken: signValue({ expiresAt, id: tokenId, kind: "token" }),
    expiresAt,
  };
}

export async function validateAdGateToken(token: string | undefined, headers: Headers): Promise<AdGateValidationResult> {
  if (!token) {
    return { ok: false, reason: "missing" };
  }

  const payload = parseSignedValue<{ expiresAt: number; id: string; kind: string }>(token);
  if (!payload || payload.kind !== "token") {
    return { ok: false, reason: "invalid" };
  }

  if (payload.expiresAt <= Date.now()) {
    return { ok: false, reason: "expired" };
  }

  const raw = await readRecord(buildKey(TOKEN_PREFIX, payload.id));
  if (!raw) {
    return { ok: false, reason: "invalid" };
  }

  const stored = JSON.parse(raw) as StoredAdGateToken;
  if (stored.expiresAt <= Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (stored.usedAt) {
    return { ok: false, reason: "used" };
  }

  const identity = getIdentity(headers);
  if (stored.ipHash !== identity.ipHash || stored.userAgentHash !== identity.userAgentHash) {
    return { ok: false, reason: "identity_mismatch" };
  }

  return { ok: true, tokenId: stored.id };
}

export async function consumeAdGateToken(tokenId: string): Promise<boolean> {
  const key = buildKey(TOKEN_PREFIX, tokenId);
  const raw = await readRecord(key);
  if (!raw) {
    return false;
  }

  const stored = JSON.parse(raw) as StoredAdGateToken;
  if (stored.expiresAt <= Date.now() || stored.usedAt) {
    return false;
  }

  await writeRecord(
    key,
    JSON.stringify({
      ...stored,
      usedAt: Date.now(),
    } satisfies StoredAdGateToken),
    Math.max(1, stored.expiresAt - Date.now())
  );

  return true;
}

export function __resetAdGateForTests(): void {
  memoryStore.clear();
  redisClient = undefined;
}
