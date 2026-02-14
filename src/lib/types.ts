export type ReaderId = "claro" | "natural" | "expresivo";
export type ReaderTier = "standard" | "neural2" | "wavenet";
export type LocaleSource = "auto" | "manual";
export type TtsSpeed = 0.75 | 1 | 1.25 | 1.5 | 2;

export interface LocaleCandidate {
  locale: string;
  confidence: number;
}

export interface DetectLanguageRequest {
  text: string;
  uiLocale?: string;
}

export interface DetectLanguageResponse {
  language: string;
  locale: string;
  languageConfidence: number;
  localeConfidence: number;
  localeAmbiguous: boolean;
  localeCandidates: LocaleCandidate[];
  reason: "detected" | "browser_fallback";
}

export interface ReaderOption {
  id: ReaderId;
  label: string;
  provider: "google";
  voiceName: string;
  lang: string;
  tier: ReaderTier;
}

export interface TtsRequest {
  text: string;
  locale: string;
  localeSource: LocaleSource;
  readerId: ReaderId;
  speed: TtsSpeed;
  captchaToken: string;
}

export interface ApiTtsRequest {
  text: string;
  locale: string;
  readerId: ReaderId;
  speed: TtsSpeed;
  format?: "mp3";
}

export interface UsageEvent {
  request_id: string;
  account_id: string;
  key_id: string;
  idempotency_key: string | null;
  chars: number;
  billable_chars: number;
  trial_chars_applied: number;
  charge_usd: number;
  charge_eur?: number;
  charge_micros?: number;
  currency?: "USD" | "EUR";
  price_tier_usd_per_million: number;
  price_tier_eur_per_million?: number;
  locale: string;
  voice_tier: ReaderTier;
  timestamp_utc: string;
}

export interface BillingDailySummary {
  day_utc: string;
  chars: number;
  billable_chars: number;
  trial_chars_applied: number;
  charge_usd: number;
  requests: number;
}

export interface BillingSummary {
  account_id: string;
  month_utc: string;
  currency: "USD";
  chars: number;
  billable_chars: number;
  trial_chars_applied: number;
  charge_usd: number;
  invoice_minimum_usd: number;
  invoice_total_usd: number;
  requests: number;
  daily: BillingDailySummary[];
  collection_attempts_utc: string[];
}

export type WalletTransactionType =
  | "topup_credit"
  | "usage_debit"
  | "refund_debit"
  | "auto_topup_credit"
  | "adjustment";

export type AutoRechargeStatus = "disabled" | "active" | "failed";

export interface AutoRechargeConfig {
  enabled: boolean;
  trigger_eur: number;
  amount_eur: number;
  status: AutoRechargeStatus;
  payment_method_id: string | null;
  last_error: string | null;
  updated_at: string | null;
}

export interface WalletBalance {
  account_id: string;
  currency: "EUR";
  balance_micros: number;
  balance_eur: number;
  auto_recharge: AutoRechargeConfig;
  last_topup_at: string | null;
}

export interface WalletTransaction {
  tx_id: string;
  account_id: string;
  type: WalletTransactionType;
  amount_micros: number;
  amount_eur: number;
  currency: "EUR";
  source: string;
  request_id: string | null;
  stripe_ref: string | null;
  created_at: string;
  meta: Record<string, unknown> | null;
}

export interface TopupSessionRequest {
  pack_id?: "pack_5" | "pack_10" | "pack_25" | "pack_50";
  amount_eur?: number;
  success_url: string;
  cancel_url: string;
  save_payment_method?: boolean;
}

export interface TopupSessionResponse {
  checkout_session_id: string;
  checkout_url: string;
  expires_at: number | null;
  amount_eur: number;
  currency: "EUR";
}

export interface WalletTransactionsPage {
  transactions: WalletTransaction[];
  next_cursor: string | null;
}

export interface PortalUser {
  id: string;
  email: string | null;
}

export interface PortalAccount {
  id: string;
  owner_user_id: string;
  slug: string;
  status: "active" | "disabled";
  created_at: string;
  updated_at: string;
}

export interface PortalApiKey {
  id: string;
  account_id: string;
  key_prefix: string;
  status: "active" | "revoked";
  rate_limit_per_minute: number;
  monthly_hard_limit_chars: number | null;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

export interface PortalApiKeyCreateResponse {
  api_key: string;
  key: PortalApiKey;
}

export interface PortalWalletSummary {
  account: PortalAccount;
  wallet: WalletBalance;
}
