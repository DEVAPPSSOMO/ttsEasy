"use client";

import { useState } from "react";

interface LanguageDetectorProps {
  ctaText: string;
  ctaHref: string;
}

interface DetectResult {
  locale: string;
  languageConfidence: string;
  localeConfidence: string;
  reason: string;
}

export function LanguageDetector({ ctaText, ctaHref }: LanguageDetectorProps): JSX.Element {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DetectResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDetect = async (): Promise<void> => {
    const clean = text.trim();
    if (!clean) return;
    setLoading(true);
    try {
      const res = await fetch("/api/language/detect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: clean, uiLocale: "en-US" }),
      });
      if (res.ok) {
        const data = (await res.json()) as DetectResult;
        setResult(data);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-workspace">
      <textarea
        className="text-input"
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text to detect its language..."
        value={text}
        style={{ minHeight: "200px" }}
      />
      <button
        className="landing-cta"
        disabled={!text.trim() || loading}
        onClick={() => void handleDetect()}
        type="button"
        style={{ marginTop: "1rem" }}
      >
        {loading ? "Detecting..." : "Detect Language"}
      </button>
      {result && (
        <div className="detect-result">
          <div className="stat"><span className="stat-value">{result.locale}</span><span className="stat-label">Detected Locale</span></div>
          <div className="stat"><span className="stat-value">{result.languageConfidence}</span><span className="stat-label">Confidence</span></div>
          <div className="stat"><span className="stat-value">{result.reason}</span><span className="stat-label">Method</span></div>
        </div>
      )}
      {result && (
        <a href={ctaHref} className="landing-cta" style={{ display: "inline-block", marginTop: "1.5rem", textDecoration: "none", padding: "0.8rem 2rem" }}>
          {ctaText}
        </a>
      )}
    </div>
  );
}
