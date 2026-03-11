"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccentPrompt } from "@/components/AccentPrompt";
import { AdsterraSmartLinkCard } from "@/components/AdsterraSmartLinkCard";
import { History } from "@/components/History";
import { LanguageBar } from "@/components/LanguageBar";
import { TrackedCtaLink } from "@/components/TrackedCtaLink";
import { TurnstileBox } from "@/components/TurnstileBox";
import { VideoAdGate } from "@/components/VideoAdGate";
import {
  trackApiUpsellView,
  trackEvent,
  trackTextInputStarted,
  trackAudioPlayDuration,
  trackCaptchaCompleted,
  trackLandingView,
  trackCtaGenerateClick,
  trackTtsSuccess,
  trackMp3Download,
  trackShareCreated,
  trackVideoAdTokenRejected,
  type PageType,
} from "@/lib/analytics";
import { getApiPortalHref } from "@/lib/apiPortalUrl";
import { addHistoryEntry, type HistoryEntry } from "@/lib/history";
import { getSupportedManualLocales, normalizeLocale } from "@/lib/localeHeuristics";
import { DetectLanguageResponse, ReaderId, ReaderOption, TtsSpeed } from "@/lib/types";
import { isVideoAdGateClientEnabled } from "@/lib/videoAdGate";

const SPEED_OPTIONS: TtsSpeed[] = [0.75, 1, 1.25, 1.5, 2];
const VIDEO_AD_GATE_ENABLED = isVideoAdGateClientEnabled();

function parseApiError(value: unknown): { code: string; message: string } {
  if (!value || typeof value !== "object") {
    return { code: "unexpected_error", message: "Unexpected error." };
  }
  const candidate = value as { error?: string; message?: string };
  return {
    code: candidate.error || "unexpected_error",
    message: candidate.message || candidate.error || "Unexpected error.",
  };
}

interface TtsAppProps {
  compactIntro?: boolean;
  introDescription?: string;
  introHeadingLevel?: "h1" | "h2";
  introTitle?: string;
  locale: string;
  pageType?: PageType;
  showIntro?: boolean;
  variant?: "default" | "home";
  copy: {
    accentQuestion: string;
    autoMode: string;
    charCount: string;
    detecting: string;
    disclaimer: string;
    download: string;
    generating: string;
    headline: string;
    languageSelect: string;
    manualMode: string;
    pause: string;
    play: string;
    readerSelect: string;
    speed: string;
    subtitle: string;
    textPlaceholder: string;
    detectLabel: string;
    historyTitle: string;
    historyClear: string;
    historyEmpty: string;
    mp3CalloutTitle: string;
    mp3CalloutSubtitle: string;
    mp3Ready: string;
    mp3Waiting: string;
    share: string;
    videoAd: {
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
    };
  };
  upsell?: {
    kicker: string;
    title: string;
    description: string;
    primary: string;
    secondary: string;
    note: string;
  };
}

