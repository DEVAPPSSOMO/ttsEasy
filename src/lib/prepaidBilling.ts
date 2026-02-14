import { randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import {
  AutoRechargeConfig,
  AutoRechargeStatus,
  WalletBalance,
  WalletTransaction,
  WalletTransactionType,
  WalletTransactionsPage,
} from "@/lib/types";

interface WalletState {
  balance_micros: number;
  last_topup_at: string | null;
}

interface MonthSummaryState {
  adjustment_micros: number;
  auto_topup_credit_micros: number;
  chars: number;
  requests: number;
  refund_debit_micros: number;
  topup_credit_micros: number;
  usage_charge_micros: number;
}

interface CheckoutSessionMeta {
  account_id: string;
  amount_micros: number;
  created_at: string;
  save_payment_method: boolean;
  source: "manual" | "auto";
}

interface PrepaidIdempotencyCompleted {
  billable_chars: number;
  charge_micros: number;
  price_tier_eur_per_million: number;
  request_id: string;
  wallet_balance_micros_after: number;
}

interface PrepaidIdempotencyRecord {
  request_hash: string;
  response?: PrepaidIdempotencyCompleted;
  status: "processing" | "completed";
}

interface AutoRechargeConfigState {
  amount_micros: number;
  enabled: boolean;
  last_error: string | null;
  payment_method_id: string | null;
  status: AutoRechargeStatus;
  trigger_micros: number;
  updated_at: string | null;
}

interface WalletBalanceDeltaResult {
  balance_micros: number;
  ok: boolean;
}

interface WalletBalanceDeltaInput {
  account_id: string;
  allow_negative?: boolean;
  amount_micros: number;
  created_at: string;
  meta?: Record<string, unknown>;
  request_id?: string | null;
  source: string;
  stripe_ref?: string | null;
  type: WalletTransactionType;
}

interface PrepaidChargeResult {
  charge_micros: number;
  price_tier_eur_per_million: number;
}

interface PrepaidMonthSummary {
  adjustment_micros: number;
  auto_topup_credit_micros: number;
  chars: number;
  month_utc: string;
  requests: number;
  refund_debit_micros: number;
  topup_credit_micros: number;
  usage_charge_micros: number;
}

const BILLING_PREFIX = "billing:v2";
const EVENT_TTL_SECONDS = 60 * 60 * 24 * 400;
const IDEMPOTENCY_TTL_SECONDS = 60 * 60 * 24 * 7;
const STRIPE_EVENT_TTL_SECONDS = 60 * 60 * 24 * 400;
const STRIPE_EVENT_LOCK_TTL_SECONDS = 60 * 5;
const EUR_MICROS = 1_000_000;
const CENTS_TO_MICROS = 10_000;
const MIN_TOPUP_EUR = 5;
const DEFAULT_AUTO_TRIGGER_EUR = 2;
const DEFAULT_AUTO_AMOUNT_EUR = 10;
const DEFAULT_LIST_LIMIT = 20;
const MAX_LIST_LIMIT = 100;

const PREPAID_PRICING_TIERS = [
  { rate_micros_per_char: 15, up_to_chars: 20_000_000 },
  { rate_micros_per_char: 12, up_to_chars: 100_000_000 },
  { rate_micros_per_char: 10, up_to_chars: Number.POSITIVE_INFINITY },
];

const TOPUP_PACKS_EUR = {
  pack_10: 10,
  pack_25: 25,
  pack_5: 5,
  pack_50: 50,
} as const;

type TopupPackId = keyof typeof TOPUP_PACKS_EUR;

interface PrepaidMemoryStore {
  accountByStripeCustomer: Map<string, string>;
  autoRecharge: Map<string, AutoRechargeConfigState>;
  checkoutSessionMeta: Map<string, CheckoutSessionMeta>;
  idempotency: Map<string, PrepaidIdempotencyRecord>;
  monthSummary: Map<string, MonthSummaryState>;
  stripeCustomerByAccount: Map<string, string>;
  stripeEventState: Map<string, "processing" | "processed">;
  stripeRefundCursorMicros: Map<string, number>;
  transactions: Map<string, WalletTransaction>;
  txIndex: Map<string, string[]>;
  wallets: Map<string, WalletState>;
}

declare global {
  // eslint-disable-next-line no-var
  var __ttsEasyPrepaidMemoryStore: PrepaidMemoryStore | undefined;
}

function getMemoryStore(): PrepaidMemoryStore {
  if (!globalThis.__ttsEasyPrepaidMemoryStore) {
    globalThis.__ttsEasyPrepaidMemoryStore = {
      accountByStripeCustomer: new Map<string, string>(),
      autoRecharge: new Map<string, AutoRechargeConfigState>(),
      checkoutSessionMeta: new Map<string, CheckoutSessionMeta>(),
      idempotency: new Map<string, PrepaidIdempotencyRecord>(),
      monthSummary: new Map<string, MonthSummaryState>(),
      stripeCustomerByAccount: new Map<string, string>(),
      stripeEventState: new Map<string, "processing" | "processed">(),
      stripeRefundCursorMicros: new Map<string, number>(),
      transactions: new Map<string, WalletTransaction>(),
      txIndex: new Map<string, string[]>(),
      wallets: new Map<string, WalletState>(),
    };
  }
  return globalThis.__ttsEasyPrepaidMemoryStore;
}

const memoryStore = getMemoryStore();
const memoryWallets = memoryStore.wallets;
const memoryTransactions = memoryStore.transactions;
const memoryTxIndex = memoryStore.txIndex;
const memoryStripeEventState = memoryStore.stripeEventState;
const memoryStripeRefundCursorMicros = memoryStore.stripeRefundCursorMicros;
const memoryStripeCustomerByAccount = memoryStore.stripeCustomerByAccount;
const memoryAccountByStripeCustomer = memoryStore.accountByStripeCustomer;
const memoryCheckoutSessionMeta = memoryStore.checkoutSessionMeta;
const memoryMonthSummary = memoryStore.monthSummary;
const memoryAutoRecharge = memoryStore.autoRecharge;
const memoryIdempotency = memoryStore.idempotency;

let redisClient: Redis | null | undefined;

function getMonthKey(date = new Date()): string {
  return date.toISOString().slice(0, 7);
}

function toFiniteNumber(value: unknown, fallback = 0): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function sanitizeErrorMessage(value: string): string {
  return value.slice(0, 200);
}

function randomTxId(): string {
  return `tx_${randomUUID()}`;
}

function toMicrosFromEuros(value: number): number {
  return Math.round(value * EUR_MICROS);
}

function fromMicrosToEuros(value: number): number {
  return Number((value / EUR_MICROS).toFixed(6));
}

function toMicrosFromCents(value: number): number {
  return Math.round(value * CENTS_TO_MICROS);
}

function toCentsFromEuros(value: number): number {
  return Math.round(value * 100);
}

function walletKey(accountId: string): string {
  return `${BILLING_PREFIX}:wallet:${accountId}`;
}

function txKey(txId: string): string {
  return `${BILLING_PREFIX}:tx:${txId}`;
}

function txIndexKey(accountId: string): string {
  return `${BILLING_PREFIX}:tx-index:${accountId}`;
}

function monthSummaryKey(accountId: string, monthUtc: string): string {
  return `${BILLING_PREFIX}:summary:${monthUtc}:${accountId}`;
}

function stripeEventKey(eventId: string): string {
  return `${BILLING_PREFIX}:stripe-event:${eventId}`;
}

function stripeRefundCursorKey(chargeId: string): string {
  return `${BILLING_PREFIX}:stripe-refund-cursor:${chargeId}`;
}

function stripeCustomerByAccountKey(accountId: string): string {
  return `${BILLING_PREFIX}:stripe-customer:${accountId}`;
}

function accountByStripeCustomerKey(customerId: string): string {
  return `${BILLING_PREFIX}:stripe-customer-map:${customerId}`;
}

function checkoutSessionKey(sessionId: string): string {
  return `${BILLING_PREFIX}:stripe-session:${sessionId}`;
}

function autoRechargeKey(accountId: string): string {
  return `${BILLING_PREFIX}:auto-recharge:${accountId}`;
}

function idempotencyKey(accountId: string, idempotency: string): string {
  return `${BILLING_PREFIX}:idem:${accountId}:${idempotency}`;
}

function getRedisClient(): Redis | null {
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

function parseJson<T>(value: unknown): T | null {
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

function getDefaultAutoTriggerMicros(): number {
  const raw = toFiniteNumber(
    process.env.API_BILLING_AUTO_RECHARGE_TRIGGER_EUR,
    DEFAULT_AUTO_TRIGGER_EUR
  );
  const safe = raw > 0 ? raw : DEFAULT_AUTO_TRIGGER_EUR;
  return toMicrosFromEuros(safe);
}

function getDefaultAutoAmountMicros(): number {
  const raw = toFiniteNumber(
    process.env.API_BILLING_AUTO_RECHARGE_AMOUNT_EUR,
    DEFAULT_AUTO_AMOUNT_EUR
  );
  const safe = raw >= MIN_TOPUP_EUR ? raw : DEFAULT_AUTO_AMOUNT_EUR;
  return toMicrosFromEuros(safe);
}

function getDefaultAutoRechargeState(): AutoRechargeConfigState {
  return {
    amount_micros: getDefaultAutoAmountMicros(),
    enabled: false,
    last_error: null,
    payment_method_id: null,
    status: "disabled",
    trigger_micros: getDefaultAutoTriggerMicros(),
    updated_at: null,
  };
}

function mapAutoStateToPublic(state: AutoRechargeConfigState): AutoRechargeConfig {
  return {
    amount_eur: fromMicrosToEuros(state.amount_micros),
    enabled: state.enabled,
    last_error: state.last_error,
    payment_method_id: state.payment_method_id,
    status: state.status,
    trigger_eur: fromMicrosToEuros(state.trigger_micros),
    updated_at: state.updated_at,
  };
}

function mapWallet(accountId: string, state: WalletState, autoState: AutoRechargeConfigState): WalletBalance {
  return {
    account_id: accountId,
    auto_recharge: mapAutoStateToPublic(autoState),
    balance_eur: fromMicrosToEuros(state.balance_micros),
    balance_micros: state.balance_micros,
    currency: "EUR",
    last_topup_at: state.last_topup_at,
  };
}

function parseWalletHash(raw: Record<string, unknown> | null | undefined): WalletState {
  if (!raw) {
    return { balance_micros: 0, last_topup_at: null };
  }
  return {
    balance_micros: Math.floor(toFiniteNumber(raw.balance_micros, 0)),
    last_topup_at: typeof raw.last_topup_at === "string" ? raw.last_topup_at : null,
  };
}

function parseAutoRechargeHash(raw: Record<string, unknown> | null | undefined): AutoRechargeConfigState {
  const defaults = getDefaultAutoRechargeState();
  if (!raw) return defaults;
  const enabledRaw = String(raw.enabled ?? "0");
  const statusRaw = String(raw.status ?? defaults.status).toLowerCase();
  return {
    amount_micros: Math.max(0, Math.floor(toFiniteNumber(raw.amount_micros, defaults.amount_micros))),
    enabled: enabledRaw === "1" || enabledRaw === "true",
    last_error: typeof raw.last_error === "string" && raw.last_error.length > 0 ? raw.last_error : null,
    payment_method_id:
      typeof raw.payment_method_id === "string" && raw.payment_method_id.length > 0
        ? raw.payment_method_id
        : null,
    status:
      statusRaw === "active" || statusRaw === "failed" || statusRaw === "disabled"
        ? (statusRaw as AutoRechargeStatus)
        : defaults.status,
    trigger_micros: Math.max(0, Math.floor(toFiniteNumber(raw.trigger_micros, defaults.trigger_micros))),
    updated_at: typeof raw.updated_at === "string" && raw.updated_at.length > 0 ? raw.updated_at : null,
  };
}

function parseMonthSummaryHash(raw: Record<string, unknown> | null | undefined): MonthSummaryState {
  if (!raw) {
    return {
      adjustment_micros: 0,
      auto_topup_credit_micros: 0,
      chars: 0,
      refund_debit_micros: 0,
      requests: 0,
      topup_credit_micros: 0,
      usage_charge_micros: 0,
    };
  }
  return {
    adjustment_micros: Math.floor(toFiniteNumber(raw.adjustment_micros, 0)),
    auto_topup_credit_micros: Math.floor(toFiniteNumber(raw.auto_topup_credit_micros, 0)),
    chars: Math.floor(toFiniteNumber(raw.chars, 0)),
    refund_debit_micros: Math.floor(toFiniteNumber(raw.refund_debit_micros, 0)),
    requests: Math.floor(toFiniteNumber(raw.requests, 0)),
    topup_credit_micros: Math.floor(toFiniteNumber(raw.topup_credit_micros, 0)),
    usage_charge_micros: Math.floor(toFiniteNumber(raw.usage_charge_micros, 0)),
  };
}

function parseTransactionHash(txId: string, raw: Record<string, unknown> | null | undefined): WalletTransaction | null {
  if (!raw) return null;
  const type = String(raw.type ?? "");
  if (
    type !== "topup_credit" &&
    type !== "usage_debit" &&
    type !== "refund_debit" &&
    type !== "auto_topup_credit" &&
    type !== "adjustment"
  ) {
    return null;
  }
  const amountMicros = Math.floor(toFiniteNumber(raw.amount_micros, 0));
  return {
    account_id: String(raw.account_id ?? ""),
    amount_eur: fromMicrosToEuros(amountMicros),
    amount_micros: amountMicros,
    created_at: String(raw.created_at ?? new Date(0).toISOString()),
    currency: "EUR",
    meta: parseJson<Record<string, unknown>>(raw.meta_json),
    request_id: typeof raw.request_id === "string" && raw.request_id.length > 0 ? raw.request_id : null,
    source: String(raw.source ?? "unknown"),
    stripe_ref: typeof raw.stripe_ref === "string" && raw.stripe_ref.length > 0 ? raw.stripe_ref : null,
    tx_id: txId,
    type,
  };
}

function monthSummaryMemoryKey(accountId: string, monthUtc: string): string {
  return `${monthUtc}:${accountId}`;
}

function updateMonthSummaryAggregate(
  current: MonthSummaryState,
  params: { chars?: number; charge_micros?: number; tx: WalletTransaction }
): MonthSummaryState {
  const next: MonthSummaryState = {
    ...current,
  };

  if (params.tx.type === "topup_credit") {
    next.topup_credit_micros += Math.max(0, params.tx.amount_micros);
  } else if (params.tx.type === "auto_topup_credit") {
    next.auto_topup_credit_micros += Math.max(0, params.tx.amount_micros);
  } else if (params.tx.type === "refund_debit") {
    next.refund_debit_micros += Math.abs(params.tx.amount_micros);
  } else if (params.tx.type === "adjustment") {
    next.adjustment_micros += params.tx.amount_micros;
  } else if (params.tx.type === "usage_debit") {
    const shouldCount = params.tx.meta?.count_in_summary === true;
    if (shouldCount) {
      const usageMicros = Math.abs(params.charge_micros ?? params.tx.amount_micros);
      next.usage_charge_micros += usageMicros;
      next.chars += Math.max(0, Math.floor(params.chars ?? 0));
      next.requests += 1;
    }
  }

  return next;
}

async function persistMonthSummary(
  accountId: string,
  monthUtc: string,
  tx: WalletTransaction,
  chars?: number,
  chargeMicros?: number
): Promise<void> {
  const redis = getRedisClient();
  const key = monthSummaryKey(accountId, monthUtc);
  if (!redis) {
    const memoryKey = monthSummaryMemoryKey(accountId, monthUtc);
    const current =
      memoryMonthSummary.get(memoryKey) ??
      ({
        adjustment_micros: 0,
        auto_topup_credit_micros: 0,
        chars: 0,
        refund_debit_micros: 0,
        requests: 0,
        topup_credit_micros: 0,
        usage_charge_micros: 0,
      } as MonthSummaryState);
    memoryMonthSummary.set(
      memoryKey,
      updateMonthSummaryAggregate(current, {
        charge_micros: chargeMicros,
        chars,
        tx,
      })
    );
    return;
  }

  const pipeline = redis.pipeline();
  if (tx.type === "topup_credit") {
    pipeline.hincrby(key, "topup_credit_micros", Math.max(0, tx.amount_micros));
  } else if (tx.type === "auto_topup_credit") {
    pipeline.hincrby(key, "auto_topup_credit_micros", Math.max(0, tx.amount_micros));
  } else if (tx.type === "refund_debit") {
    pipeline.hincrby(key, "refund_debit_micros", Math.abs(tx.amount_micros));
  } else if (tx.type === "adjustment") {
    pipeline.hincrby(key, "adjustment_micros", tx.amount_micros);
  } else if (tx.type === "usage_debit") {
    const shouldCount = tx.meta?.count_in_summary === true;
    if (shouldCount) {
      pipeline.hincrby(key, "usage_charge_micros", Math.abs(chargeMicros ?? tx.amount_micros));
      pipeline.hincrby(key, "chars", Math.max(0, Math.floor(chars ?? 0)));
      pipeline.hincrby(key, "requests", 1);
    }
  }
  pipeline.expire(key, EVENT_TTL_SECONDS);
  await pipeline.exec();
}

async function recordWalletTransaction(
  params: WalletBalanceDeltaInput,
  amountMicrosSigned: number
): Promise<WalletTransaction> {
  const txId = randomTxId();
  const tx: WalletTransaction = {
    account_id: params.account_id,
    amount_eur: fromMicrosToEuros(amountMicrosSigned),
    amount_micros: amountMicrosSigned,
    created_at: params.created_at,
    currency: "EUR",
    meta: params.meta ?? null,
    request_id: params.request_id ?? null,
    source: params.source,
    stripe_ref: params.stripe_ref ?? null,
    tx_id: txId,
    type: params.type,
  };

  const redis = getRedisClient();
  if (!redis) {
    memoryTransactions.set(txId, tx);
    const index = memoryTxIndex.get(params.account_id) ?? [];
    index.unshift(txId);
    memoryTxIndex.set(params.account_id, index);
  } else {
    const score = Date.parse(params.created_at);
    const txStorageKey = txKey(txId);
    const metaJson = tx.meta ? JSON.stringify(tx.meta) : "";
    await Promise.all([
      redis.hset(txStorageKey, {
        account_id: tx.account_id,
        amount_micros: tx.amount_micros,
        created_at: tx.created_at,
        currency: tx.currency,
        meta_json: metaJson,
        request_id: tx.request_id ?? "",
        source: tx.source,
        stripe_ref: tx.stripe_ref ?? "",
        type: tx.type,
      }),
      redis.expire(txStorageKey, EVENT_TTL_SECONDS),
      redis.zadd(txIndexKey(params.account_id), { member: txId, score }),
      redis.expire(txIndexKey(params.account_id), EVENT_TTL_SECONDS),
    ]);
  }

  const monthUtc = params.created_at.slice(0, 7);
  await persistMonthSummary(
    params.account_id,
    monthUtc,
    tx,
    params.type === "usage_debit" ? Math.floor(toFiniteNumber(tx.meta?.chars, 0)) : undefined,
    params.type === "usage_debit" ? Math.abs(amountMicrosSigned) : undefined
  );
  return tx;
}

async function applyWalletDeltaAtomic(
  accountId: string,
  deltaMicros: number,
  allowNegative: boolean,
  nowIso: string
): Promise<WalletBalanceDeltaResult> {
  const redis = getRedisClient();
  const key = walletKey(accountId);
  if (!redis) {
    const current = memoryWallets.get(accountId) ?? { balance_micros: 0, last_topup_at: null };
    const next = current.balance_micros + deltaMicros;
    if (!allowNegative && next < 0) {
      return { balance_micros: current.balance_micros, ok: false };
    }
    memoryWallets.set(accountId, {
      ...current,
      balance_micros: next,
    });
    return { balance_micros: next, ok: true };
  }

  const lua = `
local key = KEYS[1]
local delta = tonumber(ARGV[1])
local allow_negative = tonumber(ARGV[2])
local now = ARGV[3]
local current = tonumber(redis.call("HGET", key, "balance_micros") or "0")
local next_balance = current + delta
if allow_negative == 0 and next_balance < 0 then
  return {0, current}
end
redis.call("HSET", key, "currency", "EUR", "balance_micros", next_balance, "updated_at", now)
return {1, next_balance}
`;

  const result = (await redis.eval(lua, [key], [
    String(Math.trunc(deltaMicros)),
    allowNegative ? "1" : "0",
    nowIso,
  ])) as unknown as Array<number | string>;

  const ok = Number(result?.[0] ?? 0) === 1;
  const balance = Math.floor(toFiniteNumber(result?.[1], 0));
  return { balance_micros: balance, ok };
}

async function updateWalletLastTopup(accountId: string, timestamp: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    const current = memoryWallets.get(accountId) ?? { balance_micros: 0, last_topup_at: null };
    memoryWallets.set(accountId, { ...current, last_topup_at: timestamp });
    return;
  }
  await redis.hset(walletKey(accountId), { last_topup_at: timestamp });
}

export function isPrepaidBillingEnabled(): boolean {
  const value = (process.env.API_BILLING_PREPAID_ENABLED ?? "").trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

export function eurosToMicros(value: number): number {
  return toMicrosFromEuros(value);
}

export function microsToEuros(value: number): number {
  return fromMicrosToEuros(value);
}

export function getTopupPackAmountEur(packId: TopupPackId): number {
  return TOPUP_PACKS_EUR[packId];
}

export function resolveTopupAmount(input: {
  amount_eur?: number;
  pack_id?: TopupPackId;
}): { amount_eur: number; amount_micros: number } | null {
  const hasPack = typeof input.pack_id === "string";
  const hasAmount = typeof input.amount_eur === "number";
  if (hasPack === hasAmount) {
    return null;
  }

  let amountEur: number;
  if (hasPack) {
    const maybe = TOPUP_PACKS_EUR[input.pack_id as TopupPackId];
    if (!maybe) return null;
    amountEur = maybe;
  } else {
    const provided = toFiniteNumber(input.amount_eur, 0);
    amountEur = Number(provided.toFixed(2));
  }

  if (!Number.isFinite(amountEur) || amountEur < MIN_TOPUP_EUR) {
    return null;
  }
  const amountMicros = toMicrosFromEuros(amountEur);
  if (amountMicros < toMicrosFromEuros(MIN_TOPUP_EUR)) {
    return null;
  }
  return { amount_eur: amountEur, amount_micros: amountMicros };
}

export function getTopupAmountCents(amountEur: number): number {
  return toCentsFromEuros(amountEur);
}

export async function getWalletBalance(accountId: string): Promise<WalletBalance> {
  const redis = getRedisClient();
  let walletState: WalletState;
  let autoState: AutoRechargeConfigState;

  if (!redis) {
    walletState = memoryWallets.get(accountId) ?? { balance_micros: 0, last_topup_at: null };
    autoState = memoryAutoRecharge.get(accountId) ?? getDefaultAutoRechargeState();
  } else {
    const [walletRaw, autoRaw] = await Promise.all([
      redis.hgetall<Record<string, unknown>>(walletKey(accountId)),
      redis.hgetall<Record<string, unknown>>(autoRechargeKey(accountId)),
    ]);
    walletState = parseWalletHash(walletRaw);
    autoState = parseAutoRechargeHash(autoRaw);
  }

  return mapWallet(accountId, walletState, autoState);
}

export async function creditWallet(params: WalletBalanceDeltaInput): Promise<{
  balance_eur: number;
  balance_micros: number;
  tx: WalletTransaction;
}> {
  const amount = Math.max(0, Math.floor(params.amount_micros));
  if (amount <= 0) {
    throw new Error("invalid_credit_amount");
  }
  const nowIso = params.created_at;
  const result = await applyWalletDeltaAtomic(params.account_id, amount, true, nowIso);
  if (!result.ok) {
    throw new Error("credit_failed");
  }

  if (params.type === "topup_credit" || params.type === "auto_topup_credit") {
    await updateWalletLastTopup(params.account_id, nowIso);
  }

  const tx = await recordWalletTransaction(params, amount);
  return {
    balance_eur: fromMicrosToEuros(result.balance_micros),
    balance_micros: result.balance_micros,
    tx,
  };
}

export async function debitWallet(params: WalletBalanceDeltaInput): Promise<{
  balance_eur: number;
  balance_micros: number;
  ok: boolean;
  tx: WalletTransaction | null;
}> {
  const amount = Math.max(0, Math.floor(params.amount_micros));
  if (amount <= 0) {
    return { balance_eur: 0, balance_micros: 0, ok: false, tx: null };
  }

  const nowIso = params.created_at;
  const result = await applyWalletDeltaAtomic(
    params.account_id,
    -amount,
    Boolean(params.allow_negative),
    nowIso
  );
  if (!result.ok) {
    return {
      balance_eur: fromMicrosToEuros(result.balance_micros),
      balance_micros: result.balance_micros,
      ok: false,
      tx: null,
    };
  }

  const tx = await recordWalletTransaction(params, -amount);
  return {
    balance_eur: fromMicrosToEuros(result.balance_micros),
    balance_micros: result.balance_micros,
    ok: true,
    tx,
  };
}

export function calculateUsageChargeMicros(
  billableChars: number,
  monthlyCharsBefore: number
): PrepaidChargeResult {
  const safeChars = Math.max(0, Math.floor(billableChars));
  const monthlyBefore = Math.max(0, Math.floor(monthlyCharsBefore));

  let remaining = safeChars;
  let cursor = monthlyBefore;
  let previousCap = 0;
  let chargeMicros = 0;
  let primaryRateMicrosPerChar = PREPAID_PRICING_TIERS[0]?.rate_micros_per_char ?? 15;

  for (const tier of PREPAID_PRICING_TIERS) {
    if (cursor < tier.up_to_chars) {
      primaryRateMicrosPerChar = tier.rate_micros_per_char;
      break;
    }
  }

  for (const tier of PREPAID_PRICING_TIERS) {
    if (remaining <= 0) break;
    const cap = tier.up_to_chars;
    if (cursor >= cap) {
      previousCap = cap;
      continue;
    }
    const segmentStart = Math.max(cursor, previousCap);
    const capacity = Math.max(0, cap - segmentStart);
    const consume = Math.min(remaining, capacity);
    chargeMicros += consume * tier.rate_micros_per_char;
    remaining -= consume;
    cursor += consume;
    previousCap = cap;
  }

  return {
    charge_micros: Math.max(0, Math.floor(chargeMicros)),
    price_tier_eur_per_million: primaryRateMicrosPerChar,
  };
}

export async function getMonthUsageSummary(
  accountId: string,
  monthUtc = getMonthKey()
): Promise<PrepaidMonthSummary> {
  const redis = getRedisClient();
  if (!redis) {
    const state =
      memoryMonthSummary.get(monthSummaryMemoryKey(accountId, monthUtc)) ??
      ({
        adjustment_micros: 0,
        auto_topup_credit_micros: 0,
        chars: 0,
        refund_debit_micros: 0,
        requests: 0,
        topup_credit_micros: 0,
        usage_charge_micros: 0,
      } as MonthSummaryState);
    return { ...state, month_utc: monthUtc };
  }
  const raw = await redis.hgetall<Record<string, unknown>>(monthSummaryKey(accountId, monthUtc));
  return { ...parseMonthSummaryHash(raw), month_utc: monthUtc };
}

export async function registerSuccessfulUsageSummary(input: {
  account_id: string;
  chars: number;
  charge_micros: number;
  month_utc?: string;
}): Promise<void> {
  const monthUtc = input.month_utc ?? getMonthKey();
  const chars = Math.max(0, Math.floor(input.chars));
  const chargeMicros = Math.max(0, Math.floor(input.charge_micros));
  if (chars <= 0 && chargeMicros <= 0) return;

  const redis = getRedisClient();
  const key = monthSummaryKey(input.account_id, monthUtc);
  if (!redis) {
    const memoryKey = monthSummaryMemoryKey(input.account_id, monthUtc);
    const current =
      memoryMonthSummary.get(memoryKey) ??
      ({
        adjustment_micros: 0,
        auto_topup_credit_micros: 0,
        chars: 0,
        refund_debit_micros: 0,
        requests: 0,
        topup_credit_micros: 0,
        usage_charge_micros: 0,
      } as MonthSummaryState);
    current.chars += chars;
    current.requests += 1;
    current.usage_charge_micros += chargeMicros;
    memoryMonthSummary.set(memoryKey, current);
    return;
  }

  const pipeline = redis.pipeline();
  pipeline.hincrby(key, "chars", chars);
  pipeline.hincrby(key, "requests", 1);
  pipeline.hincrby(key, "usage_charge_micros", chargeMicros);
  pipeline.expire(key, EVENT_TTL_SECONDS);
  await pipeline.exec();
}

export async function listWalletTransactions(
  accountId: string,
  input?: { cursor?: string | null; limit?: number }
): Promise<WalletTransactionsPage> {
  const limit = Math.min(
    MAX_LIST_LIMIT,
    Math.max(1, Math.floor(toFiniteNumber(input?.limit, DEFAULT_LIST_LIMIT)))
  );
  const offset = Math.max(0, Math.floor(toFiniteNumber(input?.cursor, 0)));

  const redis = getRedisClient();
  if (!redis) {
    const index = memoryTxIndex.get(accountId) ?? [];
    const slice = index.slice(offset, offset + limit);
    const transactions = slice
      .map((txId) => memoryTransactions.get(txId))
      .filter((item): item is WalletTransaction => Boolean(item));
    const nextCursor = offset + limit < index.length ? String(offset + limit) : null;
    return { next_cursor: nextCursor, transactions };
  }

  const txIds = await redis.zrange<string[]>(txIndexKey(accountId), 0, -1, {
    count: limit,
    offset,
    rev: true,
  });

  const transactions: WalletTransaction[] = [];
  for (const txId of txIds) {
    const raw = await redis.hgetall<Record<string, unknown>>(txKey(txId));
    const parsed = parseTransactionHash(txId, raw);
    if (parsed) transactions.push(parsed);
  }

  const total = await redis.zcard(txIndexKey(accountId));
  const nextCursor = offset + txIds.length < total ? String(offset + txIds.length) : null;
  return {
    next_cursor: nextCursor,
    transactions,
  };
}

export async function getAutoRechargeConfig(accountId: string): Promise<AutoRechargeConfig> {
  const redis = getRedisClient();
  if (!redis) {
    const state = memoryAutoRecharge.get(accountId) ?? getDefaultAutoRechargeState();
    return mapAutoStateToPublic(state);
  }
  const raw = await redis.hgetall<Record<string, unknown>>(autoRechargeKey(accountId));
  return mapAutoStateToPublic(parseAutoRechargeHash(raw));
}

async function persistAutoRechargeState(accountId: string, state: AutoRechargeConfigState): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryAutoRecharge.set(accountId, state);
    return;
  }
  await redis.hset(autoRechargeKey(accountId), {
    amount_micros: state.amount_micros,
    enabled: state.enabled ? "1" : "0",
    last_error: state.last_error ?? "",
    payment_method_id: state.payment_method_id ?? "",
    status: state.status,
    trigger_micros: state.trigger_micros,
    updated_at: state.updated_at ?? "",
  });
}

export async function setAutoRechargeConfig(
  accountId: string,
  input: { amount_eur: number; enabled: boolean; trigger_eur: number }
): Promise<AutoRechargeConfig> {
  const amountMicros = toMicrosFromEuros(input.amount_eur);
  const triggerMicros = toMicrosFromEuros(input.trigger_eur);
  if (amountMicros < toMicrosFromEuros(MIN_TOPUP_EUR)) {
    throw new Error("invalid_auto_recharge_amount");
  }
  if (triggerMicros <= 0 || triggerMicros >= amountMicros) {
    throw new Error("invalid_auto_recharge_trigger");
  }

  const current = await getAutoRechargeConfig(accountId);
  const nowIso = new Date().toISOString();
  const nextState: AutoRechargeConfigState = {
    amount_micros: amountMicros,
    enabled: input.enabled,
    last_error: input.enabled ? current.last_error : null,
    payment_method_id: current.payment_method_id,
    status: input.enabled ? (current.payment_method_id ? "active" : "failed") : "disabled",
    trigger_micros: triggerMicros,
    updated_at: nowIso,
  };
  await persistAutoRechargeState(accountId, nextState);
  return mapAutoStateToPublic(nextState);
}

export async function markAutoRechargeFailure(
  accountId: string,
  errorMessage: string
): Promise<AutoRechargeConfig> {
  const current = await getAutoRechargeConfig(accountId);
  const state: AutoRechargeConfigState = {
    amount_micros: toMicrosFromEuros(current.amount_eur),
    enabled: current.enabled,
    last_error: sanitizeErrorMessage(errorMessage),
    payment_method_id: current.payment_method_id,
    status: current.enabled ? "failed" : "disabled",
    trigger_micros: toMicrosFromEuros(current.trigger_eur),
    updated_at: new Date().toISOString(),
  };
  await persistAutoRechargeState(accountId, state);
  return mapAutoStateToPublic(state);
}

export async function markAutoRechargeActive(accountId: string): Promise<AutoRechargeConfig> {
  const current = await getAutoRechargeConfig(accountId);
  const state: AutoRechargeConfigState = {
    amount_micros: toMicrosFromEuros(current.amount_eur),
    enabled: current.enabled,
    last_error: null,
    payment_method_id: current.payment_method_id,
    status: current.enabled ? "active" : "disabled",
    trigger_micros: toMicrosFromEuros(current.trigger_eur),
    updated_at: new Date().toISOString(),
  };
  await persistAutoRechargeState(accountId, state);
  return mapAutoStateToPublic(state);
}

export async function setAutoRechargePaymentMethod(
  accountId: string,
  paymentMethodId: string | null
): Promise<AutoRechargeConfig> {
  const current = await getAutoRechargeConfig(accountId);
  const state: AutoRechargeConfigState = {
    amount_micros: toMicrosFromEuros(current.amount_eur),
    enabled: current.enabled,
    last_error: current.last_error,
    payment_method_id: paymentMethodId,
    status: current.enabled ? (paymentMethodId ? "active" : "failed") : "disabled",
    trigger_micros: toMicrosFromEuros(current.trigger_eur),
    updated_at: new Date().toISOString(),
  };
  await persistAutoRechargeState(accountId, state);
  return mapAutoStateToPublic(state);
}

export async function getStripeCustomerIdByAccount(accountId: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) {
    return memoryStripeCustomerByAccount.get(accountId) ?? null;
  }
  const raw = await redis.get<string>(stripeCustomerByAccountKey(accountId));
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function getAccountIdByStripeCustomer(customerId: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis) {
    return memoryAccountByStripeCustomer.get(customerId) ?? null;
  }
  const raw = await redis.get<string>(accountByStripeCustomerKey(customerId));
  return typeof raw === "string" && raw.length > 0 ? raw : null;
}

