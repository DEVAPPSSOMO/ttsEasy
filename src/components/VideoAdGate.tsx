"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  trackEvent,
  trackVideoAdBlocked,
  trackVideoAdCompleted,
  trackVideoAdGateStarted,
  trackVideoAdNoFill,
  trackVideoAdSkipped,
  trackVideoAdStarted,
  trackVideoAdTimeout,
  type PageType,
} from "@/lib/analytics";
import { getApiPortalHref } from "@/lib/apiPortalUrl";
import { getVideoAdGateProvider } from "@/lib/videoAdGateProvider";
import {
  VIDEO_ADBLOCK_COOKIE,
  VIDEO_AD_GATE_MAX_DURATION_MS,
  VIDEO_AD_GATE_SKIP_DELAY_SEC,
  classifyVideoAdOutcome,
  getVideoAdGateClientConfig,
  transitionVideoAdGateState,
  type VideoAdController,
  type VideoAdGateState,
  type VideoAdOutcome,
} from "@/lib/videoAdGate";

function setAdblockCookie(value: "0" | "1"): void {
  document.cookie = `${VIDEO_ADBLOCK_COOKIE}=${value}; Max-Age=${value === "1" ? 86_400 : 0}; Path=/; SameSite=Lax`;
}

function replaceTemplate(template: string, replacements: Record<string, string | number>): string {
  return Object.entries(replacements).reduce(
    (current, [key, value]) => current.replaceAll(`{${key}}`, String(value)),
    template
  );
}

function getBaitBlocked(element: HTMLDivElement | null): boolean {
  if (!element) {
    return false;
  }

  const style = window.getComputedStyle(element);
  return (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number.parseFloat(style.height || "0") === 0 ||
    element.clientHeight === 0
  );
}

function parseApiMessage(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "Unexpected error.";
  }

  const candidate = value as { error?: string; message?: string };
  return candidate.message || candidate.error || "Unexpected error.";
}

interface VideoAdGateCopy {
  blockedBody: string;
  blockedPrimary: string;
  blockedSecondary: string;
  blockedTitle: string;
  errorContinue: string;
  generating: string;
  loading: string;
  noFillContinue: string;
  playing: string;
  preparing: string;
  skipCountdown: string;
  skipNow: string;
  sponsorLabel: string;
  timeoutContinue: string;
}

interface VideoAdGateProps {
  attemptKey: number;
  blocked: boolean;
  copy: VideoAdGateCopy;
  locale: string;
  onBlocked: () => void;
  onError: (message: string) => void;
  onReady: (params: { adGateToken: string; outcome: Exclude<VideoAdOutcome, "blocked"> }) => Promise<void> | void;
  pageType: PageType;
}

