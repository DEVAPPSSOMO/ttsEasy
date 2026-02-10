declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
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
