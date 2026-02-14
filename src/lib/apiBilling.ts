import { createHash } from "crypto";
import { Redis } from "@upstash/redis";
import { findApiCredentialInDatabase } from "@/lib/portalStore";
import { BillingDailySummary, BillingSummary, UsageEvent } from "@/lib/types";

type KeyStatus = "active" | "disabled";
type BillingStatus = "active" | "dunning" | "no_payment_method";
type IdempotencyStatus = "processing" | "completed";

interface PricingTier {
  upToChars: number;
  usdPerMillion: number;
}

interface AggregateCounters {
  chars: number;
  billable_chars: number;
  trial_chars_applied: number;
  charge_usd: number;
  requests: number;
}

interface AccountDayUsage extends AggregateCounters {
  day_utc: string;
}

interface IdempotencyRecord {
  request_hash: string;
  request_id?: string;
  status: IdempotencyStatus;
}

interface RawApiKeyConfig {
  account_id?: unknown;
  billing_status?: unknown;
  key?: unknown;
  key_id?: unknown;
  key_sha256?: unknown;
  monthly_hard_limit_chars?: unknown;
  rate_limit_per_minute?: unknown;
  status?: unknown;
}

export interface ApiCredential {
  account_id: string;
  billing_status: BillingStatus;
  key_hash: string;
  key_id: string;
  monthly_hard_limit_chars: number | null;
  rate_limit_per_minute: number;
  status: KeyStatus;
}

export interface TieredChargeResult {
  chargeUsd: number;
  effectiveRateUsdPerMillion: number;
  primaryTierUsdPerMillion: number;
}

export interface IdempotencyBeginResult {
  request_id?: string;
  status: "acquired" | "conflict" | "processing" | "replay";
}

export interface AccountUsageSnapshot extends AggregateCounters {
  month_utc: string;
  trial_used_chars: number;
}

const BILLING_PREFIX = "billing:v1";
const EVENT_RETENTION_SECONDS = 60 * 60 * 24 * 400; // ~13 months
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const DEFAULT_RATE_LIMIT_PER_MINUTE = 120;
const DEFAULT_TRIAL_CHARS = 500_000;
const DEFAULT_INVOICE_MINIMUM_USD = 5;
const DEFAULT_MONTHLY_HARD_LIMIT_CHARS = 100_000_000;

const PRICING_TIERS: PricingTier[] = [
  { upToChars: 20_000_000, usdPerMillion: 15 },
  { upToChars: 100_000_000, usdPerMillion: 12 },
  { upToChars: Number.POSITIVE_INFINITY, usdPerMillion: 10 },
];

const memoryUsageEvents = new Map<string, UsageEvent>();
const memoryMonthCounters = new Map<string, AggregateCounters>();
const memoryDayCounters = new Map<string, AccountDayUsage>();
const memoryMonthDays = new Map<string, Set<string>>();
const memoryTrialUsed = new Map<string, number>();
const memoryIdempotency = new Map<string, IdempotencyRecord>();

let redisClient: Redis | null | undefined;
let cachedCredentials: ApiCredential[] | undefined;

function hashSha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function toNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function roundUsd(value: number): number {
  return Number(value.toFixed(6));
}

function getTrialChars(): number {
  const fromEnv = toNumber(process.env.API_BILLING_TRIAL_CHARS, DEFAULT_TRIAL_CHARS);
  if (fromEnv <= 0) return DEFAULT_TRIAL_CHARS;
  return Math.floor(fromEnv);
}

export function getInvoiceMinimumUsd(): number {
  const fromEnv = toNumber(process.env.API_BILLING_INVOICE_MIN_USD, DEFAULT_INVOICE_MINIMUM_USD);
  if (fromEnv <= 0) return DEFAULT_INVOICE_MINIMUM_USD;
  return roundUsd(fromEnv);
}