export function VideoAdGate({
  attemptKey,
  blocked,
  copy,
  locale,
  onBlocked,
  onError,
  onReady,
  pageType,
}: VideoAdGateProps): JSX.Element | null {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const baitRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<VideoAdController | null>(null);
  const countdownIntervalRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const callbacksReceivedRef = useRef(false);
  const providerMountedRef = useRef(false);
  const scriptLoadFailedRef = useRef(false);
  const sessionIdRef = useRef<string | null>(null);
  const settledRef = useRef(false);

  const [gateState, setGateState] = useState<VideoAdGateState>(blocked ? "blocked_adblock" : "idle");
  const [resolvedOutcome, setResolvedOutcome] = useState<Exclude<VideoAdOutcome, "blocked"> | null>(null);
  const [skipCountdown, setSkipCountdown] = useState(VIDEO_AD_GATE_SKIP_DELAY_SEC);

  const config = useMemo(() => getVideoAdGateClientConfig(), []);
  const pricingHref = useMemo(() => getApiPortalHref("/pricing"), []);
  const docsHref = useMemo(() => getApiPortalHref("/docs"), []);
  const enabled = config.enabled && config.provider.length > 0;

  const updateState = (event: Parameters<typeof transitionVideoAdGateState>[1]): void => {
    setGateState((current) => transitionVideoAdGateState(current, event));
  };

  useEffect(() => {
    if (blocked) {
      setGateState("blocked_adblock");
      return;
    }

    if (attemptKey === 0) {
      setGateState("idle");
      setResolvedOutcome(null);
      setSkipCountdown(VIDEO_AD_GATE_SKIP_DELAY_SEC);
    }
  }, [attemptKey, blocked]);

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!enabled || blocked || attemptKey === 0 || !containerRef.current) {
      return;
    }

    let cancelled = false;
    const activeContainer = containerRef.current;

    const clearTimers = (): void => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (countdownIntervalRef.current) {
        window.clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };

    const cleanupProvider = (): void => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
      activeContainer.replaceChildren();
      clearTimers();
    };

    const finalize = async (
      providerOutcome?: Exclude<VideoAdOutcome, "blocked" | "timeout">,
      timedOut = false
    ): Promise<void> => {
      if (cancelled || settledRef.current) {
        return;
      }
      settledRef.current = true;

      const outcome = classifyVideoAdOutcome({
        baitBlocked: getBaitBlocked(baitRef.current),
        callbacksReceived: callbacksReceivedRef.current,
        providerMounted: providerMountedRef.current,
        providerOutcome,
        scriptLoadFailed: scriptLoadFailedRef.current,
        timedOut,
      });

      cleanupProvider();

      if (outcome === "blocked") {
        setAdblockCookie("1");
        trackVideoAdBlocked({ locale, pageType }, { provider: config.provider });
        updateState("blocked");
        onBlocked();
        return;
      }

      setAdblockCookie("0");
      setResolvedOutcome(outcome);
      updateState("ad_resolved");

      if (outcome === "completed") {
        trackVideoAdCompleted({ locale, pageType }, { provider: config.provider });
      } else if (outcome === "skipped") {
        trackVideoAdSkipped({ locale, pageType }, { provider: config.provider });
      } else if (outcome === "no_fill") {
        trackVideoAdNoFill({ locale, pageType }, { provider: config.provider });
      } else if (outcome === "timeout") {
        trackVideoAdTimeout({ locale, pageType }, { provider: config.provider });
      } else {
        trackEvent("video_ad_error", { locale, page_type: pageType, provider: config.provider });
      }

      try {
        const response = await fetch("/api/ads/complete", {
          body: JSON.stringify({ outcome, sessionId: sessionIdRef.current }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        if (!response.ok) {
          throw new Error(parseApiMessage(await response.json().catch(() => ({}))));
        }

        const payload = (await response.json()) as { adGateToken: string };
        updateState("tts_started");
        await onReady({ adGateToken: payload.adGateToken, outcome });
      } catch (error) {
        updateState("failed");
        onError(error instanceof Error ? error.message : "Unable to continue after the ad gate.");
      }
    };

    const start = async (): Promise<void> => {
      settledRef.current = false;
      callbacksReceivedRef.current = false;
      providerMountedRef.current = false;
      scriptLoadFailedRef.current = false;
      sessionIdRef.current = null;
      setResolvedOutcome(null);
      setSkipCountdown(VIDEO_AD_GATE_SKIP_DELAY_SEC);
      setAdblockCookie("0");
      updateState("start_session");
      trackVideoAdGateStarted({ locale, pageType }, { provider: config.provider });

      try {
        const sessionResponse = await fetch("/api/ads/session", { method: "POST" });
        if (!sessionResponse.ok) {
          throw new Error(parseApiMessage(await sessionResponse.json().catch(() => ({}))));
        }

        const session = (await sessionResponse.json()) as { sessionId: string };
        if (cancelled) {
          return;
        }

        sessionIdRef.current = session.sessionId;
        updateState("session_ready");

        let provider = null;
        try {
          provider = await getVideoAdGateProvider(config.provider, config.scriptUrl);
        } catch {
          scriptLoadFailedRef.current = true;
        }

        if (cancelled) {
          return;
        }

        if (!provider) {
          await finalize("error");
          return;
        }

        providerMountedRef.current = true;
        controllerRef.current = await provider.mount({
          container: activeContainer,
          locale,
          muted: true,
          tagUrl: config.tagUrl,
          onOutcome: (outcome) => {
            callbacksReceivedRef.current = true;
            void finalize(outcome);
          },
          onSkipAvailable: () => {
            callbacksReceivedRef.current = true;
            setSkipCountdown(0);
            updateState("skip_available");
          },
          onStart: () => {
            callbacksReceivedRef.current = true;
            setSkipCountdown(VIDEO_AD_GATE_SKIP_DELAY_SEC);
            updateState("ad_started");
            trackVideoAdStarted({ locale, pageType }, { provider: config.provider });

            if (countdownIntervalRef.current) {
              window.clearInterval(countdownIntervalRef.current);
            }
            countdownIntervalRef.current = window.setInterval(() => {
              setSkipCountdown((current) => {
                if (current <= 1) {
                  if (countdownIntervalRef.current) {
                    window.clearInterval(countdownIntervalRef.current);
                    countdownIntervalRef.current = null;
                  }
                  return 0;
                }
                return current - 1;
              });
            }, 1_000);
          },
        });

        timeoutRef.current = window.setTimeout(() => {
          void finalize(undefined, true);
        }, VIDEO_AD_GATE_MAX_DURATION_MS);
      } catch (error) {
        updateState("failed");
        onError(error instanceof Error ? error.message : "Unable to start the ad gate.");
      }
    };

    void start();

    return () => {
      cancelled = true;
      clearTimers();
      cleanupProvider();
    };
  }, [attemptKey, blocked, config.provider, config.scriptUrl, config.tagUrl, enabled, locale, onBlocked, onError, onReady, pageType]);

  if (!enabled && !blocked) {
    return null;
  }

  if (!blocked && gateState === "idle") {
    return null;
  }

  const isBlocked = blocked || gateState === "blocked_adblock";
  const statusText = (() => {
    if (isBlocked) {
      return copy.blockedBody;
    }
    if (gateState === "session_starting") {
      return copy.preparing;
    }
    if (gateState === "ad_loading") {
      return copy.loading;
    }
    if (gateState === "ad_playing" && skipCountdown > 0) {
      return replaceTemplate(copy.skipCountdown, { seconds: skipCountdown });
    }
    if (gateState === "ad_skippable") {
      return copy.playing;
    }
    if (gateState === "tts_generating") {
      if (resolvedOutcome === "no_fill") return copy.noFillContinue;
      if (resolvedOutcome === "timeout") return copy.timeoutContinue;
      if (resolvedOutcome === "error") return copy.errorContinue;
      return copy.generating;
    }
    return copy.playing;
  })();

  return (
    <section className={`video-ad-gate ${isBlocked ? "blocked" : gateState.replaceAll("_", "-")}`} aria-live="polite">
      <div className="video-ad-gate-header">
        <span className="video-ad-gate-pill">{copy.sponsorLabel}</span>
        <strong>{isBlocked ? copy.blockedTitle : copy.preparing}</strong>
      </div>

      {isBlocked ? (
        <div className="video-ad-gate-blocked">
          <p>{copy.blockedBody}</p>
          <div className="video-ad-gate-actions">
            <Link className="landing-cta" href={pricingHref}>
              {copy.blockedPrimary}
            </Link>
            <Link className="api-cta-secondary" href={docsHref}>
              {copy.blockedSecondary}
            </Link>
          </div>
        </div>
      ) : (
        <>
          <p className="video-ad-gate-status">{statusText}</p>
          <div className="video-ad-gate-frame" ref={containerRef}>
            {gateState === "session_starting" || gateState === "ad_loading" ? (
              <div className="video-ad-gate-placeholder">
                <span className="video-ad-gate-loader" />
                <strong>{copy.loading}</strong>
              </div>
            ) : null}
          </div>
          {gateState === "ad_skippable" ? (
            <button
              className="video-ad-gate-skip"
              onClick={() => controllerRef.current?.skip()}
              type="button"
            >
              {copy.skipNow}
            </button>
          ) : null}
        </>
      )}

      <div
        aria-hidden="true"
        className="video-ad-gate-bait adsbox ad-banner ad-unit ad-zone"
        ref={baitRef}
      />
    </section>
  );
}
