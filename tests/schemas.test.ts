import { describe, it, expect } from "vitest";
import { profileSchema, entrySchema, goalSchema } from "@/lib/carbonwise/schemas";

describe("schemas", () => {
  it("rejects empty profile name", () => {
    expect(
      profileSchema.safeParse({
        id: "x",
        name: "",
        country: "Global",
        householdSize: 1,
        createdAt: new Date().toISOString(),
        theme: "system",
      }).success,
    ).toBe(false);
  });
  it("rejects negative co2e", () => {
    expect(
      entrySchema.safeParse({
        id: "x",
        date: new Date().toISOString(),
        category: "transport",
        activity: "Car",
        amount: 1,
        unit: "km",
        co2e: -1,
      }).success,
    ).toBe(false);
  });
  it("accepts a valid goal", () => {
    expect(
      goalSchema.safeParse({
        id: "x",
        title: "T",
        category: "all",
        targetKgPerWeek: 10,
        createdAt: new Date().toISOString(),
        active: true,
      }).success,
    ).toBe(true);
  });
});