function getDefaultMonthlyHardLimitChars(): number {
  const parsed = toNumber(
    process.env.API_BILLING_DEFAULT_MONTHLY_HARD_LIMIT_CHARS,
    DEFAULT_MONTHLY_HARD_LIMIT_CHARS
  );
  if (parsed <= 0) return DEFAULT_MONTHLY_HARD_LIMIT_CHARS;
  return Math.floor(parsed);
}

function getBillingRedisClient(): Redis | null {
  if (redisClient !== undefined) {
    return redisClient;
  }
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    redisClient = null;
    return null;
  }
  redisClient = new Redis({ token, url });
  return redisClient;
}

function normalizeKeyStatus(value: unknown): KeyStatus {
  if (typeof value === "string" && value.toLowerCase() === "disabled") {
    return "disabled";
  }
  return "active";
}

function normalizeBillingStatus(value: unknown): BillingStatus {
  if (typeof value !== "string") return "active";
  const lower = value.toLowerCase();
  if (lower === "dunning") return "dunning";
  if (lower === "no_payment_method") return "no_payment_method";
  return "active";
}

function parseApiBillingKeysFromEnv(): ApiCredential[] {
  const raw = process.env.API_BILLING_KEYS_JSON;
  const defaultLimit = getDefaultMonthlyHardLimitChars();

  if (!raw) {
    if (process.env.NODE_ENV === "production") {
      return [];
    }
    const devKey = process.env.API_BILLING_DEV_KEY?.trim() || "dev_api_key";
    return [
      {
        account_id: "acct_dev",
        billing_status: "active",
        key_hash: hashSha256(devKey),
        key_id: "key_dev",
        monthly_hard_limit_chars: defaultLimit,
        rate_limit_per_minute: DEFAULT_RATE_LIMIT_PER_MINUTE,
        status: "active",
      },
    ];
  }

  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(decoded)) {
    return [];
  }

  const normalized: ApiCredential[] = [];
  for (let index = 0; index < decoded.length; index += 1) {
    const item = decoded[index] as RawApiKeyConfig;
    const accountId = typeof item.account_id === "string" ? item.account_id.trim() : "";
    const keyId = typeof item.key_id === "string" ? item.key_id.trim() : "";
    const keyPlain = typeof item.key === "string" ? item.key.trim() : "";
    const keySha = typeof item.key_sha256 === "string" ? item.key_sha256.trim().toLowerCase() : "";
    if (!accountId || !keyId) {
      continue;
    }
    const keyHash = keySha || (keyPlain ? hashSha256(keyPlain) : "");
    if (!keyHash) {
      continue;
    }
    const monthlyRaw = toNumber(item.monthly_hard_limit_chars, defaultLimit);
    const monthlyLimit = monthlyRaw > 0 ? Math.floor(monthlyRaw) : null;
    const rateRaw = toNumber(item.rate_limit_per_minute, DEFAULT_RATE_LIMIT_PER_MINUTE);
    const rateLimit = rateRaw > 0 ? Math.floor(rateRaw) : DEFAULT_RATE_LIMIT_PER_MINUTE;

    normalized.push({
      account_id: accountId,
      billing_status: normalizeBillingStatus(item.billing_status),
      key_hash: keyHash,
      key_id: keyId,
      monthly_hard_limit_chars: monthlyLimit,
      rate_limit_per_minute: rateLimit,
      status: normalizeKeyStatus(item.status),
    });
  }

  return normalized;
}

function getApiCredentials(): ApiCredential[] {
  if (cachedCredentials) {
    return cachedCredentials;
  }
  cachedCredentials = parseApiBillingKeysFromEnv();
  return cachedCredentials;
}

function isLegacyFallbackEnabled(): boolean {
  const raw = (process.env.API_BILLING_LEGACY_FALLBACK_ENABLED ?? "").trim().toLowerCase();
  if (!raw) return true;
  return raw === "true";
}

function monthCounterKey(accountId: string, monthUtc: string): string {
  return `${BILLING_PREFIX}:month:${monthUtc}:${accountId}`;
}

