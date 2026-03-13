export const COMMON_REQUIRED = [
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GOOGLE_CLOUD_PROJECT_ID",
  "GOOGLE_CLOUD_CLIENT_EMAIL",
  "GOOGLE_CLOUD_PRIVATE_KEY",
  "NEXT_PUBLIC_API_BASE_URL",
];

export const VARIANT_REQUIRED = {
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

export const VARIANT_RECOMMENDED = {
  public: [
    "NEXT_PUBLIC_GA_ID",
    "GOOGLE_SITE_VERIFICATION",
    "BING_SITE_VERIFICATION",
  ],
  api: [
    "NEXT_PUBLIC_GA_ID",
    "GOOGLE_SITE_VERIFICATION",
    "BING_SITE_VERIFICATION",
    "API_BILLING_LEGACY_FALLBACK_ENABLED",
  ],
};

function empty(value) {
  return typeof value !== "string" || value.trim().length === 0;
}

function normalizeAdProvider(raw) {
  const normalized = (raw ?? "").trim().toLowerCase();
  if (normalized === "adsense" || normalized === "ethicalads") {
    return normalized;
  }
  return "none";
}

function isEnabled(value) {
  return (value ?? "").trim().toLowerCase() === "true";
}

function collectPublicMonetizationRequirements(env) {
  const issues = [];
  const required = [];

  const displayEnabled = isEnabled(env.NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED);
  if (displayEnabled) {
    const rawPrimary = env.NEXT_PUBLIC_AD_PROVIDER_PRIMARY;
    const rawLegacy = env.NEXT_PUBLIC_AD_PROVIDER;
    const rawFallback = env.NEXT_PUBLIC_AD_PROVIDER_FALLBACK;
    const primary = normalizeAdProvider(rawPrimary || rawLegacy);
    const fallback = normalizeAdProvider(rawFallback);
    const providers = [...new Set([primary, fallback])].filter((provider) => provider !== "none");

    if (providers.length === 0) {
      issues.push(
        "Configure NEXT_PUBLIC_AD_PROVIDER_PRIMARY or NEXT_PUBLIC_AD_PROVIDER_FALLBACK when NEXT_PUBLIC_PUBLIC_MONETIZATION_ENABLED=true."
      );
    }

    if (!empty(rawPrimary) && primary === "none") {
      issues.push(`Unsupported NEXT_PUBLIC_AD_PROVIDER_PRIMARY value: ${rawPrimary}.`);
    }

    if (!empty(rawFallback) && fallback === "none") {
      issues.push(`Unsupported NEXT_PUBLIC_AD_PROVIDER_FALLBACK value: ${rawFallback}.`);
    }

    for (const provider of providers) {
      if (provider === "adsense") {
        required.push("NEXT_PUBLIC_ADSENSE_CLIENT", "NEXT_PUBLIC_ADSENSE_SLOT_CONTENT");
      }
      if (provider === "ethicalads") {
        required.push("NEXT_PUBLIC_ETHICALADS_PUBLISHER");
      }
    }
  }

  const videoAdGateEnabled = isEnabled(env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED);
  if (videoAdGateEnabled) {
    required.push("NEXT_PUBLIC_VIDEO_AD_PROVIDER", "NEXT_PUBLIC_VIDEO_AD_TAG_URL", "WEB_AD_GATE_SECRET");

    const provider = (env.NEXT_PUBLIC_VIDEO_AD_PROVIDER ?? "").trim().toLowerCase();
    if (provider && provider !== "mock" && empty(env.NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL)) {
      issues.push("NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL is required for non-mock video ad providers.");
    }
  }

  return {
    issues,
    required: [...new Set(required)],
  };
}

export function buildPhase1EnvCheckResult(input) {
  const {
    env,
    envFileExists = true,
    loadedFiles = [],
    ogImageExists = true,
    selectedEnvFile = null,
    variant,
  } = input;
  const issues = [];
  const required = [...COMMON_REQUIRED, ...VARIANT_REQUIRED[variant]];
  const recommended = [...VARIANT_RECOMMENDED[variant]];

  if (env.APP_VARIANT && env.APP_VARIANT.trim().toLowerCase() !== variant) {
    issues.push(
      `APP_VARIANT is "${env.APP_VARIANT}" but checker was run for "${variant}".`
    );
  }

  if (!ogImageExists) {
    issues.push("Missing public/og-image.png (required for OpenGraph/Twitter cards).");
  }

  if (selectedEnvFile && !envFileExists) {
    issues.push(`Missing env file: ${selectedEnvFile}`);
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

  if (variant === "public") {
    const publicChecks = collectPublicMonetizationRequirements(env);
    required.push(...publicChecks.required);
    issues.push(...publicChecks.issues);
  }

  const missingRequired = [...new Set(required)].filter((key) => empty(env[key]));
  const missingRecommended = [...new Set(recommended)].filter((key) => empty(env[key]));

  return {
    issues,
    loadedFiles,
    missingRecommended,
    missingRequired,
    required,
    recommended,
  };
}
