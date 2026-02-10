const STORAGE_KEY = "tts-history";
const MAX_ENTRIES = 20;
const MAX_TEXT_LENGTH = 100;

export interface HistoryEntry {
  id: string;
  text: string;
  locale: string;
  readerId: string;
  speed: number;
  timestamp: number;
}

function read(): HistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function write(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded — silently ignore
  }
}

export function getHistory(): HistoryEntry[] {
  return read();
}

export function addHistoryEntry(
  text: string,
  locale: string,
  readerId: string,
  speed: number
): void {
  const entries = read();
  const truncated = text.length > MAX_TEXT_LENGTH ? text.slice(0, MAX_TEXT_LENGTH) + "..." : text;
  const entry: HistoryEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: truncated,
    locale,
    readerId,
    speed,
    timestamp: Date.now(),
  };
  const updated = [entry, ...entries].slice(0, MAX_ENTRIES);
  write(updated);
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
