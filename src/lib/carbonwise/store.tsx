import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadStore, saveStore, makeId } from "./storage";
import { evaluateAchievements } from "./engine";
import type { Entry, Goal, Profile, Store } from "./schemas";

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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(() => loadStore());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setStore(loadStore());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveStore(store);
  }, [store, ready]);

  // Re-evaluate achievements when entries change.
  useEffect(() => {
    const unlockedIds = evaluateAchievements(store.entries);
    const have = new Set(store.achievements.map((a) => a.id));
    const fresh = unlockedIds.filter((id) => !have.has(id));
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

  const value = useMemo<Ctx>(() => ({
    store,
    ready,
    setProfile: (profile) => setStore((s) => ({ ...s, profile })),
    addEntry: (e) => setStore((s) => ({ ...s, entries: [{ ...e, id: makeId() }, ...s.entries] })),
    removeEntry: (id) => setStore((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) })),
    addGoal: (g) => setStore((s) => ({
      ...s,
      goals: [{ ...g, id: makeId(), createdAt: new Date().toISOString(), active: true }, ...s.goals],
    })),
    removeGoal: (id) => setStore((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) })),
    reset: () => setStore({ version: 1, profile: null, entries: [], goals: [], achievements: [] }),
  }), [store, ready]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
