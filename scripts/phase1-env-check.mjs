#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { loadEnvFiles, resolveEnvFile } from "./envFiles.mjs";

const ROOT = process.cwd();
const OG_IMAGE = path.join(ROOT, "public", "og-image.png");

const variantArg = (process.argv[2] || "").trim().toLowerCase();
const envFileArg = (process.argv[3] || "").trim();
const { env, loadedFiles } = loadEnvFiles({
  cwd: ROOT,
  extraFiles: envFileArg ? [envFileArg] : [],
});
const variant = variantArg || (env.APP_VARIANT || "public").trim().toLowerCase();

if (!["public", "api"].includes(variant)) {
  console.error(`Unsupported variant: ${variant || "(empty)"}. Use \"public\" or \"api\".`);
  process.exit(2);
}

const commonRequired = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GOOGLE_CLOUD_PROJECT_ID",
  "GOOGLE_CLOUD_CLIENT_EMAIL",
  "GOOGLE_CLOUD_PRIVATE_KEY",
  "NEXT_PUBLIC_API_BASE_URL",
];

const variantRequired = {
  public: [
    "APP_VARIANT",
    "NEXT_PUBLIC_SITE_URL",
    "TURNSTILE_SECRET_KEY",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
  ],
  api: [
    "APP_VARIANT",
    "NEXT_PUBLIC_SITE_URL",
    "API_BILLING_PREPAID_ENABLED",
    "API_BILLING_DB_ENABLED",
    "API_KEY_HASH_PEPPER",
    "SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "STRIPE_ACCOUNT_COUNTRY",
  ],
};

const variantRecommended = {
  public: [
    "NEXT_PUBLIC_GA_ID",
    "NEXT_PUBLIC_AD_PROVIDER_PRIMARY",
    "NEXT_PUBLIC_AD_PROVIDER_ACTIVE",
    "GOOGLE_SITE_VERIFICATION",
    "BING_SITE_VERIFICATION",
    "NEXT_PUBLIC_ADSENSE_CLIENT",
    "NEXT_PUBLIC_ADSENSE_SLOT_TOP",
    "NEXT_PUBLIC_ADSENSE_SLOT_MID",
    "NEXT_PUBLIC_ADSENSE_SLOT_CONTENT",
    "NEXT_PUBLIC_ADSENSE_SLOT_STICKY",
    "NEXT_PUBLIC_ADSTERRA_SMARTLINK_URL",
    "ADSTERRA_SOCIAL_BAR_SNIPPET",
    "NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED",
    "NEXT_PUBLIC_VIDEO_AD_PROVIDER",
    "NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL",
    "NEXT_PUBLIC_VIDEO_AD_TAG_URL",
    "WEB_AD_GATE_SECRET",
  ],
  api: [
    "NEXT_PUBLIC_GA_ID",
    "GOOGLE_SITE_VERIFICATION",
    "BING_SITE_VERIFICATION",
    "API_BILLING_LEGACY_FALLBACK_ENABLED",
  ],
};

const empty = (value) => typeof value !== "string" || value.trim().length === 0;

const required = [...commonRequired, ...variantRequired[variant]];
const recommended = variantRecommended[variant];

const missingRequired = required.filter((key) => empty(env[key]));
const missingRecommended = recommended.filter((key) => empty(env[key]));
const issues = [];
const selectedEnvFile = envFileArg ? resolveEnvFile(ROOT, envFileArg) : null;

if (env.APP_VARIANT && env.APP_VARIANT.trim().toLowerCase() !== variant) {
  issues.push(
    `APP_VARIANT is \"${env.APP_VARIANT}\" but checker was run for \"${variant}\".`
  );
}

if (!fs.existsSync(OG_IMAGE)) {
  issues.push("Missing public/og-image.png (required for OpenGraph/Twitter cards).");
}

if (selectedEnvFile) {
  const selected = loadedFiles.find((entry) => entry.path === selectedEnvFile);
  if (!selected?.exists) {
    issues.push(`Missing env file: ${path.relative(ROOT, selectedEnvFile)}`);
  }
}

const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim() || "";
const apiBaseUrl = env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";
if (variant === "api" && siteUrl && apiBaseUrl && siteUrl !== apiBaseUrl) {
  issues.push("NEXT_PUBLIC_SITE_URL and NEXT_PUBLIC_API_BASE_URL should match for the API variant.");
}

const port = env.PORT?.trim() || "";
if (port && siteUrl.startsWith("http://localhost:")) {
  const expected = `http://localhost:${port}`;
  if (siteUrl !== expected) {
    issues.push(`NEXT_PUBLIC_SITE_URL should match PORT (${expected}).`);
  }
}
if (port && apiBaseUrl.startsWith("http://localhost:")) {
  const expected = `http://localhost:${port}`;
  if (apiBaseUrl !== expected) {
    issues.push(`NEXT_PUBLIC_API_BASE_URL should match PORT (${expected}).`);
  }
}

const videoAdGateEnabled = (env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED ?? "").trim().toLowerCase() === "true";
if (variant === "public" && videoAdGateEnabled) {
  const requiredVideoGateKeys = ["NEXT_PUBLIC_VIDEO_AD_PROVIDER", "NEXT_PUBLIC_VIDEO_AD_TAG_URL", "WEB_AD_GATE_SECRET"];
  for (const key of requiredVideoGateKeys) {
    if (empty(env[key])) {
      issues.push(`${key} is required when NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED=true.`);
    }
  }

  const provider = (env.NEXT_PUBLIC_VIDEO_AD_PROVIDER ?? "").trim().toLowerCase();
  if (provider && provider !== "mock" && empty(env.NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL)) {
    issues.push("NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL is required for non-mock video ad providers.");
  }
}

console.log(`\nPhase 1 environment check: ${variant.toUpperCase()}\n`);
console.log("Loaded env files:");
for (const source of loadedFiles) {
  console.log(`- ${path.relative(ROOT, source.path)}: ${source.exists ? "loaded" : "missing"}`);
}
console.log("");

if (missingRequired.length === 0) {
  console.log("Required vars: OK");
} else {
  console.log("Required vars: MISSING");
  for (const key of missingRequired) {
    console.log(`- ${key}`);
  }
}

if (missingRecommended.length === 0) {
  console.log("Recommended vars: OK");
} else {
  console.log("Recommended vars: missing (non-blocking)");
  for (const key of missingRecommended) {
    console.log(`- ${key}`);
  }
}

if (issues.length > 0) {
  console.log("Additional checks:");
  for (const issue of issues) {
    console.log(`- ${issue}`);
  }
}

if (missingRequired.length > 0 || issues.length > 0) {
  process.exit(1);
}

console.log("\nPhase 1 check passed. Ready for deployment.");
