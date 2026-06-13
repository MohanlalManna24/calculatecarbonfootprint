import { describe, it, expect } from "vitest";
import {
  computeCo2e,
  totalCo2e,
  byCategory,
  withinDays,
  dailySeries,
  recommend,
  evaluateAchievements,
  goalProgress,
} from "@/lib/carbonwise/engine";
import type { Entry, Goal } from "@/lib/carbonwise/schemas";

/**
 * Test helper: Creates an Entry with sensible defaults and overrides.
 */
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

  it("returns 0 for NaN amount", () => {
    expect(computeCo2e("transport", "car_petrol_km", NaN)).toBe(0);
  });

  it("returns 0 for Infinity", () => {
    expect(computeCo2e("transport", "car_petrol_km", Infinity)).toBe(0);
  });

  it("returns 0 for negative Infinity", () => {
    expect(computeCo2e("transport", "car_petrol_km", -Infinity)).toBe(0);
  });

  it("rounds correctly to 2 decimal places", () => {
    const result = computeCo2e("transport", "car_petrol_km", 1);
    expect(result).toBe(0.19);
    const parts = result.toString().split(".");
    expect(parts[1]?.length).toBeLessThanOrEqual(2);
  });

  it("handles zero amount", () => {
    expect(computeCo2e("transport", "car_petrol_km", 0)).toBe(0);
  });

  it("handles very large amounts without overflow", () => {
    const result = computeCo2e("transport", "car_petrol_km", 100000);
    expect(result).toBeGreaterThan(0);
    expect(isFinite(result)).toBe(true);
  });

  it("works with all activity categories", () => {
    expect(computeCo2e("energy", "electricity_kwh", 100)).toBeGreaterThan(0);
    expect(computeCo2e("food", "beef_meal", 2)).toBeGreaterThan(0);
    expect(computeCo2e("shopping", "electronics_item", 1)).toBeGreaterThan(0);
    expect(computeCo2e("waste", "landfill_kg", 5)).toBeGreaterThan(0);
  });
});

describe("aggregation", () => {
  const entries: Entry[] = [
    mk({ co2e: 5, category: "transport" }),
    mk({ co2e: 3, category: "food" }),
    mk({ co2e: 2, category: "transport" }),
  ];

  it("totals all entries", () => {
    expect(totalCo2e(entries)).toBeCloseTo(10, 2);
  });

  it("groups emissions by category", () => {
    const m = byCategory(entries);
    expect(m.transport).toBeCloseTo(7, 2);
    expect(m.food).toBeCloseTo(3, 2);
    expect(m.energy).toBe(0);
  });

  it("handles empty entries array in totalCo2e", () => {
    expect(totalCo2e([])).toBe(0);
  });

  it("returns all zeros for empty entries in byCategory", () => {
    const m = byCategory([]);
    expect(m.transport).toBe(0);
    expect(m.energy).toBe(0);
    expect(m.food).toBe(0);
    expect(m.shopping).toBe(0);
    expect(m.waste).toBe(0);
  });

  it("handles single entry correctly", () => {
    const single = [mk({ co2e: 42 })];
    expect(totalCo2e(single)).toBe(42);
    expect(byCategory(single).transport).toBe(42);
  });

  it("maintains precision when summing many entries", () => {
    const manyEntries = Array.from({ length: 100 }, () => mk({ co2e: 0.15 }));
    const total = totalCo2e(manyEntries);
    expect(total).toBeCloseTo(15, 1);
  });
});

describe("withinDays", () => {
  it("filters entries by recency", () => {
    const old = mk({ date: new Date(Date.now() - 40 * 86400000).toISOString() });
    const fresh = mk({ date: new Date().toISOString() });
    expect(withinDays([old, fresh], 7)).toHaveLength(1);
  });

  it("handles empty entries array", () => {
    expect(withinDays([], 7)).toHaveLength(0);
  });

  it("includes entries at cutoff boundary", () => {
    const now = new Date();
    const cutoffEntry = mk({ date: new Date(now.getTime() - 7 * 86400000).toISOString() });
    expect(withinDays([cutoffEntry], 7, now)).toHaveLength(1);
  });

  it("excludes entries just before cutoff", () => {
    const now = new Date();
    const justOutside = mk({ date: new Date(now.getTime() - 7 * 86400000 - 1000).toISOString() });
    expect(withinDays([justOutside], 7, now)).toHaveLength(0);
  });

  it("returns all entries within range", () => {
    const now = new Date();
    const entries = Array.from({ length: 5 }, (_, i) =>
      mk({ date: new Date(now.getTime() - i * 86400000).toISOString() }),
    );
    expect(withinDays(entries, 7, now)).toHaveLength(5);
  });
});

