import { SessionSummary } from "../types";

// Fallback in-memory storage for when the native AsyncStorage module is not built into the binary.
const memoryStorage: Record<string, string> = {};
const MockAsyncStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return memoryStorage[key] ?? null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    memoryStorage[key] = value;
  },
  removeItem: async (key: string): Promise<void> => {
    delete memoryStorage[key];
  },
  clear: async (): Promise<void> => {
    for (const key in memoryStorage) {
      delete memoryStorage[key];
    }
  }
};

interface AsyncStorageInterface {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

let AsyncStorage: AsyncStorageInterface = MockAsyncStorage;
try {
  // Use require dynamically so we can catch top-level native loading failures
  const AsyncStorageModule = require("@react-native-async-storage/async-storage");
  const nativeStorage = AsyncStorageModule.default || AsyncStorageModule;
  if (nativeStorage) {
    AsyncStorage = nativeStorage;
  }
} catch (e) {
  console.warn("AsyncStorage native module not available, using in-memory fallback:", e);
}

const HISTORY_KEY = "drivewise_session_history";
const LAST_SESSION_KEY = "drivewise_last_session";

export interface HistoryEntry {
  summary: SessionSummary;
  startedAt: number; // epoch ms
}

// In-memory cache — populated on first load
let cache: HistoryEntry[] | null = null;

// Module-level last session
let lastSessionSummary: SessionSummary | null = null;
let lastSessionLoaded = false;

export async function setLastSessionSummary(summary: SessionSummary): Promise<void> {
  lastSessionSummary = summary;
  try {
    await AsyncStorage.setItem(LAST_SESSION_KEY, JSON.stringify(summary));
  } catch (e) {
    console.error("Failed to save last session summary:", e);
  }
}

export async function getLastSessionSummary(): Promise<SessionSummary | null> {
  if (lastSessionSummary !== null) return lastSessionSummary;
  if (lastSessionLoaded) return null;
  try {
    const raw = await AsyncStorage.getItem(LAST_SESSION_KEY);
    lastSessionSummary = raw ? (JSON.parse(raw) as SessionSummary) : null;
    lastSessionLoaded = true;
  } catch (e) {
    console.error("Failed to load last session summary:", e);
    lastSessionSummary = null;
  }
  return lastSessionSummary;
}

export async function loadHistory(): Promise<HistoryEntry[]> {
  if (cache !== null) return cache;
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    cache = raw ? (JSON.parse(raw) as HistoryEntry[]) : [];
  } catch (e) {
    console.error("Failed to load history:", e);
    cache = [];
  }
  return cache;
}

/** Force the next loadHistory() call to re-read from AsyncStorage. */
export function invalidateCache(): void {
  cache = null;
  lastSessionLoaded = false;
}

export async function addSessionToHistory(
  summary: SessionSummary,
  startedAt: number
): Promise<void> {
  const history = await loadHistory();
  const entry: HistoryEntry = { summary, startedAt };
  // Prepend so newest drives appear first
  cache = [entry, ...history];
  try {
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(cache));
  } catch (e) {
    console.error("Failed to save history:", e);
  }
}
