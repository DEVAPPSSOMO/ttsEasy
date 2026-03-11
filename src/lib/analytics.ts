declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export type PageType = "home" | "use_case" | "tool" | "blog" | "compare" | "portal" | "other";
export type SourceChannel =
  | "organic_search"
  | "paid_search"
  | "social"
  | "referral"
  | "direct"
  | "email"
  | "unknown";
export type CountryTier = "tier1" | "tier2" | "unknown";

export interface EventContext {
  locale?: string;
  pageType?: PageType;
  sourceChannel?: SourceChannel;
  countryTier?: CountryTier;
}

export function trackEvent(eventName: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params ?? {});
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: eventName, ...params });
}

function inferSourceChannel(): SourceChannel {
  if (typeof window === "undefined") return "unknown";

  const utmSource = new URL(window.location.href).searchParams.get("utm_source")?.toLowerCase();
  if (utmSource) {
    if (["google", "bing", "search", "adwords"].includes(utmSource)) return "paid_search";
    if (["youtube", "tiktok", "instagram", "facebook", "x", "linkedin"].includes(utmSource)) return "social";
    if (["newsletter", "email", "mailchimp", "brevo"].includes(utmSource)) return "email";
  }

  if (!document.referrer) return "direct";
  const ref = document.referrer.toLowerCase();
  if (ref.includes("google.") || ref.includes("bing.") || ref.includes("duckduckgo.")) return "organic_search";
  if (ref.includes("youtube.") || ref.includes("tiktok.") || ref.includes("instagram.") || ref.includes("facebook.") || ref.includes("x.com")) return "social";
  return "referral";
}

function inferCountryTier(): CountryTier {
  if (typeof Intl === "undefined") return "unknown";
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (
    tz.startsWith("America/New_York") ||
    tz.startsWith("America/Chicago") ||
    tz.startsWith("America/Denver") ||
    tz.startsWith("America/Los_Angeles") ||
    tz.startsWith("America/Toronto") ||
    tz.startsWith("Europe/London") ||
    tz.startsWith("Australia/Sydney") ||
    tz.startsWith("Australia/Melbourne")
  ) {
    return "tier1";
  }
  if (tz) return "tier2";
  return "unknown";
}

function withContext(params?: Record<string, unknown>, context?: EventContext): Record<string, unknown> {
  return {
    locale: context?.locale ?? "unknown",
    page_type: context?.pageType ?? "other",
    source_channel: context?.sourceChannel ?? inferSourceChannel(),
    country_tier: context?.countryTier ?? inferCountryTier(),
    ...(params ?? {}),
  };
}

export function trackLandingView(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("landing_view", withContext(params, context));
}

export function trackCtaGenerateClick(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("cta_generate_click", withContext(params, context));
}

export function trackTtsSuccess(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("tts_success", withContext(params, context));
}

export function trackMp3Download(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("mp3_download", withContext(params, context));
}

export function trackShareCreated(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("share_created", withContext(params, context));
}

export function trackAdSlotView(slot: string, context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("ad_slot_view", withContext({ placement_id: slot, slot, ...(params ?? {}) }, context));
}

export function trackAdSlotSuppressed(slot: string, context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("ad_slot_suppressed", withContext({ placement_id: slot, slot, ...(params ?? {}) }, context));
}

export function trackArticleCtaClick(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("article_cta_click", withContext(params, context));
}

export function trackApiUpsellView(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("api_upsell_view", withContext(params, context));
}

export function trackSponsoredBlockView(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("sponsored_block_view", withContext(params, context));
}

export function trackSmartLinkClick(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("smartlink_click", withContext(params, context));
}

export function trackSocialBarLoaded(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("social_bar_loaded", withContext(params, context));
}

export function trackSocialBarLoadFailed(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("social_bar_load_failed", withContext(params, context));
}

export function trackAffiliateClick(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("affiliate_click", withContext(params, context));
}

let textInputTracked = false;

export function trackTextInputStarted(): void {
  if (textInputTracked) return;
  textInputTracked = true;
  trackEvent("text_input_started");
}

export function trackCaptchaCompleted(durationMs: number): void {
  trackEvent("captcha_completed", { duration_ms: durationMs });
}

export function trackAudioPlayDuration(durationSec: number, totalSec: number): void {
  trackEvent("audio_play_duration", {
    listened_sec: Math.round(durationSec),
    total_sec: Math.round(totalSec),
    listened_pct: totalSec > 0 ? Math.round((durationSec / totalSec) * 100) : 0,
  });
}

export function trackScrollDepth(pct: number): void {
  trackEvent("scroll_depth", { depth_pct: pct });
}

export function trackFaqInteraction(question: string): void {
  trackEvent("faq_interaction", { question: question.slice(0, 100) });
}

export function trackVideoAdGateStarted(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_gate_started", withContext(params, context));
}

export function trackVideoAdStarted(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_started", withContext(params, context));
}

export function trackVideoAdSkipped(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_skipped", withContext(params, context));
}

export function trackVideoAdCompleted(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_completed", withContext(params, context));
}

export function trackVideoAdNoFill(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_no_fill", withContext(params, context));
}

export function trackVideoAdBlocked(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_blocked", withContext(params, context));
}

export function trackVideoAdTimeout(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_timeout", withContext(params, context));
}

export function trackVideoAdTokenRejected(context?: EventContext, params?: Record<string, unknown>): void {
  trackEvent("video_ad_token_rejected", withContext(params, context));
}