export async function setStripeCustomerForAccount(
  accountId: string,
  customerId: string
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryStripeCustomerByAccount.set(accountId, customerId);
    memoryAccountByStripeCustomer.set(customerId, accountId);
    return;
  }
  await Promise.all([
    redis.set(stripeCustomerByAccountKey(accountId), customerId, { ex: EVENT_TTL_SECONDS }),
    redis.set(accountByStripeCustomerKey(customerId), accountId, { ex: EVENT_TTL_SECONDS }),
  ]);
}

export async function storeCheckoutSessionMeta(
  sessionId: string,
  meta: CheckoutSessionMeta
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryCheckoutSessionMeta.set(sessionId, meta);
    return;
  }
  await redis.set(checkoutSessionKey(sessionId), JSON.stringify(meta), { ex: EVENT_TTL_SECONDS });
}

export async function getCheckoutSessionMeta(sessionId: string): Promise<CheckoutSessionMeta | null> {
  const redis = getRedisClient();
  if (!redis) {
    return memoryCheckoutSessionMeta.get(sessionId) ?? null;
  }
  const raw = await redis.get<unknown>(checkoutSessionKey(sessionId));
  return parseJson<CheckoutSessionMeta>(raw);
}

export async function beginStripeEventProcessing(
  eventId: string
): Promise<"acquired" | "processed" | "processing"> {
  const redis = getRedisClient();
  if (!redis) {
    const state = memoryStripeEventState.get(eventId);
    if (state === "processed") return "processed";
    if (state === "processing") return "processing";
    memoryStripeEventState.set(eventId, "processing");
    return "acquired";
  }

  const key = stripeEventKey(eventId);
  const acquired = await redis.set(key, "processing", {
    ex: STRIPE_EVENT_LOCK_TTL_SECONDS,
    nx: true,
  });
  if (acquired) {
    return "acquired";
  }

  const existing = await redis.get<string>(key);
  if (existing === "processed") {
    return "processed";
  }
  return "processing";
}

