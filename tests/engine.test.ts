import { describe, it, expect } from "vitest";
import { computeCo2e, totalCo2e, byCategory, withinDays, recommend, evaluateAchievements, goalProgress } from "@/lib/carbonwise/engine";
import type { Entry, Goal } from "@/lib/carbonwise/schemas";

const mk = (over: Partial<Entry>): Entry => ({
  id: Math.random().toString(),
  date: new Date().toISOString(),
  category: "transport",
  activity: "Car (petrol)",
  amount: 10,
  unit: "km",
  co2e: 1.92,
  ...over,
});

describe("computeCo2e", () => {
  it("multiplies amount by factor", () => {
    expect(computeCo2e("transport", "car_petrol_km", 10)).toBeCloseTo(1.92, 2);
  });
  it("returns 0 for unknown activity", () => {
    expect(computeCo2e("transport", "nope", 100)).toBe(0);
  });
  it("returns 0 for negative amount", () => {
    expect(computeCo2e("transport", "car_petrol_km", -5)).toBe(0);
  });
});

describe("aggregation", () => {
  const entries: Entry[] = [
    mk({ co2e: 5, category: "transport" }),
    mk({ co2e: 3, category: "food" }),
    mk({ co2e: 2, category: "transport" }),
  ];
  it("totals", () => expect(totalCo2e(entries)).toBeCloseTo(10, 2));
  it("groups by category", () => {
    const m = byCategory(entries);
    expect(m.transport).toBeCloseTo(7, 2);
    expect(m.food).toBeCloseTo(3, 2);
    expect(m.energy).toBe(0);
  });
});

describe("withinDays", () => {
  it("filters by recency", () => {
    const old = mk({ date: new Date(Date.now() - 40 * 86400000).toISOString() });
    const fresh = mk({ date: new Date().toISOString() });
    expect(withinDays([old, fresh], 7)).toHaveLength(1);
  });
});

describe("recommend", () => {
  it("returns a starter rec when no data", () => {
    expect(recommend([])).toHaveLength(1);
  });
  it("targets food when meat-heavy", () => {
    const entries = Array.from({ length: 5 }, () => mk({ category: "food", co2e: 8 }));
    const recs = recommend(entries);
    expect(recs.some((r) => r.category === "food")).toBe(true);
  });
});

describe("evaluateAchievements", () => {
  it("unlocks first_entry", () => {
    expect(evaluateAchievements([mk({})])).toContain("first_entry");
  });
  it("unlocks ten_entries", () => {
    const ten = Array.from({ length: 10 }, () => mk({}));
    expect(evaluateAchievements(ten)).toContain("ten_entries");
  });
});

describe("goalProgress", () => {
  const goal: Goal = { id: "g", title: "t", category: "transport", targetKgPerWeek: 10, createdAt: new Date().toISOString(), active: true };
  it("on-track when under target", () => {
    expect(goalProgress(goal, [mk({ co2e: 5 })]).onTrack).toBe(true);
  });
  it("off-track when over target", () => {
    expect(goalProgress(goal, [mk({ co2e: 20 })]).onTrack).toBe(false);
  });
});