export function TtsApp({
  compactIntro = false,
  introDescription,
  introHeadingLevel = "h2",
  introTitle,
  locale,
  pageType = "home",
  showIntro = true,
  variant = "default",
  copy,
  upsell,
}: TtsAppProps): JSX.Element {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const detectAbortRef = useRef<AbortController | null>(null);
  const detectTimerRef = useRef<NodeJS.Timeout | null>(null);
  const detectRequestRef = useRef(0);

  const [uiLocale, setUiLocale] = useState("en-US");
  const [text, setText] = useState("");
  const [detected, setDetected] = useState<DetectLanguageResponse | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [mode, setMode] = useState<"auto" | "manual">("auto");
  const [manualLocale, setManualLocale] = useState("en-US");
  const [readers, setReaders] = useState<ReaderOption[]>([]);
  const [readerId, setReaderId] = useState<ReaderId>("natural");
  const [speed, setSpeed] = useState<TtsSpeed>(1);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaWidgetKey, setCaptchaWidgetKey] = useState(0);
  const captchaStartRef = useRef<number>(Date.now());
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [historyKey, setHistoryKey] = useState(0);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [videoAdAttemptKey, setVideoAdAttemptKey] = useState(0);
  const [isAdblockBlocked, setIsAdblockBlocked] = useState(false);

  useEffect(() => {
    setUiLocale(typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US");
  }, []);

  useEffect(() => {
    trackLandingView({ locale, pageType });
  }, [locale, pageType]);

  useEffect(() => {
    if (!audioUrl || !upsell) {
      return;
    }

    trackApiUpsellView({ locale, pageType }, {
      cta_destination: getApiPortalHref("/pricing"),
      cta_variant: "tts_success_pricing",
    });
  }, [audioUrl, locale, pageType, upsell]);

  useEffect(() => {
    return () => {
      if (detectTimerRef.current) {
        clearTimeout(detectTimerRef.current);
      }
      detectAbortRef.current?.abort();
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const detectedLocale = detected?.locale ?? normalizeLocale(uiLocale);
  const effectiveLocale = mode === "manual" ? manualLocale : detectedLocale;

  const localeOptions = useMemo(() => {
    const options = new Set<string>(getSupportedManualLocales());
    options.add(detectedLocale);
    for (const candidate of detected?.localeCandidates ?? []) {
      options.add(candidate.locale);
    }
    return [...options];
  }, [detected?.localeCandidates, detectedLocale]);

  const runDetection = useCallback(
    async (nextText: string): Promise<void> => {
      const normalized = nextText.trim();
      if (!normalized) {
        detectAbortRef.current?.abort();
        setDetected(null);
        setIsDetecting(false);
        return;
      }

      detectAbortRef.current?.abort();
      const controller = new AbortController();
      detectAbortRef.current = controller;
      const requestId = ++detectRequestRef.current;
      setIsDetecting(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/language/detect", {
          body: JSON.stringify({ text: normalized, uiLocale }),
          headers: { "content-type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Detection failed (${response.status})`);
        }

        const result = (await response.json()) as DetectLanguageResponse;
        if (requestId !== detectRequestRef.current) return;

        setDetected(result);
        if (mode === "auto") {
          setManualLocale(result.locale);
        }

        trackEvent("language_detected", {
          confidence: result.languageConfidence,
          locale: result.locale,
          reason: result.reason,
        });

        if (result.localeAmbiguous) {
          trackEvent("locale_ambiguous_prompt_shown", {
            locale: result.locale,
            localeConfidence: result.localeConfidence,
          });
        }
      } catch (error) {
        if (controller.signal.aborted) return;
        setErrorMessage(error instanceof Error ? error.message : "Detection failed.");
      } finally {
        if (requestId === detectRequestRef.current) {
          setIsDetecting(false);
        }
      }
    },
    [mode, uiLocale]
  );

  const scheduleDetection = useCallback(
    (value: string, immediate = false): void => {
      if (detectTimerRef.current) {
        clearTimeout(detectTimerRef.current);
      }
      if (immediate) {
        void runDetection(value);
        return;
      }
      detectTimerRef.current = setTimeout(() => {
        void runDetection(value);
      }, 200);
    },
    [runDetection]
  );

  useEffect(() => {
    let cancelled = false;
    const loc = effectiveLocale || "en-US";

    const loadReaders = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/readers?locale=${encodeURIComponent(loc)}`);
        if (!response.ok) throw new Error(`Unable to load readers (${response.status})`);
        const payload = (await response.json()) as { readers: ReaderOption[] };
        if (cancelled) return;

        const nextReaders = payload.readers ?? [];
        setReaders(nextReaders);
        if (!nextReaders.some((r) => r.id === readerId)) {
          const defaultReader = nextReaders.find((r) => r.id === "natural") ?? nextReaders[0];
          if (defaultReader) setReaderId(defaultReader.id);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load readers.");
        }
      }
    };

    void loadReaders();
    return () => { cancelled = true; };
  }, [effectiveLocale, readerId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleTextChange = (value: string): void => {
    if (value.length > 0) trackTextInputStarted();
    setText(value);
    scheduleDetection(value, false);
  };

  const handlePaste = (): void => {
    setMode("auto");
    setErrorMessage("");
    setTimeout(() => {
      const value = textAreaRef.current?.value ?? "";
      setText(value);
      scheduleDetection(value, true);
    }, 0);
  };

  const handleModeChange = (nextMode: "auto" | "manual"): void => {
    setMode(nextMode);
    if (nextMode === "manual") {
      setManualLocale((current) => current || detectedLocale);
    }
  };

  const handleHistorySelect = (entry: HistoryEntry): void => {
    setText(entry.text);
    setMode("manual");
    setManualLocale(entry.locale);
    setReaderId(entry.readerId as ReaderId);
    setSpeed(entry.speed as TtsSpeed);
    scheduleDetection(entry.text, true);
  };

  const handleLocaleManualSelect = (loc: string): void => {
    setMode("manual");
    setManualLocale(loc);
    trackEvent("locale_manual_selected", { locale: loc });
  };

  const resetCaptchaState = useCallback((): void => {
    setCaptchaToken("");
    setCaptchaWidgetKey((current) => current + 1);
    captchaStartRef.current = Date.now();
  }, []);

  const performTtsRequest = useCallback(
    async (adGateToken?: string): Promise<void> => {
      const cleanText = text.trim();
      if (!cleanText) {
        setErrorMessage("Text is required.");
        setIsGenerating(false);
        setVideoAdAttemptKey(0);
        return;
      }

      try {
        const response = await fetch("/api/tts", {
          body: JSON.stringify({
            adGateToken,
            captchaToken,
            locale: effectiveLocale,
            localeSource: mode,
            readerId,
            speed,
            text: cleanText,
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });

        if (!response.ok) {
          const parsed = parseApiError(await response.json().catch(() => ({})));

          if (parsed.code === "adblock_detected") {
            setIsAdblockBlocked(true);
            setErrorMessage("");
            return;
          }

          if (parsed.code === "ad_gate_invalid" || parsed.code === "ad_gate_required") {
            trackVideoAdTokenRejected({ locale, pageType }, { error_code: parsed.code });
          }

          throw new Error(parsed.message);
        }

        const blob = await response.blob();
        const nextAudioUrl = URL.createObjectURL(blob);
        setAudioUrl((current) => {
          if (current) URL.revokeObjectURL(current);
          return nextAudioUrl;
        });

        if (audioRef.current) {
          audioRef.current.src = nextAudioUrl;
          audioRef.current.playbackRate = speed;
          await audioRef.current.play().catch(() => undefined);
        }

        setIsAdblockBlocked(false);
        trackTtsSuccess(
          { locale, pageType },
          {
            locale_selected: effectiveLocale,
            locale_source: mode,
            reader_id: readerId,
            speed,
          }
        );
        addHistoryEntry(cleanText, effectiveLocale, readerId, speed);
        setHistoryKey((k) => k + 1);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to generate speech.";
        setErrorMessage(message);
        trackEvent("tts_error", { message });
      } finally {
        resetCaptchaState();
        setIsGenerating(false);
        setVideoAdAttemptKey(0);
      }
    },
    [captchaToken, effectiveLocale, locale, mode, pageType, readerId, resetCaptchaState, speed, text]
  );

  const handleGenerateAudio = async (): Promise<void> => {
    const cleanText = text.trim();
    if (!cleanText) {
      setErrorMessage("Text is required.");
      return;
    }

    trackCtaGenerateClick(
      { locale, pageType },
      { locale_selected: effectiveLocale, reader_id: readerId, speed }
    );
    setIsGenerating(true);
    setErrorMessage("");

    if (VIDEO_AD_GATE_ENABLED) {
      setVideoAdAttemptKey((current) => current + 1);
      return;
    }

    await performTtsRequest();
  };

  const handlePauseResume = async (): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      await audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  };

  const handleShare = async (): Promise<void> => {
    const cleanText = text.trim();
    if (!cleanText) return;
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: cleanText.slice(0, 500), locale: effectiveLocale, readerId, speed }),
      });
      if (!res.ok) return;
      const { url } = (await res.json()) as { url: string };
      setShareUrl(url);
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }
      trackShareCreated({ locale, pageType }, { locale_selected: effectiveLocale });
    } catch {
      // silent fail
    }
  };

  const handleDownload = (): void => {
    if (!audioUrl) return;
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `tts-${effectiveLocale}.mp3`;
    link.click();
    trackMp3Download({ locale, pageType }, { locale_selected: effectiveLocale });
  };

  const requiresCaptcha = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const canGenerate =
    Boolean(text.trim()) && !isGenerating && !isAdblockBlocked && (!requiresCaptcha || Boolean(captchaToken));
  const isAudioReady = Boolean(audioUrl);
  const isHomeVariant = variant === "home";
  const resolvedIntroTitle = introTitle ?? copy.mp3CalloutTitle;
  const resolvedIntroDescription = introDescription ?? copy.subtitle;
  const IntroHeading = introHeadingLevel;
  const showIntroKicker = !compactIntro && introHeadingLevel !== "h1";
  const introClassName = compactIntro ? "workspace-intro compact" : "workspace-intro";
  const introTitleClassName = compactIntro ? "workspace-intro-title compact" : "workspace-intro-title";
  const pricingHref = getApiPortalHref("/pricing");
  const docsHref = getApiPortalHref("/docs");
  const workspaceClassName = [
    "workspace",
    showIntro ? "" : "workspace-no-intro",
    isHomeVariant ? "workspace-home" : "",
  ]
    .filter(Boolean)
    .join(" ");
  const workspaceMainClassName = isHomeVariant ? "workspace-main workspace-main-home" : "workspace-main";
  const workspaceCoreClassName = isHomeVariant ? "workspace-core workspace-core-home" : "workspace-core";
  const workspaceSupportClassName = isHomeVariant ? "workspace-support workspace-support-home" : "workspace-support";
  const audioPanel = (
    <div className="audio-panel">
      {audioUrl ? (
        <audio
          controls
          onEnded={(e) => {
            const el = e.currentTarget;
            trackAudioPlayDuration(el.currentTime, el.duration);
          }}
          onPause={(e) => {
            const el = e.currentTarget;
            if (!el.ended) trackAudioPlayDuration(el.currentTime, el.duration);
          }}
          ref={audioRef}
          src={audioUrl}
        />
      ) : (
        <audio controls ref={audioRef} />
      )}
    </div>
  );
  const speedControls = (
    <div className="speed-group player-speed">
      <span>{copy.speed}</span>
      {SPEED_OPTIONS.map((value) => (
        <button
          className={speed === value ? "active" : ""}
          key={value}
          onClick={() => setSpeed(value)}
          type="button"
        >
          {value}x
        </button>
      ))}
    </div>
  );
  const captchaNode = (
    <div className={isHomeVariant ? "workspace-inline-captcha" : "workspace-captcha-slot"}>
      <TurnstileBox
        key={captchaWidgetKey}
        onToken={(token) => {
          trackCaptchaCompleted(Date.now() - captchaStartRef.current);
          setCaptchaToken(token);
        }}
      />
    </div>
  );
  const primaryActions = (
    <>
      <button className="btn-generate" disabled={!canGenerate} onClick={() => void handleGenerateAudio()} type="button">
        {isGenerating ? copy.generating : copy.play}
      </button>
      <button
        className={isAudioReady ? "cta-download ready" : "cta-download"}
        disabled={!audioUrl}
        onClick={handleDownload}
        type="button"
      >
        {copy.download}
      </button>
    </>
  );
  const tertiaryActions = (
    <>
      <button className="secondary" disabled={!audioUrl} onClick={() => void handlePauseResume()} type="button">
        {copy.pause}
      </button>
      <button className="neutral" disabled={!audioUrl} onClick={() => void handleShare()} type="button">
        {shareUrl ? "Link copied!" : copy.share}
      </button>
    </>
  );

  return (
    <section className={workspaceClassName}>
      {showIntro ? (
        <header className={introClassName}>
          {showIntroKicker ? <p className="workspace-kicker">{copy.headline}</p> : null}
          <IntroHeading className={introTitleClassName}>{resolvedIntroTitle}</IntroHeading>
          <p>{resolvedIntroDescription}</p>
        </header>
      ) : null}

      <div className={workspaceMainClassName}>
        <div className={workspaceCoreClassName}>
          {isHomeVariant ? (
            <div className="workspace-primary-card">
              <LanguageBar
                copy={copy}
                detectedLocale={detectedLocale}
                locale={effectiveLocale}
                localeOptions={localeOptions}
                mode={mode}
                onLocaleChange={handleLocaleManualSelect}
                onModeChange={handleModeChange}
                onReaderChange={setReaderId}
                readerId={readerId}
                readers={readers}
              />

              <div className="composer-stack composer-stack-home">
                <textarea
                  className="text-input"
                  onChange={(event) => handleTextChange(event.target.value)}
                  onPaste={handlePaste}
                  placeholder={copy.textPlaceholder}
                  ref={textAreaRef}
                  value={text}
                />

                <div className="textarea-meta">
                  <span>
                    {copy.charCount}: {text.length}
                  </span>
                  {isDetecting ? <span className="detecting">{copy.detecting}</span> : null}
                </div>

                {detected?.localeAmbiguous && mode === "auto" ? (
                  <AccentPrompt
                    candidates={detected.localeCandidates}
                    copy={copy}
                    onChoose={handleLocaleManualSelect}
                  />
                ) : null}

                <div className="workspace-action-cluster">
                  <div className="controls-home">
                    <div className="controls controls-row controls-row-primary">
                      {primaryActions}
                    </div>
                    <div className="controls controls-row controls-row-secondary">
                      {tertiaryActions}
                    </div>
                  </div>
                  {captchaNode}
                </div>

                {errorMessage ? <p className="workspace-error">{errorMessage}</p> : null}

                <VideoAdGate
                  attemptKey={videoAdAttemptKey}
                  blocked={isAdblockBlocked}
                  copy={copy.videoAd}
                  locale={locale}
                  onBlocked={() => {
                    setIsAdblockBlocked(true);
                    setErrorMessage("");
                    setIsGenerating(false);
                    setVideoAdAttemptKey(0);
                  }}
                  onError={(message) => {
                    setErrorMessage(message);
                    setIsGenerating(false);
                    setVideoAdAttemptKey(0);
                  }}
                  onReady={async ({ adGateToken }) => {
                    await performTtsRequest(adGateToken);
                  }}
                  pageType={pageType}
                />
              </div>
            </div>
          ) : (
            <>
              <LanguageBar
                copy={copy}
                detectedLocale={detectedLocale}
                locale={effectiveLocale}
                localeOptions={localeOptions}
                mode={mode}
                onLocaleChange={handleLocaleManualSelect}
                onModeChange={handleModeChange}
                onReaderChange={setReaderId}
                readerId={readerId}
                readers={readers}
              />

              <div className="composer-stack">
                <textarea
                  className="text-input"
                  onChange={(event) => handleTextChange(event.target.value)}
                  onPaste={handlePaste}
                  placeholder={copy.textPlaceholder}
                  ref={textAreaRef}
                  value={text}
                />

                <div className="textarea-meta">
                  <span>
                    {copy.charCount}: {text.length}
                  </span>
                  {isDetecting ? <span className="detecting">{copy.detecting}</span> : null}
                </div>

                {detected?.localeAmbiguous && mode === "auto" ? (
                  <AccentPrompt
                    candidates={detected.localeCandidates}
                    copy={copy}
                    onChoose={handleLocaleManualSelect}
                  />
                ) : null}

                <VideoAdGate
                  attemptKey={videoAdAttemptKey}
                  blocked={isAdblockBlocked}
                  copy={copy.videoAd}
                  locale={locale}
                  onBlocked={() => {
                    setIsAdblockBlocked(true);
                    setErrorMessage("");
                    setIsGenerating(false);
                    setVideoAdAttemptKey(0);
                  }}
                  onError={(message) => {
                    setErrorMessage(message);
                    setIsGenerating(false);
                    setVideoAdAttemptKey(0);
                  }}
                  onReady={async ({ adGateToken }) => {
                    await performTtsRequest(adGateToken);
                  }}
                  pageType={pageType}
                />

                {audioPanel}
                {speedControls}
              </div>

              <div className="controls">
                {primaryActions}
                {tertiaryActions}
              </div>

              {errorMessage ? <p className="workspace-error">{errorMessage}</p> : null}
            </>
          )}

          <p className="privacy-line">{copy.disclaimer}</p>
        </div>

        <aside className={workspaceSupportClassName}>
          <div className={isAudioReady ? "mp3-callout ready workspace-status-card" : "mp3-callout workspace-status-card"}>
            <span className="mp3-pill">{copy.download}</span>
            <p>{copy.mp3CalloutSubtitle}</p>
            <strong>{isAudioReady ? copy.mp3Ready : copy.mp3Waiting}</strong>
          </div>

          {isHomeVariant ? (
            <div className="workspace-utility-card workspace-player-card">
              {audioPanel}
              {speedControls}
            </div>
          ) : null}

          {isAudioReady && upsell ? (
            <div className="workspace-upsell">
              <span className="mp3-pill">{upsell.kicker}</span>
              <h3>{upsell.title}</h3>
              <p>{upsell.description}</p>
              <div className="workspace-upsell-actions">
                <TrackedCtaLink
                  className="landing-cta"
                  ctaVariant="tts_success_pricing"
                  href={pricingHref}
                  locale={locale}
                  pageType={pageType}
                >
                  {upsell.primary}
                </TrackedCtaLink>
                <TrackedCtaLink
                  className="api-cta-secondary"
                  ctaVariant="tts_success_docs"
                  href={docsHref}
                  locale={locale}
                  pageType={pageType}
                >
                  {upsell.secondary}
                </TrackedCtaLink>
              </div>
              <p className="workspace-upsell-note">{upsell.note}</p>
            </div>
          ) : null}

          {isAudioReady ? (
            <AdsterraSmartLinkCard
              className="workspace-sponsored-slot"
              locale={locale}
              pageType={pageType}
              placementId="tts-success-inline"
            />
          ) : null}

          {isHomeVariant ? null : captchaNode}

          <History key={historyKey} copy={copy} onSelect={handleHistorySelect} />
        </aside>
      </div>
    </section>
  );
}