export async function completeStripeEventProcessing(eventId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    memoryStripeEventState.set(eventId, "processed");
    return;
  }
  await redis.set(stripeEventKey(eventId), "processed", { ex: STRIPE_EVENT_TTL_SECONDS });
}

export async function abortStripeEventProcessing(eventId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    const state = memoryStripeEventState.get(eventId);
    if (state === "processing") {
      memoryStripeEventState.delete(eventId);
    }
    return;
  }

  const lua = `
local key = KEYS[1]
local current = redis.call("GET", key)
if current == "processing" then
  redis.call("DEL", key)
  return 1
end
return 0
`;
  await redis.eval(lua, [stripeEventKey(eventId)], []);
}

export async function consumeRefundDeltaMicros(
  chargeId: string,
  cumulativeRefundMicros: number
): Promise<number> {
  const safeCumulative = Math.max(0, Math.floor(cumulativeRefundMicros));
  if (safeCumulative <= 0) return 0;

  const redis = getRedisClient();
  if (!redis) {
    const prev = memoryStripeRefundCursorMicros.get(chargeId) ?? 0;
    if (safeCumulative <= prev) return 0;
    const delta = safeCumulative - prev;
    memoryStripeRefundCursorMicros.set(chargeId, safeCumulative);
    return delta;
  }

  const lua = `
local key = KEYS[1]
local incoming = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
local prev = tonumber(redis.call("GET", key) or "0")
if incoming <= prev then
  return 0
end
redis.call("SET", key, incoming, "EX", ttl)
return incoming - prev
`;

  const delta = (await redis.eval(lua, [stripeRefundCursorKey(chargeId)], [
    String(safeCumulative),
    String(EVENT_TTL_SECONDS),
  ])) as number;

  return Math.max(0, Math.floor(toFiniteNumber(delta, 0)));
}

