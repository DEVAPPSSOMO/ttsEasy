"use client";

import { useEffect, useState } from "react";
import { getHistory, clearHistory, type HistoryEntry } from "@/lib/history";

interface HistoryCopy {
  historyTitle: string;
  historyClear: string;
  historyEmpty: string;
}

interface HistoryProps {
  copy: HistoryCopy;
  onSelect: (entry: HistoryEntry) => void;
}

export function History({ copy, onSelect }: HistoryProps): JSX.Element | null {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
  }, []);

  if (entries.length === 0) return null;

  const handleClear = (): void => {
    clearHistory();
    setEntries([]);
  };

  const formatTime = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <details className="history-panel" open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
      <summary>{copy.historyTitle} ({entries.length})</summary>
      <div className="history-list">
        {entries.map((entry) => (
          <button
            className="history-item"
            key={entry.id}
            onClick={() => onSelect(entry)}
            type="button"
          >
            <span className="history-text">{entry.text}</span>
            <span className="history-meta">{entry.locale} &middot; {formatTime(entry.timestamp)}</span>
          </button>
        ))}
        <button className="history-clear" onClick={handleClear} type="button">
          {copy.historyClear}
        </button>
      </div>
    </details>
  );
}
