import { storeSchema, emptyStore, STORAGE_VERSION, type Store } from "./schemas";

const KEY = "carbonwise:v1";

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

/** Migrate older shapes forward. */
function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return emptyStore;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== "number") {
    return { ...emptyStore, ...obj, version: STORAGE_VERSION };
  }
  return obj;
}

export function loadStore(): Store {
  if (!isBrowser()) return emptyStore;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore;
    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    const result = storeSchema.safeParse(migrated);
    if (!result.success) {
      // Corruption recovery: snapshot the bad payload, reset to empty.
      try { localStorage.setItem(`${KEY}:corrupt:${Date.now()}`, raw); } catch {}
      return emptyStore;
    }
    return result.data;
  } catch {
    return emptyStore;
  }
}

export function saveStore(store: Store): void {
  if (!isBrowser()) return;
  const validated = storeSchema.parse(store);
  localStorage.setItem(KEY, JSON.stringify(validated));
}

export function updateStore(updater: (s: Store) => Store): Store {
  const next = updater(loadStore());
  saveStore(next);
  return next;
}

export function clearStore(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(KEY);
}

/* Session-only ephemeral state */
const SESSION_PREFIX = "carbonwise:session:";
export const session = {
  get<T>(key: string): T | null {
    if (typeof sessionStorage === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(SESSION_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch { return null; }
  },
  set<T>(key: string, value: T): void {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.setItem(SESSION_PREFIX + key, JSON.stringify(value));
  },
  remove(key: string): void {
    if (typeof sessionStorage === "undefined") return;
    sessionStorage.removeItem(SESSION_PREFIX + key);
  },
};

export function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
