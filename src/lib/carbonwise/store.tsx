import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadStore, saveStore, makeId } from "./storage";
import { evaluateAchievements } from "./engine";
import type { Entry, Goal, Profile, Store } from "./schemas";

/**
 * Context object containing store state and action methods.
 * Provides centralized access to carbon tracking data and user operations.
 */
type Ctx = {
  store: Store;
  ready: boolean;
  setProfile: (p: Profile | null) => void;
  addEntry: (e: Omit<Entry, "id">) => void;
  removeEntry: (id: string) => void;
  addGoal: (g: Omit<Goal, "id" | "createdAt" | "active">) => void;
  removeGoal: (id: string) => void;
  reset: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

/**
 * Provides global store context for carbon tracking data and operations.
 * Manages entries, goals, profiles, and achievements with automatic persistence.
 * Syncs store changes to localStorage and evaluates achievement unlocks on entry changes.
 * Must wrap your application to make useStore() available to children.
 *
 * @param children - React components that will consume the store context
 * @returns StoreProvider component wrapping children with context
 * @throws Error if children components call useStore() after provider unmounts
 * @example
 * <StoreProvider>
 *   <App />
 * </StoreProvider>
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  // Initialize store from localStorage (SSR-safe: returns empty on server)
  const [store, setStore] = useState<Store>(() => loadStore());
  // Track hydration: false until client-side load completes
  const [ready, setReady] = useState(false);

  // Hydrate store on component mount (client-side only)
  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  // Persist store changes to localStorage (after hydration only)
  useEffect(() => {
    if (ready) saveStore(store);
  }, [store, ready]);

  // Re-evaluate achievements when entries change
  // Unlock new achievements and append to existing ones
  useEffect(() => {
    const unlockedIds = evaluateAchievements(store.entries);
    const have = new Set(store.achievements.map((a) => a.id));
    const fresh = unlockedIds.filter((id) => !have.has(id)); // Only new achievements

    if (fresh.length) {
      setStore((s) => ({
        ...s,
        achievements: [
          ...s.achievements,
          ...fresh.map((id) => ({ id, unlockedAt: new Date().toISOString() })),
        ],
      }));
    }
  }, [store.entries, store.achievements]);

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo<Ctx>(
    () => ({
      store,
      ready,
      setProfile: (profile) => setStore((s) => ({ ...s, profile })),
      addEntry: (e) => setStore((s) => ({ ...s, entries: [{ ...e, id: makeId() }, ...s.entries] })),
      removeEntry: (id) =>
        setStore((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) })),
      addGoal: (g) =>
        setStore((s) => ({
          ...s,
          goals: [
            { ...g, id: makeId(), createdAt: new Date().toISOString(), active: true },
            ...s.goals,
          ],
        })),
      removeGoal: (id) => setStore((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
      reset: () =>
        setStore({ version: 1, profile: null, entries: [], goals: [], achievements: [] }),
    }),
    [store, ready],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

/**
 * Hook to access the global store context and its state/actions.
 * Provides access to carbon tracking data and operations like adding/removing entries and goals.
 * Must be called only within a component tree wrapped by StoreProvider.
 *
 * @returns Store context object with state and action methods
 * @throws Error if used outside StoreProvider with helpful message
 * @example
 * function MyComponent() {
 *   const { store, addEntry, ready } = useStore();
 *   if (!ready) return <Loading />;
 *   return <div>Entries: {store.entries.length}</div>;
 * }
 */
export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) {
    throw new Error(
      "useStore must be used inside <StoreProvider>. Make sure your component is wrapped by StoreProvider in the component tree.",
    );
  }
  return ctx;
}
