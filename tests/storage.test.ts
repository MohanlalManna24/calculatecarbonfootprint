import { describe, it, expect, beforeEach } from "vitest";
import { loadStore, saveStore, updateStore, clearStore, makeId } from "@/lib/carbonwise/storage";

describe("storage", () => {
  beforeEach(() => clearStore());

  it("returns empty store when nothing saved", () => {
    expect(loadStore().entries).toEqual([]);
  });

  it("round-trips a store", () => {
    saveStore({ version: 1, profile: null, entries: [], goals: [], achievements: [] });
    expect(loadStore().version).toBe(1);
  });

  it("recovers from corrupted JSON", () => {
    localStorage.setItem("carbonwise:v1", "{not json");
    expect(loadStore().entries).toEqual([]);
  });

  it("recovers from invalid shape", () => {
    localStorage.setItem("carbonwise:v1", JSON.stringify({ version: 1, entries: "nope" }));
    expect(loadStore().entries).toEqual([]);
  });

  it("updateStore mutates atomically", () => {
    updateStore((s) => ({ ...s, entries: [{ id: makeId(), date: new Date().toISOString(), category: "food", activity: "Vegan meal", amount: 1, unit: "meal", co2e: 0.4 }] }));
    expect(loadStore().entries).toHaveLength(1);
  });

  it("makeId produces unique ids", () => {
    expect(makeId()).not.toBe(makeId());
  });
});
