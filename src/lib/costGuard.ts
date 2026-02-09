import { Redis } from "@upstash/redis";
import { ReaderTier } from "@/lib/types";

interface UsageCounters {
  chars: number;
  cost: number;
}

export interface BudgetCheckResult {
  allowed: boolean;
  currentChars: number;
  currentCostUsd: number;
  estimatedRequestCostUsd: number;
  projectedCostUsd: number;
  monthlyLimitUsd: number;
}

const PRICE_PER_MILLION: Record<ReaderTier, number> = {
  neural2: 16,
  standard: 4,
  wavenet: 16
};

const memoryBudgetByMonth = new Map<string, UsageCounters>();
let redisClient: Redis | null | undefined;

function getMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

function getMonthlyBudget(): number {
  const parsed = Number(process.env.MONTHLY_BUDGET_USD ?? "50");
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 50;
  }
  return parsed;
}

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

export function estimateTtsCostUsd(characters: number, tier: ReaderTier): number {
  const safeCharacters = Math.max(0, characters);
  const perMillion = PRICE_PER_MILLION[tier] ?? PRICE_PER_MILLION.neural2;
  return Number(((safeCharacters / 1_000_000) * perMillion).toFixed(6));
}

async function readCounters(monthKey: string): Promise<UsageCounters> {
  const redis = getRedisClient();
  if (!redis) {
    return memoryBudgetByMonth.get(monthKey) ?? { chars: 0, cost: 0 };
  }

  const [charsRaw, costRaw] = await Promise.all([
    redis.get<number>(`cost:${monthKey}:chars`),
    redis.get<number>(`cost:${monthKey}:usd`)
  ]);

  return {
    chars: Number(charsRaw ?? 0),
    cost: Number(costRaw ?? 0)
  };
}

export async function checkBudget(characters: number, tier: ReaderTier): Promise<BudgetCheckResult> {
  const monthKey = getMonthKey();
  const monthlyLimitUsd = getMonthlyBudget();
  const estimatedRequestCostUsd = estimateTtsCostUsd(characters, tier);
  const current = await readCounters(monthKey);
  const projectedCostUsd = Number((current.cost + estimatedRequestCostUsd).toFixed(6));
  return {
    allowed: projectedCostUsd <= monthlyLimitUsd,
    currentChars: current.chars,
    currentCostUsd: Number(current.cost.toFixed(6)),
    estimatedRequestCostUsd,
    projectedCostUsd,
    monthlyLimitUsd
  };
}

export async function registerUsage(characters: number, tier: ReaderTier): Promise<void> {
  const monthKey = getMonthKey();
  const cost = estimateTtsCostUsd(characters, tier);
  const redis = getRedisClient();
  if (!redis) {
    const current = memoryBudgetByMonth.get(monthKey) ?? { chars: 0, cost: 0 };
    memoryBudgetByMonth.set(monthKey, {
      chars: current.chars + characters,
      cost: Number((current.cost + cost).toFixed(6))
    });
    return;
  }

  const charsKey = `cost:${monthKey}:chars`;
  const costKey = `cost:${monthKey}:usd`;
  await Promise.all([
    redis.incrby(charsKey, characters),
    redis.incrbyfloat(costKey, cost),
    redis.expire(charsKey, 60 * 60 * 24 * 90),
    redis.expire(costKey, 60 * 60 * 24 * 90)
  ]);
}
