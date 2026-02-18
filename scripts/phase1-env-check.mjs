#!/usr/bin/env node

import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const OG_IMAGE = path.join(ROOT, "public", "og-image.png");

const variantArg = (process.argv[2] || "").trim().toLowerCase();
const variant = variantArg || (process.env.APP_VARIANT || "public").trim().toLowerCase();

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
    "GOOGLE_SITE_VERIFICATION",
    "BING_SITE_VERIFICATION",
    "NEXT_PUBLIC_ADSENSE_CLIENT",
    "NEXT_PUBLIC_ADSENSE_SLOT_TOP",
    "NEXT_PUBLIC_ADSENSE_SLOT_MID",
    "NEXT_PUBLIC_ADSENSE_SLOT_CONTENT",
    "NEXT_PUBLIC_ADSENSE_SLOT_STICKY",
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

const missingRequired = required.filter((key) => empty(process.env[key]));
const missingRecommended = recommended.filter((key) => empty(process.env[key]));
const issues = [];

if (process.env.APP_VARIANT && process.env.APP_VARIANT.trim().toLowerCase() !== variant) {
  issues.push(
    `APP_VARIANT is \"${process.env.APP_VARIANT}\" but checker was run for \"${variant}\".`
  );
}

if (!fs.existsSync(OG_IMAGE)) {
  issues.push("Missing public/og-image.png (required for OpenGraph/Twitter cards).");
}

console.log(`\nPhase 1 environment check: ${variant.toUpperCase()}\n`);

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
