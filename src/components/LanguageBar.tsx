"use client";

import { getLocaleLabel } from "@/lib/localeHeuristics";
import { ReaderId, ReaderOption } from "@/lib/types";

interface LanguageBarCopy {
  detectLabel: string;
  autoMode: string;
  manualMode: string;
  languageSelect: string;
  readerSelect: string;
}

interface LanguageBarProps {
  copy: LanguageBarCopy;
  detectedLocale: string;
  locale: string;
  localeOptions: string[];
  mode: "auto" | "manual";
  onLocaleChange: (locale: string) => void;
  onModeChange: (mode: "auto" | "manual") => void;
  onReaderChange: (readerId: ReaderId) => void;
  readerId: ReaderId;
  readers: ReaderOption[];
}

export function LanguageBar(props: LanguageBarProps): JSX.Element {
  const {
    copy,
    detectedLocale,
    locale,
    localeOptions,
    mode,
    onLocaleChange,
    onModeChange,
    onReaderChange,
    readerId,
    readers
  } = props;

  return (
    <div className="language-bar">
      <div className="language-chip">
        <span>{copy.detectLabel}:</span>
        <strong>{getLocaleLabel(detectedLocale)}</strong>
      </div>

      <div className="mode-switch">
        <button
          className={mode === "auto" ? "mode-btn active" : "mode-btn"}
          onClick={() => onModeChange("auto")}
          type="button"
        >
          {copy.autoMode}
        </button>
        <button
          className={mode === "manual" ? "mode-btn active" : "mode-btn"}
          onClick={() => onModeChange("manual")}
          type="button"
        >
          {copy.manualMode}
        </button>
      </div>

      <label className="field">
        <span>{copy.languageSelect}</span>
        <select
          disabled={mode !== "manual"}
          onChange={(event) => onLocaleChange(event.target.value)}
          value={locale}
        >
          {localeOptions.map((localeOption) => (
            <option key={localeOption} value={localeOption}>
              {getLocaleLabel(localeOption)}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        <span>{copy.readerSelect}</span>
        <select onChange={(event) => onReaderChange(event.target.value as ReaderId)} value={readerId}>
          {readers.map((reader) => (
            <option key={reader.id} value={reader.id}>
              {reader.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