describe("dailySeries", () => {
  it("generates daily data for specified range", () => {
    const entries = [mk({ date: new Date().toISOString(), co2e: 10 })];
    const series = dailySeries(entries, 7);
    expect(series).toHaveLength(7);
    expect(series[series.length - 1].co2e).toBe(10);
  });

  it("handles empty entries array", () => {
    const series = dailySeries([], 7);
    expect(series).toHaveLength(7);
    expect(series.every((s) => s.co2e === 0)).toBe(true);
  });

  it("aggregates multiple entries on same day", () => {
    const today = new Date().toISOString();
    const entries = [mk({ date: today, co2e: 5 }), mk({ date: today, co2e: 3 })];
    const series = dailySeries(entries, 1);
    expect(series[0].co2e).toBe(8);
  });
});

describe("recommend", () => {
  it("returns a starter recommendation when no data", () => {
    const recs = recommend([]);
    expect(recs).toHaveLength(1);
    expect(recs[0].id).toBe("rec_start");
  });

  it("targets food category when meat-heavy", () => {
    const entries = Array.from({ length: 5 }, () =>
      mk({ category: "food", co2e: 8, date: new Date(Date.now() - 5 * 86400000).toISOString() }),
    );
    const recs = recommend(entries);
    expect(recs.some((r) => r.category === "food")).toBe(true);
  });

  it("returns up to 4 recommendations", () => {
    const entries = [
      ...Array.from({ length: 3 }, () =>
        mk({
          category: "transport",
          co2e: 100,
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
        }),
      ),
      ...Array.from({ length: 3 }, () =>
        mk({ category: "food", co2e: 30, date: new Date(Date.now() - 5 * 86400000).toISOString() }),
      ),
      ...Array.from({ length: 3 }, () =>
        mk({
          category: "energy",
          co2e: 50,
          date: new Date(Date.now() - 5 * 86400000).toISOString(),
        }),
      ),
    ];
    const recs = recommend(entries);
    expect(recs.length).toBeLessThanOrEqual(4);
  });
});

describe("evaluateAchievements", () => {
  it("unlocks first_entry achievement", () => {
    const achievements = evaluateAchievements([mk({})]);
    expect(achievements).toContain("first_entry");
  });

  it("unlocks ten_entries achievement", () => {
    const ten = Array.from({ length: 10 }, () => mk({}));
    const achievements = evaluateAchievements(ten);
    expect(achievements).toContain("ten_entries");
  });

  it("unlocks plant_5 for plant-based meals", () => {
    const entries = Array.from({ length: 5 }, () => mk({ activity: "Vegan meal" }));
    const achievements = evaluateAchievements(entries);
    expect(achievements).toContain("plant_5");
  });

  it("unlocks under_50_week when weekly emissions low", () => {
    const now = new Date();
    const entries = Array.from({ length: 3 }, (_, i) =>
      mk({
        co2e: 10,
        date: new Date(now.getTime() - i * 86400000).toISOString(),
      }),
    );
    const achievements = evaluateAchievements(entries);
    expect(achievements).toContain("under_50_week");
  });

  it("unlocks week_streak for 7 consecutive days", () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const entries = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      return mk({ date: d.toISOString() });
    });
    const achievements = evaluateAchievements(entries);
    expect(achievements).toContain("week_streak");
  });

  it("handles empty entries array", () => {
    const achievements = evaluateAchievements([]);
    expect(achievements).toHaveLength(0);
  });
});

describe("goalProgress", () => {
  const goal: Goal = {
    id: "g1",
    title: "Weekly Transport Target",
    category: "transport",
    targetKgPerWeek: 10,
    createdAt: new Date().toISOString(),
    active: true,
  };

  it("marks on-track when under target", () => {
    const result = goalProgress(goal, [mk({ co2e: 5 })]);
    expect(result.onTrack).toBe(true);
  });

  it("marks off-track when over target", () => {
    const result = goalProgress(goal, [mk({ co2e: 20 })]);
    expect(result.onTrack).toBe(false);
  });

  it("calculates correct ratio", () => {
    const result = goalProgress(goal, [mk({ co2e: 5 })]);
    expect(result.ratio).toBe(0.5);
  });

  it("handles zero target correctly", () => {
    const zeroGoal = { ...goal, targetKgPerWeek: 0 };
    const result = goalProgress(zeroGoal, [mk({ co2e: 0 })]);
    expect(result.ratio).toBe(1);
  });

  it("handles zero target with emissions", () => {
    const zeroGoal = { ...goal, targetKgPerWeek: 0 };
    const result = goalProgress(zeroGoal, [mk({ co2e: 10 })]);
    expect(result.ratio).toBe(2);
  });

  it("filters entries by goal category", () => {
    const entries = [mk({ category: "transport", co2e: 5 }), mk({ category: "food", co2e: 20 })];
    const result = goalProgress(goal, entries);
    expect(result.currentKg).toBe(5);
  });

  it("handles entries from different weeks", () => {
    const now = new Date();
    const entries = [
      mk({ co2e: 5, date: new Date(now.getTime() - 2 * 86400000).toISOString() }),
      mk({ co2e: 20, date: new Date(now.getTime() - 10 * 86400000).toISOString() }),
    ];
    const result = goalProgress(goal, entries, now);
    expect(result.currentKg).toBe(5);
  });
});