export async function beginPrepaidIdempotency(
  accountId: string,
  idempotency: string,
  requestHash: string
): Promise<
  | { status: "acquired" }
  | { status: "conflict" }
  | { status: "processing" }
  | { response: PrepaidIdempotencyCompleted; status: "replay" }
> {
  const idem = idempotency.trim();
  if (!idem) {
    return { status: "acquired" };
  }
  const key = idempotencyKey(accountId, idem);
  const processing: PrepaidIdempotencyRecord = { request_hash: requestHash, status: "processing" };
  const redis = getRedisClient();

  if (!redis) {
    const existing = memoryIdempotency.get(key);
    if (!existing) {
      memoryIdempotency.set(key, processing);
      return { status: "acquired" };
    }
    if (existing.request_hash !== requestHash) {
      return { status: "conflict" };
    }
    if (existing.status === "completed" && existing.response) {
      return { response: existing.response, status: "replay" };
    }
    return { status: "processing" };
  }

  const acquired = await redis.set(key, JSON.stringify(processing), {
    ex: IDEMPOTENCY_TTL_SECONDS,
    nx: true,
  });
  if (acquired) return { status: "acquired" };

  const raw = await redis.get<unknown>(key);
  const existing = parseJson<PrepaidIdempotencyRecord>(raw);
  if (!existing) return { status: "processing" };
  if (existing.request_hash !== requestHash) return { status: "conflict" };
  if (existing.status === "completed" && existing.response) {
    return { response: existing.response, status: "replay" };
  }
  return { status: "processing" };
}

