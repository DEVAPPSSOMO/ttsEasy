#!/usr/bin/env node
import { createHash } from "crypto";

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function hashKey(secret, pepper) {
  return createHash("sha256")
    .update(pepper ? `${pepper}:${secret}` : secret)
    .digest("hex");
}

function normalizeStatus(value) {
  return String(value || "active").toLowerCase() === "active" ? "active" : "revoked";
}

function asNumber(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
}

async function supabaseRequest({ url, key, method, path, body, headers = {} }) {
  const response = await fetch(`${url}${path}`, {
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      ...headers,
    },
    method,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
}

async function main() {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const legacyRaw = requiredEnv("API_BILLING_KEYS_JSON");
  const pepper = process.env.API_KEY_HASH_PEPPER?.trim() || "";

  const legacy = JSON.parse(legacyRaw);
  if (!Array.isArray(legacy)) {
    throw new Error("API_BILLING_KEYS_JSON must be an array");
  }

  const existingAccounts = await supabaseRequest({
    key: serviceRoleKey,
    method: "GET",
    path: "/rest/v1/accounts?select=id",
    url: supabaseUrl,
  });

  const accountIds = new Set(Array.isArray(existingAccounts) ? existingAccounts.map((row) => row.id) : []);

  const rows = [];
  let skipped = 0;

  for (const item of legacy) {
    const accountId = typeof item.account_id === "string" ? item.account_id.trim() : "";
    if (!accountId || !accountIds.has(accountId)) {
      skipped += 1;
      continue;
    }

    const keyId = typeof item.key_id === "string" ? item.key_id.trim() : "";
    const plainKey = typeof item.key === "string" ? item.key.trim() : "";
    const rawHash = typeof item.key_sha256 === "string" ? item.key_sha256.trim().toLowerCase() : "";
    const hash = rawHash || (plainKey ? hashKey(plainKey, pepper) : "");
    if (!hash) {
      skipped += 1;
      continue;
    }

    rows.push({
      account_id: accountId,
      id: keyId || undefined,
      key_hash_sha256: hash,
      key_prefix: plainKey ? plainKey.slice(0, 14) : keyId.slice(0, 14) || "legacy_key",
      monthly_hard_limit_chars: Math.floor(asNumber(item.monthly_hard_limit_chars, 100_000_000)),
      rate_limit_per_minute: Math.floor(asNumber(item.rate_limit_per_minute, 120)),
      status: normalizeStatus(item.status),
    });
  }

  if (rows.length === 0) {
    console.log(JSON.stringify({ imported: 0, skipped }, null, 2));
    return;
  }

  await supabaseRequest({
    body: rows,
    headers: {
      Prefer: "resolution=merge-duplicates,return=representation",
    },
    key: serviceRoleKey,
    method: "POST",
    path: "/rest/v1/api_keys?on_conflict=key_hash_sha256",
    url: supabaseUrl,
  });

  console.log(JSON.stringify({ imported: rows.length, skipped }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
