"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AccentPrompt } from "@/components/AccentPrompt";
import { AdSlot } from "@/components/AdSlot";
import { LanguageBar } from "@/components/LanguageBar";
import { TurnstileBox } from "@/components/TurnstileBox";
import { trackEvent } from "@/lib/analytics";
import { getSupportedManualLocales, normalizeLocale } from "@/lib/localeHeuristics";
import { getUiCopy, resolveUiLanguage } from "@/lib/i18n";
import { DetectLanguageResponse, ReaderId, ReaderOption, TtsSpeed } from "@/lib/types";

const SPEED_OPTIONS: TtsSpeed[] = [0.75, 1, 1.25, 1.5, 2];

function parseApiError(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "Unexpected error.";
  }
  const candidate = value as { error?: string; message?: string };
  return candidate.message || candidate.error || "Unexpected error.";
}

export default function HomePage(): JSX.Element {
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const uiLanguage = resolveUiLanguage(uiLocale);
  const copy = getUiCopy(uiLanguage);

  useEffect(() => {
    setUiLocale(typeof navigator === "undefined" ? "en-US" : navigator.language || "en-US");
  }, []);

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
          body: JSON.stringify({
            text: normalized,
            uiLocale
          }),
          headers: {
            "content-type": "application/json"
          },
          method: "POST",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Detection failed (${response.status})`);
        }

        const result = (await response.json()) as DetectLanguageResponse;
        if (requestId !== detectRequestRef.current) {
          return;
        }

        setDetected(result);
        if (mode === "auto") {
          setManualLocale(result.locale);
        }

        trackEvent("language_detected", {
          confidence: result.languageConfidence,
          locale: result.locale,
          reason: result.reason
        });

        if (result.localeAmbiguous) {
          trackEvent("locale_ambiguous_prompt_shown", {
            locale: result.locale,
            localeConfidence: result.localeConfidence
          });
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
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
    const locale = effectiveLocale || "en-US";

    const loadReaders = async (): Promise<void> => {
      try {
        const response = await fetch(`/api/readers?locale=${encodeURIComponent(locale)}`);
        if (!response.ok) {
          throw new Error(`Unable to load readers (${response.status})`);
        }
        const payload = (await response.json()) as { readers: ReaderOption[] };
        if (cancelled) {
          return;
        }

        const nextReaders = payload.readers ?? [];
        setReaders(nextReaders);
        if (!nextReaders.some((reader) => reader.id === readerId)) {
          const defaultReader = nextReaders.find((reader) => reader.id === "natural") ?? nextReaders[0];
          if (defaultReader) {
            setReaderId(defaultReader.id);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Could not load readers.");
        }
      }
    };

    void loadReaders();
    return () => {
      cancelled = true;
    };
  }, [effectiveLocale, readerId]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  const handleTextChange = (value: string): void => {
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

  const handleLocaleManualSelect = (locale: string): void => {
    setMode("manual");
    setManualLocale(locale);
    trackEvent("locale_manual_selected", { locale });
  };

  const handleGenerateAudio = async (): Promise<void> => {
    const cleanText = text.trim();
    if (!cleanText) {
      setErrorMessage("Text is required.");
      return;
    }

    setIsGenerating(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/tts", {
        body: JSON.stringify({
          captchaToken,
          locale: effectiveLocale,
          localeSource: mode,
          readerId,
          speed,
          text: cleanText
        }),
        headers: {
          "content-type": "application/json"
        },
        method: "POST"
      });

      if (!response.ok) {
        const error = parseApiError(await response.json().catch(() => ({})));
        throw new Error(error);
      }

      const blob = await response.blob();
      const nextAudioUrl = URL.createObjectURL(blob);
      setAudioUrl((current) => {
        if (current) {
          URL.revokeObjectURL(current);
        }
        return nextAudioUrl;
      });

      if (audioRef.current) {
        audioRef.current.src = nextAudioUrl;
        audioRef.current.playbackRate = speed;
        await audioRef.current.play().catch(() => undefined);
      }

      trackEvent("tts_success", {
        locale: effectiveLocale,
        localeSource: mode,
        readerId,
        speed
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to generate speech.";
      setErrorMessage(message);
      trackEvent("tts_error", { message });
    } finally {
      // Turnstile tokens are single-use; remount the widget so the next generation gets a fresh token.
      setCaptchaToken("");
      setCaptchaWidgetKey((current) => current + 1);
      setIsGenerating(false);
    }
  };

  const handlePauseResume = async (): Promise<void> => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (audio.paused) {
      await audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  };

  const handleDownload = (): void => {
    if (!audioUrl) {
      return;
    }
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `tts-${effectiveLocale}.mp3`;
    link.click();
    trackEvent("mp3_download", { locale: effectiveLocale });
  };

  const requiresCaptcha = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const canGenerate =
    Boolean(text.trim()) &&
    !isGenerating &&
    (!requiresCaptcha || Boolean(captchaToken));

  return (
    <main className="page-shell">
      <div className="hero">
        <h1>{copy.headline}</h1>
        <p>{copy.subtitle}</p>
      </div>

      <AdSlot slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOP} />

      <section className="workspace">
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

        <div className="controls">
          <button disabled={!canGenerate} onClick={() => void handleGenerateAudio()} type="button">
            {isGenerating ? copy.generating : copy.play}
          </button>
          <button className="secondary" disabled={!audioUrl} onClick={() => void handlePauseResume()} type="button">
            {copy.pause}
          </button>
          <button className="neutral" disabled={!audioUrl} onClick={handleDownload} type="button">
            {copy.download}
          </button>
          <div className="speed-group">
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
        </div>

        <TurnstileBox key={captchaWidgetKey} onToken={setCaptchaToken} />

        {errorMessage ? <p style={{ color: "#b91c1c" }}>{errorMessage}</p> : null}

        <div className="audio-panel">{audioUrl ? <audio controls ref={audioRef} src={audioUrl} /> : <audio controls ref={audioRef} />}</div>

        <p className="privacy-line">{copy.disclaimer}</p>

        <AdSlot className="ad-grid" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_MID} />
      </section>

      <AdSlot className="ad-sticky-mobile" slot={process.env.NEXT_PUBLIC_ADSENSE_SLOT_STICKY} />

      <nav className="legal-links">
        <Link href="/privacy">{copy.privacy}</Link>
        <Link href="/terms">{copy.terms}</Link>
        <Link href="/cookies">{copy.cookies}</Link>
        <Link href="/about">About</Link>
      </nav>
    </main>
  );
}
