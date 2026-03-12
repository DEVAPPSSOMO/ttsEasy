import { isPublicMonetizationEnabled } from "@/lib/monetization";

export const VIDEO_AD_GATE_SESSION_TTL_MS = 5 * 60_000;
export const VIDEO_AD_GATE_TOKEN_TTL_MS = 2 * 60_000;
export const VIDEO_AD_GATE_MAX_DURATION_MS = 12_000;
export const VIDEO_AD_GATE_SKIP_DELAY_SEC = 5;
export const VIDEO_ADBLOCK_COOKIE = "tts_web_adblock";

export type VideoAdOutcome = "completed" | "skipped" | "no_fill" | "timeout" | "blocked" | "error";
export type VideoAdGateState =
  | "idle"
  | "session_starting"
  | "ad_loading"
  | "ad_playing"
  | "ad_skippable"
  | "tts_generating"
  | "blocked_adblock"
  | "error";

export type VideoAdGateEvent =
  | "start_session"
  | "session_ready"
  | "ad_started"
  | "skip_available"
  | "ad_resolved"
  | "blocked"
  | "tts_started"
  | "failed"
  | "reset";

export interface VideoAdMountOptions {
  container: HTMLDivElement;
  locale: string;
  muted: boolean;
  tagUrl?: string;
  onOutcome: (outcome: Exclude<VideoAdOutcome, "blocked" | "timeout">) => void;
  onSkipAvailable: () => void;
  onStart: () => void;
}

export interface VideoAdController {
  destroy: () => void;
  skip: () => void;
}

export interface VideoAdGateProvider {
  mount: (options: VideoAdMountOptions) => Promise<VideoAdController> | VideoAdController;
}

export interface AdGateSession {
  createdAt: number;
  expiresAt: number;
  id: string;
  ipHash: string;
  outcome?: Exclude<VideoAdOutcome, "blocked">;
  provider: string;
  status: "created" | "completed";
  tokenId?: string | null;
  userAgentHash: string;
}

export interface VideoAdOutcomeSignals {
  baitBlocked: boolean;
  callbacksReceived: boolean;
  providerMounted: boolean;
  providerOutcome?: Exclude<VideoAdOutcome, "blocked" | "timeout"> | null;
  scriptLoadFailed: boolean;
  timedOut: boolean;
}

export interface VideoAdGateClientConfig {
  enabled: boolean;
  provider: string;
  scriptUrl: string;
  tagUrl: string;
}

export function getVideoAdGateClientConfig(): VideoAdGateClientConfig {
  const monetizationEnabled = isPublicMonetizationEnabled();
  return {
    enabled:
      monetizationEnabled &&
      (process.env.NEXT_PUBLIC_VIDEO_AD_GATE_ENABLED ?? "").trim().toLowerCase() === "true",
    provider: (process.env.NEXT_PUBLIC_VIDEO_AD_PROVIDER ?? "").trim(),
    scriptUrl: (process.env.NEXT_PUBLIC_VIDEO_AD_SCRIPT_URL ?? "").trim(),
    tagUrl: (process.env.NEXT_PUBLIC_VIDEO_AD_TAG_URL ?? "").trim(),
  };
}

export function isVideoAdGateClientEnabled(): boolean {
  const config = getVideoAdGateClientConfig();
  return config.enabled && config.provider.length > 0;
}

export function classifyVideoAdOutcome(signals: VideoAdOutcomeSignals): VideoAdOutcome {
  if (signals.providerOutcome) {
    return signals.providerOutcome;
  }

  if (
    signals.baitBlocked &&
    (signals.scriptLoadFailed || (!signals.providerMounted && !signals.callbacksReceived) || signals.timedOut)
  ) {
    return "blocked";
  }

  if (signals.timedOut) {
    return "timeout";
  }

  return "error";
}

export function transitionVideoAdGateState(
  current: VideoAdGateState,
  event: VideoAdGateEvent
): VideoAdGateState {
  if (event === "reset") {
    return "idle";
  }

  if (event === "blocked") {
    return "blocked_adblock";
  }

  if (event === "failed") {
    return "error";
  }

  if (event === "tts_started") {
    return "tts_generating";
  }

  switch (current) {
    case "idle":
      return event === "start_session" ? "session_starting" : current;
    case "session_starting":
      if (event === "session_ready") return "ad_loading";
      if (event === "ad_resolved") return "tts_generating";
      return current;
    case "ad_loading":
      if (event === "ad_started") return "ad_playing";
      if (event === "ad_resolved") return "tts_generating";
      return current;
    case "ad_playing":
      if (event === "skip_available") return "ad_skippable";
      if (event === "ad_resolved") return "tts_generating";
      return current;
    case "ad_skippable":
      if (event === "ad_resolved") return "tts_generating";
      return current;
    case "tts_generating":
    case "blocked_adblock":
    case "error":
      return current;
  }
}