export async function completePrepaidIdempotency(
  accountId: string,
  idempotency: string,
  requestHash: string,
  response: PrepaidIdempotencyCompleted
): Promise<void> {
  const idem = idempotency.trim();
  if (!idem) return;

  const key = idempotencyKey(accountId, idem);
  const payload: PrepaidIdempotencyRecord = {
    request_hash: requestHash,
    response,
    status: "completed",
  };
  const redis = getRedisClient();
  if (!redis) {
    memoryIdempotency.set(key, payload);
    return;
  }
  await redis.set(key, JSON.stringify(payload), { ex: IDEMPOTENCY_TTL_SECONDS });
}

export async function abortPrepaidIdempotency(accountId: string, idempotency: string): Promise<void> {
  const idem = idempotency.trim();
  if (!idem) return;
  const key = idempotencyKey(accountId, idem);
  const redis = getRedisClient();
  if (!redis) {
    memoryIdempotency.delete(key);
    return;
  }
  await redis.del(key);
}

export async function getPrepaidBillingSummary(
  accountId: string,
  monthUtc = getMonthKey()
): Promise<{
  account_id: string;
  adjustment_eur: number;
  auto_topups_eur: number;
  chars: number;
  currency: "EUR";
  month_utc: string;
  refunds_eur: number;
  requests: number;
  topups_eur: number;
  usage_eur: number;
  wallet_balance_eur: number;
  wallet_balance_micros: number;
}> {
  const [wallet, month] = await Promise.all([
    getWalletBalance(accountId),
    getMonthUsageSummary(accountId, monthUtc),
  ]);
  return {
    account_id: accountId,
    adjustment_eur: fromMicrosToEuros(month.adjustment_micros),
    auto_topups_eur: fromMicrosToEuros(month.auto_topup_credit_micros),
    chars: month.chars,
    currency: "EUR",
    month_utc: month.month_utc,
    refunds_eur: fromMicrosToEuros(month.refund_debit_micros),
    requests: month.requests,
    topups_eur: fromMicrosToEuros(month.topup_credit_micros),
    usage_eur: fromMicrosToEuros(month.usage_charge_micros),
    wallet_balance_eur: wallet.balance_eur,
    wallet_balance_micros: wallet.balance_micros,
  };
}

