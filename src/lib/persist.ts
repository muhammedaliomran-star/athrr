import type { FoundFile } from "@/lib/recovery-data";

const SESSION_KEY = "athar:session";
const HISTORY_KEY = "athar:history";
const SETTINGS_KEY = "athar:settings";
const CRASH_KEY = "athar:crashes";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* التخزين ممتلئ أو محظور */
  }
}

export type SavedSession = {
  step: number;
  driveId: string;
  target: "image" | "video" | "both";
  files: FoundFile[];
  selected: string[];
  destination: string;
};

export const loadSession = () => read<SavedSession | null>(SESSION_KEY, null);
export const saveSession = (s: SavedSession) => write(SESSION_KEY, s);
export const clearSession = () => {
  if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY);
};

export type HistoryEntry = {
  id: string;
  at: string;
  driveName: string;
  count: number;
  totalMb: number;
  destination: string;
  failed: number;
};

export const loadHistory = () => read<HistoryEntry[]>(HISTORY_KEY, []);
export function addHistory(entry: HistoryEntry) {
  const next = [entry, ...loadHistory()].slice(0, 100);
  write(HISTORY_KEY, next);
  return next;
}
export const clearHistory = () => write(HISTORY_KEY, []);

export type Settings = {
  theme: "light" | "dark" | "system";
  scanDepth: "quick" | "deep";
  skipCorrupt: boolean;
  confirmBeforeRecover: boolean;
  keepFolderStructure: boolean;
  defaultDestination: string;
  crashReports: boolean;
};

export const defaultSettings: Settings = {
  theme: "system",
  scanDepth: "quick",
  skipCorrupt: false,
  confirmBeforeRecover: true,
  keepFolderStructure: false,
  defaultDestination: "",
  crashReports: true,
};

export const loadSettings = (): Settings => ({
  ...defaultSettings,
  ...read<Partial<Settings>>(SETTINGS_KEY, {}),
});
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

export type CrashEntry = { at: string; message: string; stack?: string };
export const loadCrashes = () => read<CrashEntry[]>(CRASH_KEY, []);
export function addCrash(entry: CrashEntry) {
  if (!loadSettings().crashReports) return;
  write(CRASH_KEY, [entry, ...loadCrashes()].slice(0, 50));
}
export const clearCrashes = () => write(CRASH_KEY, []);