function dayCounterKey(accountId: string, dayUtc: string): string {
  return `${BILLING_PREFIX}:day:${dayUtc}:${accountId}`;
}

function monthDaysSetKey(accountId: string, monthUtc: string): string {
  return `${BILLING_PREFIX}:month-days:${monthUtc}:${accountId}`;
}

function eventKey(requestId: string): string {
  return `${BILLING_PREFIX}:event:${requestId}`;
}

function idempotencyKey(accountId: string, idempotency: string): string {
  return `${BILLING_PREFIX}:idem:${accountId}:${idempotency}`;
}

function trialKey(accountId: string): string {
  return `${BILLING_PREFIX}:trial:${accountId}`;
}

function memoryMonthKey(accountId: string, monthUtc: string): string {
  return `${monthUtc}:${accountId}`;
}

function memoryDayKey(accountId: string, dayUtc: string): string {
  return `${dayUtc}:${accountId}`;
}

function memoryDaysKey(accountId: string, monthUtc: string): string {
  return `${monthUtc}:${accountId}`;
}

function parseJsonObject<T>(value: unknown): T | null {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }
  if (typeof value === "object") {
    return value as T;
  }
  return null;
}

function parseAggregateFromHash(raw: Record<string, unknown> | null | undefined): AggregateCounters {
  if (!raw) {
    return {
      billable_chars: 0,
      charge_usd: 0,
      chars: 0,
      requests: 0,
      trial_chars_applied: 0,
    };
  }

  return {
    billable_chars: Math.max(0, Math.floor(toNumber(raw.billable_chars, 0))),
    charge_usd: roundUsd(Math.max(0, toNumber(raw.charge_usd, 0))),
    chars: Math.max(0, Math.floor(toNumber(raw.chars, 0))),
    requests: Math.max(0, Math.floor(toNumber(raw.requests, 0))),
    trial_chars_applied: Math.max(0, Math.floor(toNumber(raw.trial_chars_applied, 0))),
  };
}

function cloneCounters(counters?: AggregateCounters): AggregateCounters {
  return {
    billable_chars: counters?.billable_chars ?? 0,
    charge_usd: counters?.charge_usd ?? 0,
    chars: counters?.chars ?? 0,
    requests: counters?.requests ?? 0,
    trial_chars_applied: counters?.trial_chars_applied ?? 0,
  };
}

function getTierRateForMonthlyVolume(monthlyBillableChars: number): number {
  for (const tier of PRICING_TIERS) {
    if (monthlyBillableChars < tier.upToChars) {
      return tier.usdPerMillion;
    }
  }
  return PRICING_TIERS[PRICING_TIERS.length - 1]?.usdPerMillion ?? 10;
}

export function parseBearerApiKey(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const match = headerValue.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const apiKey = match[1]?.trim();
  if (!apiKey) return null;
  return apiKey;
}

export function resolveLegacyApiCredential(apiKey: string | null): ApiCredential | null {
  if (!apiKey) return null;
  const keyHash = hashSha256(apiKey);
  const credentials = getApiCredentials();
  return credentials.find((item) => item.key_hash === keyHash) ?? null;
}

export async function resolveApiCredential(apiKey: string | null): Promise<ApiCredential | null> {
  if (!apiKey) return null;

  const dbCredential = await findApiCredentialInDatabase(apiKey);
  if (dbCredential) {
    return dbCredential;
  }

  if (!isLegacyFallbackEnabled()) {
    return null;
  }

  return resolveLegacyApiCredential(apiKey);
}

export function isCredentialUsable(credential: ApiCredential): boolean {
  return credential.status === "active";
}

export function requiresBillingPayment(credential: ApiCredential): boolean {
  return credential.billing_status !== "active";
}

