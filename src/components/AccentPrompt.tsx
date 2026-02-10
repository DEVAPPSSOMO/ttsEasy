"use client";

import { getLocaleLabel } from "@/lib/localeHeuristics";
import { LocaleCandidate } from "@/lib/types";

interface AccentPromptCopy {
  accentQuestion: string;
}

interface AccentPromptProps {
  candidates: LocaleCandidate[];
  copy: AccentPromptCopy;
  onChoose: (locale: string) => void;
}

export function AccentPrompt({ candidates, copy, onChoose }: AccentPromptProps): JSX.Element | null {
  if (candidates.length < 2) {
    return null;
  }

  const primary = getLocaleLabel(candidates[0].locale);
  const secondary = getLocaleLabel(candidates[1].locale);
  const message = copy.accentQuestion
    .replace("{primary}", primary)
    .replace("{secondary}", secondary);

  return (
    <div className="accent-prompt" role="status">
      <p>{message}</p>
      <div className="accent-actions">
        {candidates.map((candidate) => (
          <button key={candidate.locale} onClick={() => onChoose(candidate.locale)} type="button">
            {getLocaleLabel(candidate.locale)}
          </button>
        ))}
      </div>
    </div>
  );
}
