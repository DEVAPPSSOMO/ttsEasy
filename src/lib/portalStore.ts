import { createHash, randomBytes, randomUUID } from "crypto";
import { Redis } from "@upstash/redis";
import type { ApiCredential } from "@/lib/apiBilling";
import { getStripeCustomerIdByAccount, setStripeCustomerForAccount } from "@/lib/prepaidBilling";
import { getStripeClient } from "@/lib/stripeClient";
import { supabaseServiceRequest, isSupabaseServiceConfigured } from "@/lib/supabase/server";
import { PortalAccount, PortalApiKey, PortalApiKeyCreateResponse } from "@/lib/types";

interface AccountRow {
  id: string;
  owner_user_id: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ApiKeyRow {
  id: string;
  account_id: string;
  key_prefix: string;
  key_hash_sha256: string;
  status: string;
  rate_limit_per_minute: number | string | null;
  monthly_hard_limit_chars: number | string | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

interface AccountBootstrapResult {
  account: PortalAccount;
  initial_api_key: string | null;
}

const API_KEYS_CACHE_PREFIX = "billing:v2:key-index";
const API_KEYS_CACHE_TTL_SECONDS = 120;
const KEY_LIMIT_PER_ACCOUNT = 20;
const DEFAULT_RATE_LIMIT_PER_MINUTE = 120;
const DEFAULT_MONTHLY_HARD_LIMIT_CHARS = 100_000_000;

let redisClient: Redis | null | undefined;

function toNumber(value: unknown, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

function getDefaultMonthlyHardLimitChars(): number {
  const fromEnv = toNumber(
    process.env.API_BILLING_DEFAULT_MONTHLY_HARD_LIMIT_CHARS,
    DEFAULT_MONTHLY_HARD_LIMIT_CHARS
  );
  return fromEnv > 0 ? Math.floor(fromEnv) : DEFAULT_MONTHLY_HARD_LIMIT_CHARS;
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

function getApiKeyPepper(): string {
  return process.env.API_KEY_HASH_PEPPER?.trim() || "";
}

function makeApiKeyHash(secret: string): string {
  const pepper = getApiKeyPepper();
  return createHash("sha256")
    .update(pepper ? `${pepper}:${secret}` : secret)
    .digest("hex");
}

function makeLegacyCompatibleHash(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

function isDbBillingEnabled(): boolean {
  return (process.env.API_BILLING_DB_ENABLED ?? "").trim().toLowerCase() === "true";
}

function sanitizeSlugChunk(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
}

function mapAccount(row: AccountRow): PortalAccount {
  return {
    created_at: row.created_at,
    id: row.id,
    owner_user_id: row.owner_user_id,
    slug: row.slug,
    status: row.status === "disabled" ? "disabled" : "active",
    updated_at: row.updated_at,
  };
}

function mapApiKey(row: ApiKeyRow): PortalApiKey {
  return {
    account_id: row.account_id,
    created_at: row.created_at,
    id: row.id,
    key_prefix: row.key_prefix,
    last_used_at: row.last_used_at,
    monthly_hard_limit_chars:
      row.monthly_hard_limit_chars === null
        ? null
        : Math.max(0, Math.floor(toNumber(row.monthly_hard_limit_chars, getDefaultMonthlyHardLimitChars()))),
    rate_limit_per_minute: Math.max(
      1,
      Math.floor(toNumber(row.rate_limit_per_minute, DEFAULT_RATE_LIMIT_PER_MINUTE))
    ),
    revoked_at: row.revoked_at,
    status: row.status === "active" ? "active" : "revoked",
  };
}

function buildQuery(params: Record<string, string | number | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    search.set(key, String(value));
  }
  return search.toString();
}

async function selectRows<T>(table: string, params: Record<string, string | number | null | undefined>): Promise<T[]> {
  if (!isSupabaseServiceConfigured() || !isDbBillingEnabled()) {
    return [];
  }

  const query = buildQuery(params);
  const path = `/rest/v1/${table}?${query}`;
  return supabaseServiceRequest<T[]>({ method: "GET", path });
}

async function insertRow<T>(table: string, payload: Record<string, unknown>): Promise<T> {
  const response = await supabaseServiceRequest<T[]>({
    body: payload,
    headers: {
      Prefer: "return=representation",
    },
    method: "POST",
    path: `/rest/v1/${table}`,
  });

  const row = response[0];
  if (!row) {
    throw new Error("db_insert_failed");
  }
  return row;
}

async function patchRows<T>(
  table: string,
  payload: Record<string, unknown>,
  where: Record<string, string>
): Promise<T[]> {
  const query = buildQuery(where);
  return supabaseServiceRequest<T[]>({
    body: payload,
    headers: {
      Prefer: "return=representation",
    },
    method: "PATCH",
    path: `/rest/v1/${table}?${query}`,
  });
}

function generateApiKeySecret(): string {
  return `tsk_live_${randomBytes(24).toString("base64url")}`;
}

function buildKeyPrefix(secret: string): string {
  return secret.slice(0, 14);
}

function cacheKey(hash: string): string {
  return `${API_KEYS_CACHE_PREFIX}:${hash}`;
}

async function getCachedCredential(hash: string): Promise<ApiCredential | null | undefined> {
  const redis = getRedisClient();
  if (!redis) {
    return undefined;
  }

  const raw = await redis.get<string>(cacheKey(hash));
  if (!raw) return undefined;
  if (raw === "__none") return null;

  try {
    const parsed = JSON.parse(raw) as ApiCredential;
    return parsed;
  } catch {
    return undefined;
  }
}

async function setCachedCredential(hash: string, credential: ApiCredential | null): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;
  const value = credential ? JSON.stringify(credential) : "__none";
  await redis.set(cacheKey(hash), value, { ex: API_KEYS_CACHE_TTL_SECONDS });
}

async function getAccountByOwnerId(ownerUserId: string): Promise<PortalAccount | null> {
  const rows = await selectRows<AccountRow>("accounts", {
    limit: 1,
    owner_user_id: `eq.${ownerUserId}`,
    select: "id,owner_user_id,slug,status,created_at,updated_at",
  });

  const row = rows[0];
  return row ? mapAccount(row) : null;
}

async function getAccountById(accountId: string): Promise<PortalAccount | null> {
  const rows = await selectRows<AccountRow>("accounts", {
    id: `eq.${accountId}`,
    limit: 1,
    select: "id,owner_user_id,slug,status,created_at,updated_at",
  });

  const row = rows[0];
  return row ? mapAccount(row) : null;
}

async function bootstrapStripeCustomer(accountId: string): Promise<void> {
  const existing = await getStripeCustomerIdByAccount(accountId);
  if (existing) {
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    return;
  }

  try {
    const customer = await stripe.customers.create({
      metadata: {
        account_id: accountId,
      },
    });
    await setStripeCustomerForAccount(accountId, customer.id);
  } catch {
    // Keep bootstrap resilient if Stripe is temporarily unavailable.
  }
}

async function countActiveApiKeys(accountId: string): Promise<number> {
  const rows = await selectRows<{ id: string }>("api_keys", {
    account_id: `eq.${accountId}`,
    select: "id",
    status: "eq.active",
  });
  return rows.length;
}

export async function ensurePortalAccountForOwner(input: {
  user_id: string;
  email: string | null;
}): Promise<AccountBootstrapResult | null> {
  if (!isDbBillingEnabled() || !isSupabaseServiceConfigured()) {
    return null;
  }

  const existing = await getAccountByOwnerId(input.user_id);
  if (existing) {
    await bootstrapStripeCustomer(existing.id);
    return {
      account: existing,
      initial_api_key: null,
    };
  }

  const baseSlug = sanitizeSlugChunk((input.email ?? "account").split("@")[0] || "account") || "account";
  const suffix = randomUUID().replace(/-/g, "").slice(0, 8);
  const slug = `${baseSlug}-${suffix}`;

  const createdAccount = await insertRow<AccountRow>("accounts", {
    id: `acct_${randomUUID().replace(/-/g, "")}`,
    owner_user_id: input.user_id,
    slug,
    status: "active",
  });

  await insertRow<{ account_id: string }>("account_profile", {
    account_id: createdAccount.id,
    billing_email: input.email,
    display_name: input.email ? input.email.split("@")[0] : "",
  });

  const initialKey = await createPortalApiKey(createdAccount.id);
  const account = mapAccount(createdAccount);

  await bootstrapStripeCustomer(account.id);

  return {
    account,
    initial_api_key: initialKey.api_key,
  };
}

export async function getPortalAccountByOwnerUserId(ownerUserId: string): Promise<PortalAccount | null> {
  return getAccountByOwnerId(ownerUserId);
}

export async function listPortalApiKeys(accountId: string): Promise<PortalApiKey[]> {
  if (!isDbBillingEnabled() || !isSupabaseServiceConfigured()) {
    return [];
  }

  const rows = await selectRows<ApiKeyRow>("api_keys", {
    account_id: `eq.${accountId}`,
    order: "created_at.desc",
    select:
      "id,account_id,key_prefix,key_hash_sha256,status,rate_limit_per_minute,monthly_hard_limit_chars,last_used_at,created_at,revoked_at",
  });

  return rows.map(mapApiKey);
}

export async function createPortalApiKey(accountId: string): Promise<PortalApiKeyCreateResponse> {
  if (!isDbBillingEnabled() || !isSupabaseServiceConfigured()) {
    throw new Error("billing_db_disabled");
  }

  const activeCount = await countActiveApiKeys(accountId);
  if (activeCount >= KEY_LIMIT_PER_ACCOUNT) {
    throw new Error("api_key_limit_reached");
  }

  const secret = generateApiKeySecret();
  const hash = makeApiKeyHash(secret);
  const keyRow = await insertRow<ApiKeyRow>("api_keys", {
    account_id: accountId,
    key_hash_sha256: hash,
    key_prefix: buildKeyPrefix(secret),
    monthly_hard_limit_chars: getDefaultMonthlyHardLimitChars(),
    rate_limit_per_minute: DEFAULT_RATE_LIMIT_PER_MINUTE,
    status: "active",
  });

  const key = mapApiKey(keyRow);

  await setCachedCredential(hash, {
    account_id: accountId,
    billing_status: "active",
    key_hash: hash,
    key_id: key.id,
    monthly_hard_limit_chars: key.monthly_hard_limit_chars,
    rate_limit_per_minute: key.rate_limit_per_minute,
    status: "active",
  });

  return {
    api_key: secret,
    key,
  };
}

export async function revokePortalApiKey(accountId: string, keyId: string): Promise<boolean> {
  if (!isDbBillingEnabled() || !isSupabaseServiceConfigured()) {
    return false;
  }

  const rows = await patchRows<ApiKeyRow>(
    "api_keys",
    {
      revoked_at: new Date().toISOString(),
      status: "revoked",
    },
    {
      account_id: `eq.${accountId}`,
      id: `eq.${keyId}`,
    }
  );

  const row = rows[0];
  if (!row) {
    return false;
  }

  await setCachedCredential(row.key_hash_sha256, null);
  return true;
}

export async function findApiCredentialInDatabase(apiKey: string): Promise<ApiCredential | null> {
  if (!apiKey || !isDbBillingEnabled() || !isSupabaseServiceConfigured()) {
    return null;
  }

  const hash = makeApiKeyHash(apiKey);
  const cached = await getCachedCredential(hash);
  if (cached !== undefined) {
    return cached;
  }

  let rows = await selectRows<ApiKeyRow>("api_keys", {
    key_hash_sha256: `eq.${hash}`,
    limit: 1,
    select:
      "id,account_id,key_prefix,key_hash_sha256,status,rate_limit_per_minute,monthly_hard_limit_chars,last_used_at,created_at,revoked_at",
  });

  if (!rows[0] && getApiKeyPepper()) {
    const legacyHash = makeLegacyCompatibleHash(apiKey);
    if (legacyHash !== hash) {
      rows = await selectRows<ApiKeyRow>("api_keys", {
        key_hash_sha256: `eq.${legacyHash}`,
        limit: 1,
        select:
          "id,account_id,key_prefix,key_hash_sha256,status,rate_limit_per_minute,monthly_hard_limit_chars,last_used_at,created_at,revoked_at",
      });
    }
  }

  const key = rows[0];
  if (!key) {
    await setCachedCredential(hash, null);
    return null;
  }

  const account = await getAccountById(key.account_id);
  const disabled = key.status !== "active" || !account || account.status !== "active";

  const credential: ApiCredential = {
    account_id: key.account_id,
    billing_status: "active",
    key_hash: key.key_hash_sha256,
    key_id: key.id,
    monthly_hard_limit_chars:
      key.monthly_hard_limit_chars === null
        ? null
        : Math.max(0, Math.floor(toNumber(key.monthly_hard_limit_chars, getDefaultMonthlyHardLimitChars()))),
    rate_limit_per_minute: Math.max(
      1,
      Math.floor(toNumber(key.rate_limit_per_minute, DEFAULT_RATE_LIMIT_PER_MINUTE))
    ),
    status: disabled ? "disabled" : "active",
  };

  await setCachedCredential(hash, credential);
  return credential;
}

export async function touchApiKeyLastUsed(keyId: string): Promise<void> {
  if (!isDbBillingEnabled() || !isSupabaseServiceConfigured()) {
    return;
  }

  try {
    await patchRows<ApiKeyRow>(
      "api_keys",
      {
        last_used_at: new Date().toISOString(),
      },
      {
        id: `eq.${keyId}`,
      }
    );
  } catch {
    // Non-critical update.
  }
}

export function hashApiKeyForStorage(secret: string): string {
  return makeApiKeyHash(secret);
}

export function __resetPortalStoreForTests(): void {
  redisClient = null;
}