export function getCurrentMonthKeyUtc(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

export function getCurrentDayKeyUtc(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function isValidMonthKey(monthUtc: string): boolean {
  return /^\d{4}-\d{2}$/.test(monthUtc);
}

export function normalizeRequestHashPayload(payload: {
  locale: string;
  readerId: string;
  speed: number;
  text: string;
}): string {
  return hashSha256(
    JSON.stringify({
      locale: payload.locale,
      readerId: payload.readerId,
      speed: payload.speed,
      text: payload.text,
    })
  );
}

export function countBillableCharsLegacy(text: string): number {
  if (!text) return 0;
  const withoutMarkTags = text
    .replace(/<mark\b[^>]*\/?>/gi, "")
    .replace(/<\/mark>/gi, "");
  return withoutMarkTags.length;
}

export function calculateTieredChargeUsd(
  billableChars: number,
  monthlyBillableCharsBefore: number
): TieredChargeResult {
  const safeChars = Math.max(0, Math.floor(billableChars));
  const startVolume = Math.max(0, Math.floor(monthlyBillableCharsBefore));
  const primaryTierUsdPerMillion = getTierRateForMonthlyVolume(startVolume);

  if (safeChars === 0) {
    return {
      chargeUsd: 0,
      effectiveRateUsdPerMillion: primaryTierUsdPerMillion,
      primaryTierUsdPerMillion,
    };
  }

  let remaining = safeChars;
  let cursor = startVolume;
  let charge = 0;
  let previousCap = 0;

  for (const tier of PRICING_TIERS) {
    const tierCap = tier.upToChars;
    if (cursor >= tierCap) {
      previousCap = tierCap;
      continue;
    }

    const segmentStart = Math.max(cursor, previousCap);
    const segmentCapacity = Math.max(0, tierCap - segmentStart);
    const consume = Math.min(remaining, segmentCapacity);
    if (consume > 0) {
      charge += (consume / 1_000_000) * tier.usdPerMillion;
      remaining -= consume;
      cursor += consume;
    }
    previousCap = tierCap;
    if (remaining <= 0) break;
  }

  const chargeUsd = roundUsd(charge);
  const effectiveRateUsdPerMillion = roundUsd((chargeUsd / safeChars) * 1_000_000);
  return {
    chargeUsd,
    effectiveRateUsdPerMillion,
    primaryTierUsdPerMillion,
  };
}

export function calculateInvoiceTotalUsd(
  chargeUsd: number,
  requestCount: number,
  minimumUsd = getInvoiceMinimumUsd()
): number {
  const safeCharge = Math.max(0, roundUsd(chargeUsd));
  if (requestCount <= 0 || safeCharge <= 0) {
    return 0;
  }
  return roundUsd(Math.max(minimumUsd, safeCharge));
}

export function getCollectionAttemptScheduleUtc(monthUtc: string): string[] {
  if (!isValidMonthKey(monthUtc)) return [];
  const [yearStr, monthStr] = monthUtc.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return [];
  }
  const firstOfNextMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const days = [0, 2, 5];
  return days.map((offset) => new Date(firstOfNextMonth.getTime() + offset * 86_400_000).toISOString());
}

function applyCounters(base: AggregateCounters, event: UsageEvent): AggregateCounters {
  return {
    billable_chars: base.billable_chars + event.billable_chars,
    charge_usd: roundUsd(base.charge_usd + event.charge_usd),
    chars: base.chars + event.chars,
    requests: base.requests + 1,
    trial_chars_applied: base.trial_chars_applied + event.trial_chars_applied,
  };
}

export async function beginIdempotentRequest(
  accountId: string,
  idempotency: string,
  requestHash: string
): Promise<IdempotencyBeginResult> {
  const idem = idempotency.trim();
  if (!idem) {
    return { status: "acquired" };
  }

  const redis = getBillingRedisClient();
  const key = idempotencyKey(accountId, idem);
  const processingRecord: IdempotencyRecord = { request_hash: requestHash, status: "processing" };

  if (!redis) {
    const existing = memoryIdempotency.get(key);
    if (!existing) {
      memoryIdempotency.set(key, processingRecord);
      return { status: "acquired" };
    }
    if (existing.request_hash !== requestHash) {
      return { status: "conflict" };
    }
    if (existing.status === "completed" && existing.request_id) {
      return { request_id: existing.request_id, status: "replay" };
    }
    return { status: "processing" };
  }

  const acquired = await redis.set(key, JSON.stringify(processingRecord), {
    ex: IDEMPOTENCY_TTL_SECONDS,
    nx: true,
  });
  if (acquired) {
    return { status: "acquired" };
  }

  const raw = await redis.get<unknown>(key);
  const existing = parseJsonObject<IdempotencyRecord>(raw);
  if (!existing) {
    return { status: "processing" };
  }
  if (existing.request_hash !== requestHash) {
    return { status: "conflict" };
  }
  if (existing.status === "completed" && existing.request_id) {
    return { request_id: existing.request_id, status: "replay" };
  }
  return { status: "processing" };
}

export async function completeIdempotentRequest(
  accountId: string,
  idempotency: string,
  requestHash: string,
  requestId: string
): Promise<void> {
  const idem = idempotency.trim();
  if (!idem) return;

  const key = idempotencyKey(accountId, idem);
  const completedRecord: IdempotencyRecord = {
    request_hash: requestHash,
    request_id: requestId,
    status: "completed",
  };
  const redis = getBillingRedisClient();
  if (!redis) {
    memoryIdempotency.set(key, completedRecord);
    return;
  }
  await redis.set(key, JSON.stringify(completedRecord), { ex: IDEMPOTENCY_TTL_SECONDS });
}

export async function abortIdempotentRequest(accountId: string, idempotency: string): Promise<void> {
  const idem = idempotency.trim();
  if (!idem) return;

  const key = idempotencyKey(accountId, idem);
  const redis = getBillingRedisClient();
  if (!redis) {
    memoryIdempotency.delete(key);
    return;
  }
  await redis.del(key);
}

export async function getUsageEvent(requestId: string): Promise<UsageEvent | null> {
  const redis = getBillingRedisClient();
  if (!redis) {
    return memoryUsageEvents.get(requestId) ?? null;
  }
  const raw = await redis.get<unknown>(eventKey(requestId));
  return parseJsonObject<UsageEvent>(raw);
}

export async function getTrialUsedChars(accountId: string): Promise<number> {
  const redis = getBillingRedisClient();
  if (!redis) {
    return Math.max(0, Math.floor(memoryTrialUsed.get(accountId) ?? 0));
  }
  const raw = await redis.get<number>(trialKey(accountId));
  return Math.max(0, Math.floor(toNumber(raw, 0)));
}

export async function getAccountMonthUsage(
  accountId: string,
  monthUtc = getCurrentMonthKeyUtc()
): Promise<AccountUsageSnapshot> {
  const redis = getBillingRedisClient();
  const aggregateKey = monthCounterKey(accountId, monthUtc);
  let counters: AggregateCounters;

  if (!redis) {
    counters = cloneCounters(memoryMonthCounters.get(memoryMonthKey(accountId, monthUtc)));
  } else {
    const hash = await redis.hgetall<Record<string, unknown>>(aggregateKey);
    counters = parseAggregateFromHash(hash);
  }

  const trial_used_chars = await getTrialUsedChars(accountId);
  return {
    ...counters,
    month_utc: monthUtc,
    trial_used_chars,
  };
}

export async function recordUsageEvent(event: UsageEvent): Promise<void> {
  const monthUtc = event.timestamp_utc.slice(0, 7);
  const dayUtc = event.timestamp_utc.slice(0, 10);
  const redis = getBillingRedisClient();

  if (!redis) {
    memoryUsageEvents.set(event.request_id, event);

    const monthKey = memoryMonthKey(event.account_id, monthUtc);
    const dayKey = memoryDayKey(event.account_id, dayUtc);
    const daysKey = memoryDaysKey(event.account_id, monthUtc);

    const currentMonth = cloneCounters(memoryMonthCounters.get(monthKey));
    memoryMonthCounters.set(monthKey, applyCounters(currentMonth, event));

    const currentDay = memoryDayCounters.get(dayKey) ?? { ...cloneCounters(), day_utc: dayUtc };
    memoryDayCounters.set(dayKey, {
      ...applyCounters(currentDay, event),
      day_utc: dayUtc,
    });

    const monthDays = memoryMonthDays.get(daysKey) ?? new Set<string>();
    monthDays.add(dayUtc);
    memoryMonthDays.set(daysKey, monthDays);

    if (event.trial_chars_applied > 0) {
      const used = Math.max(0, Math.floor(memoryTrialUsed.get(event.account_id) ?? 0));
      memoryTrialUsed.set(event.account_id, used + event.trial_chars_applied);
    }
    return;
  }

  const eventStorageKey = eventKey(event.request_id);
  const monthStorageKey = monthCounterKey(event.account_id, monthUtc);
  const dayStorageKey = dayCounterKey(event.account_id, dayUtc);
  const monthDaysKey = monthDaysSetKey(event.account_id, monthUtc);

  await redis.set(eventStorageKey, JSON.stringify(event), { ex: EVENT_RETENTION_SECONDS });
  await Promise.all([
    redis.hincrby(monthStorageKey, "chars", event.chars),
    redis.hincrby(monthStorageKey, "billable_chars", event.billable_chars),
    redis.hincrby(monthStorageKey, "trial_chars_applied", event.trial_chars_applied),
    redis.hincrbyfloat(monthStorageKey, "charge_usd", event.charge_usd),
    redis.hincrby(monthStorageKey, "requests", 1),
    redis.expire(monthStorageKey, EVENT_RETENTION_SECONDS),
    redis.hincrby(dayStorageKey, "chars", event.chars),
    redis.hincrby(dayStorageKey, "billable_chars", event.billable_chars),
    redis.hincrby(dayStorageKey, "trial_chars_applied", event.trial_chars_applied),
    redis.hincrbyfloat(dayStorageKey, "charge_usd", event.charge_usd),
    redis.hincrby(dayStorageKey, "requests", 1),
    redis.expire(dayStorageKey, EVENT_RETENTION_SECONDS),
    redis.sadd(monthDaysKey, dayUtc),
    redis.expire(monthDaysKey, EVENT_RETENTION_SECONDS),
  ]);

  if (event.trial_chars_applied > 0) {
    const key = trialKey(event.account_id);
    await Promise.all([
      redis.incrby(key, event.trial_chars_applied),
      redis.expire(key, EVENT_RETENTION_SECONDS),
    ]);
  }
}

function getTrialRemainingChars(trialUsedChars: number): number {
  const trialLimit = getTrialChars();
  return Math.max(0, trialLimit - Math.max(0, trialUsedChars));
}

export function applyTrialToRequest(
  chars: number,
  trialUsedChars: number
): { billable_after_trial: number; trial_applied: number; trial_remaining_before: number } {
  const safeChars = Math.max(0, Math.floor(chars));
  const trialRemaining = getTrialRemainingChars(trialUsedChars);
  const trialApplied = Math.min(safeChars, trialRemaining);
  return {
    billable_after_trial: safeChars - trialApplied,
    trial_applied: trialApplied,
    trial_remaining_before: trialRemaining,
  };
}

async function getAccountDayUsage(accountId: string, dayUtc: string): Promise<AccountDayUsage> {
  const redis = getBillingRedisClient();
  if (!redis) {
    return (
      memoryDayCounters.get(memoryDayKey(accountId, dayUtc)) ?? {
        billable_chars: 0,
        charge_usd: 0,
        chars: 0,
        day_utc: dayUtc,
        requests: 0,
        trial_chars_applied: 0,
      }
    );
  }

  const hash = await redis.hgetall<Record<string, unknown>>(dayCounterKey(accountId, dayUtc));
  return { ...parseAggregateFromHash(hash), day_utc: dayUtc };
}

async function getMonthDays(accountId: string, monthUtc: string): Promise<string[]> {
  const redis = getBillingRedisClient();
  if (!redis) {
    const days = memoryMonthDays.get(memoryDaysKey(accountId, monthUtc));
    return [...(days ?? new Set<string>())].sort();
  }
  const rawDays = await redis.smembers<string[]>(monthDaysSetKey(accountId, monthUtc));
  const normalized = Array.isArray(rawDays) ? rawDays.filter((item) => typeof item === "string") : [];
  return normalized.sort();
}

export async function getBillingSummary(
  accountId: string,
  monthUtc = getCurrentMonthKeyUtc()
): Promise<BillingSummary> {
  const usage = await getAccountMonthUsage(accountId, monthUtc);
  const days = await getMonthDays(accountId, monthUtc);

  const daily: BillingDailySummary[] = [];
  for (const day of days) {
    const dayCounters = await getAccountDayUsage(accountId, day);
    daily.push({
      billable_chars: dayCounters.billable_chars,
      charge_usd: roundUsd(dayCounters.charge_usd),
      chars: dayCounters.chars,
      day_utc: day,
      requests: dayCounters.requests,
      trial_chars_applied: dayCounters.trial_chars_applied,
    });
  }

  const invoice_minimum_usd = getInvoiceMinimumUsd();
  const invoice_total_usd = calculateInvoiceTotalUsd(
    usage.charge_usd,
    usage.requests,
    invoice_minimum_usd
  );

  return {
    account_id: accountId,
    billable_chars: usage.billable_chars,
    charge_usd: usage.charge_usd,
    collection_attempts_utc: getCollectionAttemptScheduleUtc(monthUtc),
    currency: "USD",
    daily,
    invoice_minimum_usd,
    invoice_total_usd,
    month_utc: monthUtc,
    requests: usage.requests,
    trial_chars_applied: usage.trial_chars_applied,
    chars: usage.chars,
  };
}

export function getQuotaError(
  currentChars: number,
  incomingChars: number,
  monthlyHardLimitChars: number | null
): boolean {
  if (!monthlyHardLimitChars || monthlyHardLimitChars <= 0) {
    return false;
  }
  return currentChars + incomingChars > monthlyHardLimitChars;
}

export function buildUsageEvent(input: {
  account_id: string;
  billable_chars: number;
  charge_usd: number;
  chars: number;
  idempotency_key: string | null;
  key_id: string;
  locale: string;
  price_tier_usd_per_million: number;
  request_id: string;
  timestamp_utc: string;
  trial_chars_applied: number;
  voice_tier: UsageEvent["voice_tier"];
}): UsageEvent {
  return {
    account_id: input.account_id,
    billable_chars: Math.max(0, Math.floor(input.billable_chars)),
    charge_usd: roundUsd(Math.max(0, input.charge_usd)),
    chars: Math.max(0, Math.floor(input.chars)),
    idempotency_key: input.idempotency_key,
    key_id: input.key_id,
    locale: input.locale,
    price_tier_usd_per_million: roundUsd(Math.max(0, input.price_tier_usd_per_million)),
    request_id: input.request_id,
    timestamp_utc: input.timestamp_utc,
    trial_chars_applied: Math.max(0, Math.floor(input.trial_chars_applied)),
    voice_tier: input.voice_tier,
  };
}

export function __resetApiBillingForTests(): void {
  redisClient = null;
  cachedCredentials = undefined;
  memoryUsageEvents.clear();
  memoryMonthCounters.clear();
  memoryDayCounters.clear();
  memoryMonthDays.clear();
  memoryTrialUsed.clear();
  memoryIdempotency.clear();
}
