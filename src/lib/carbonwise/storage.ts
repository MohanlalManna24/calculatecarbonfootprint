import { storeSchema, emptyStore, STORAGE_VERSION, type Store } from "./schemas";

const KEY = "carbonwise:v1";
// Prefix for session storage keys to avoid collisions with other apps
const SESSION_PREFIX = "carbonwise_session:";

/**
 * Detects if code is running in a browser environment with localStorage support.
 * @returns Boolean indicating browser environment
 */
const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

/**
 * Migrates store data from older versions to current format.
 * Handles missing version field and ensures compatibility with schema.
 *
 * @param raw - Raw data from storage (may be any type)
 * @returns Migrated object with version field set correctly
 * @example
 * const migrated = migrate({ profile: null, entries: [] });
 * // { version: 1, profile: null, entries: [], ... }
 */
function migrate(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return emptyStore;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.version !== "number") {
    return { ...emptyStore, ...obj, version: STORAGE_VERSION };
  }
  return obj;
}

/**
 * Loads store from localStorage with validation and automatic corruption recovery.
 * Automatically migrates old data versions and validates against current schema.
 * If data is corrupted, saves a timestamped backup and returns empty store.
 *
 * @returns Valid Store object or empty default if loading/validation fails
 * @throws Does not throw; handles all errors gracefully
 * @example
 * const store = loadStore(); // Always returns a valid Store
 */
export function loadStore(): Store {
  if (!isBrowser()) return emptyStore;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyStore;

    // Validate store size to prevent memory issues
    if (raw.length > 1_000_000) {
      console.warn("[loadStore] Store exceeds size limit, resetting");
      return emptyStore;
    }

    const parsed = JSON.parse(raw);
    const migrated = migrate(parsed);
    const result = storeSchema.safeParse(migrated);
    if (!result.success) {
      // Corruption recovery: snapshot the bad payload, reset to empty.
      try {
        localStorage.setItem(`${KEY}:corrupt:${Date.now()}`, raw);
      } catch (e) {
        console.error("[loadStore] Failed to backup corrupted data:", e);
      }
      return emptyStore;
    }
    return result.data;
  } catch (error) {
    // Log detailed error for debugging
    console.error("[loadStore] Error:", error instanceof Error ? error.message : "Unknown error");
    return emptyStore;
  }
}

/**
 * Saves store to localStorage after validation.
 * Validates data against schema before persisting to catch errors early.
 * Throws error if validation or save fails (caller responsibility to handle).
 *
 * @param store - Store object to persist (will be validated against storeSchema)
 * @throws Error if store validation fails or localStorage is unavailable/full (QuotaExceededError, ValidationError)
 * @example
 * try {
 *   saveStore(store);
 * } catch (error) {
 *   if (error instanceof DOMException && error.name === 'QuotaExceededError') {
 *     // Handle quota exceeded
 *   }
 * }
 */
export function saveStore(store: Store): void {
  if (!isBrowser()) return;
  try {
    // Validate store against schema to ensure data integrity before saving
    const validated = storeSchema.parse(store);
    localStorage.setItem(KEY, JSON.stringify(validated));
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown error";
    const errorName = error instanceof DOMException ? error.name : "Unknown";
    console.error(`[saveStore] ${errorName}:`, errorMsg);
    throw error; // Re-throw for caller to handle
  }
}

/**
 * Atomically updates store with an updater function.
 * Loads current state, applies updates, validates, and persists result.
 * Ensures data consistency by validating before save.
 *
 * @param updater - Function receiving current store and returning updated store
 * @returns Updated store that was successfully persisted
 * @throws Error if update, validation, or save fails
 * @example
 * const updated = updateStore((s) => ({
 *   ...s,
 *   entries: [...s.entries, newEntry],
 * }));
 */
export function updateStore(updater: (s: Store) => Store): Store {
  if (!isBrowser()) return emptyStore;
  try {
    const current = loadStore();
    const next = updater(current);
    saveStore(next);
    return next;
  } catch (error) {
    console.error(
      "[updateStore] Failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    throw error;
  }
}

/**
 * Clears all stored data from localStorage.
 * Use with caution - this operation cannot be undone without a backup.
 * Removes the storage key entirely.
 *
 * @throws Does not throw; safe to call
 * @example
 * clearStore(); // Removes all persisted data
 */
export function clearStore(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(KEY);
  } catch (error) {
    console.error("[clearStore] Failed:", error instanceof Error ? error.message : "Unknown error");
  }
}

/**
 * Session storage helper for ephemeral client-side state.
 * Provides generic get/set/remove for sessionStorage with JSON serialization.
 * Safe to use; errors are caught and null is returned on failure.
 *
 * @example
 * session.set('lastFilter', 'transport');
 * const filter = session.get<string>('lastFilter'); // 'transport'
 * session.remove('lastFilter');
 */
export const session = {
  get<T>(key: string): T | null {
    if (typeof sessionStorage === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(SESSION_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
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

/**
 * Generates a unique identifier for new records and entries.
 * Prefers crypto.randomUUID() (RFC 4122 v4) for cryptographic quality,
 * falls back to timestamp-based ID for environments without crypto support.
 * Fallback format: 'id-{timestamp}-{randomsuffix}' (sufficient for single-user apps).
 *
 * @returns Unique string identifier suitable for database use
 * @example
 * const id1 = makeId(); // 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' (if crypto available)
 * const id2 = makeId(); // 'id-1702000000000-xyz789' (fallback format)
 */
export function makeId(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {
    // Fallback to timestamp-based ID
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