export function buildTopupSessionMeta(input: {
  account_id: string;
  amount_micros: number;
  save_payment_method: boolean;
  source: "manual" | "auto";
}): CheckoutSessionMeta {
  return {
    account_id: input.account_id,
    amount_micros: input.amount_micros,
    created_at: new Date().toISOString(),
    save_payment_method: input.save_payment_method,
    source: input.source,
  };
}

export function getAutoRechargeDefaults(): { amount_eur: number; trigger_eur: number } {
  return {
    amount_eur: fromMicrosToEuros(getDefaultAutoAmountMicros()),
    trigger_eur: fromMicrosToEuros(getDefaultAutoTriggerMicros()),
  };
}

export function getMinimumTopupEur(): number {
  return MIN_TOPUP_EUR;
}

export function buildWalletDeltaInput(input: {
  account_id: string;
  amount_micros: number;
  meta?: Record<string, unknown>;
  request_id?: string | null;
  source: string;
  stripe_ref?: string | null;
  type: WalletTransactionType;
  allow_negative?: boolean;
}): WalletBalanceDeltaInput {
  return {
    account_id: input.account_id,
    allow_negative: input.allow_negative,
    amount_micros: input.amount_micros,
    created_at: new Date().toISOString(),
    meta: input.meta,
    request_id: input.request_id,
    source: input.source,
    stripe_ref: input.stripe_ref,
    type: input.type,
  };
}

export function ensureRequestId(value?: string | null): string {
  return value?.trim() || randomUUID();
}

export function __resetPrepaidBillingForTests(): void {
  redisClient = null;
  memoryWallets.clear();
  memoryTransactions.clear();
  memoryTxIndex.clear();
  memoryStripeEventState.clear();
  memoryStripeRefundCursorMicros.clear();
  memoryStripeCustomerByAccount.clear();
  memoryAccountByStripeCustomer.clear();
  memoryCheckoutSessionMeta.clear();
  memoryMonthSummary.clear();
  memoryAutoRecharge.clear();
  memoryIdempotency.clear();
}
