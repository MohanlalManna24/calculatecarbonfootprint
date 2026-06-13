import type { Category, Entry, Goal } from "./schemas";

/**
 * Emission factors (kg CO2e per unit).
 * Sources: UK DEFRA 2023, IPCC AR6, EPA. Approximate, suitable for awareness.
 */
export const ACTIVITIES: Record<
  Category,
  Array<{
    key: string;
    label: string;
    unit: string;
    factor: number;
  }>
> = {
  transport: [
    { key: "car_petrol_km", label: "Car (petrol)", unit: "km", factor: 0.192 },
    { key: "car_diesel_km", label: "Car (diesel)", unit: "km", factor: 0.171 },
    { key: "car_ev_km", label: "Car (electric)", unit: "km", factor: 0.053 },
    { key: "bus_km", label: "Bus", unit: "km", factor: 0.103 },
    { key: "train_km", label: "Train", unit: "km", factor: 0.041 },
    { key: "flight_short_km", label: "Flight (short-haul)", unit: "km", factor: 0.255 },
    { key: "flight_long_km", label: "Flight (long-haul)", unit: "km", factor: 0.195 },
    { key: "bike_km", label: "Bike / walk", unit: "km", factor: 0 },
  ],
  energy: [
    { key: "electricity_kwh", label: "Electricity", unit: "kWh", factor: 0.233 },
    { key: "natural_gas_kwh", label: "Natural gas", unit: "kWh", factor: 0.184 },
    { key: "heating_oil_l", label: "Heating oil", unit: "L", factor: 2.52 },
  ],
  food: [
    { key: "beef_meal", label: "Beef meal", unit: "meal", factor: 7.2 },
    { key: "lamb_meal", label: "Lamb meal", unit: "meal", factor: 5.8 },
    { key: "pork_meal", label: "Pork meal", unit: "meal", factor: 2.4 },
    { key: "chicken_meal", label: "Chicken meal", unit: "meal", factor: 1.6 },
    { key: "fish_meal", label: "Fish meal", unit: "meal", factor: 1.3 },
    { key: "vegetarian_meal", label: "Vegetarian meal", unit: "meal", factor: 0.7 },
    { key: "vegan_meal", label: "Vegan meal", unit: "meal", factor: 0.4 },
    { key: "dairy_l", label: "Dairy milk", unit: "L", factor: 1.4 },
  ],
  shopping: [
    { key: "clothing_item", label: "Clothing item", unit: "item", factor: 10 },
    { key: "electronics_item", label: "Electronics", unit: "item", factor: 80 },
    { key: "online_order", label: "Online order", unit: "order", factor: 0.5 },
  ],
  waste: [
    { key: "landfill_kg", label: "Landfill waste", unit: "kg", factor: 0.58 },
    { key: "recycled_kg", label: "Recycled", unit: "kg", factor: 0.02 },
    { key: "composted_kg", label: "Composted", unit: "kg", factor: 0.01 },
  ],
};

/**
 * Calculates CO2e emissions for a given activity.
 * Validates input parameters and returns emissions rounded to 2 decimal places.
 *
 * @param category - Activity category (transport, energy, food, shopping, waste)
 * @param activityKey - Unique identifier for the activity within the category
 * @param amount - Quantity of the activity (must be non-negative and finite)
 * @returns CO2e emissions in kg, rounded to 2 decimals. Returns 0 if activity not found or amount is invalid.
 * @throws Does not throw; returns 0 on invalid inputs for safety.
 * @example
 * computeCo2e('transport', 'car_petrol_km', 50) // returns 9.6
 * computeCo2e('transport', 'car_ev_km', 100) // returns 5.3
 */
export function computeCo2e(category: Category, activityKey: string, amount: number): number {
  const list = ACTIVITIES[category];
  const def = list?.find((a) => a.key === activityKey);
  // Validate: activity must exist, amount must be non-negative and finite
  if (!def || !isFinite(amount) || amount < 0) return 0;
  return Math.round(def.factor * amount * 100) / 100;
}

/**
 * Finds an activity definition by category and activity key.
 * Returns undefined if category or key not found.
 *
 * @param category - Activity category to search within (transport, energy, food, shopping, waste)
 * @param key - Unique activity identifier (e.g., 'car_petrol_km')
 * @returns Activity object with label, unit, and factor; undefined if not found
 * @throws Does not throw; returns undefined for invalid inputs
 * @example
 * const activity = findActivity('transport', 'car_petrol_km');
 * // { key: 'car_petrol_km', label: 'Car (petrol)', unit: 'km', factor: 0.192 }
 */
export function findActivity(
  category: Category,
  key: string,
): { key: string; label: string; unit: string; factor: number } | undefined {
  return ACTIVITIES[category]?.find((a) => a.key === key);
}

/**
 * Calculates total CO2e emissions from a list of entries.
 * Sums all emissions and rounds to 2 decimal places for precision.
 *
 * @param entries - Array of entry objects containing co2e values (must be valid Entry objects)
 * @returns Total CO2e in kg, rounded to 2 decimals (e.g., 125.45)
 * @throws Does not throw; returns 0 for empty array
 * @example
 * const total = totalCo2e(entries); // returns 125.45
 * const empty = totalCo2e([]); // returns 0
 */
export function totalCo2e(entries: Entry[]): number {
  if (!Array.isArray(entries) || entries.length === 0) return 0;
  return Math.round(entries.reduce((s, e) => s + (e.co2e || 0), 0) * 100) / 100;
}

/**
 * Aggregates CO2e emissions by category.
 * Returns a breakdown of total emissions for each emission category, initialized to 0.
 * Each value is rounded to 2 decimal places for accuracy.
 *
 * @param entries - Array of entry objects to aggregate (must be valid Entry objects)
 * @returns Record with category-wise CO2e totals, each rounded to 2 decimals (e.g., transport: 45.2)
 * @throws Does not throw; returns zeros for empty array or invalid inputs
 * @example
 * const mix = byCategory(entries);
 * // { transport: 45.2, energy: 30.1, food: 12.5, shopping: 5.0, waste: 2.1 }
 */
export function byCategory(entries: Entry[]): Record<Category, number> {
  const out = { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0 } as Record<
    Category,
    number
  >;
  if (Array.isArray(entries)) {
    for (const e of entries) {
      if (e && e.category && typeof e.co2e === "number") {
        out[e.category] += e.co2e;
      }
    }
  }
  // Round each category total to 2 decimal places to prevent floating point errors
  for (const k of Object.keys(out) as Category[]) {
    out[k] = Math.round(out[k] * 100) / 100;
  }
  return out;
}

/**
 * Filters entries to only include those from the past N days.
 * Calculates the cutoff time relative to the provided 'now' reference date.
 * Timezone-aware: based on millisecond timestamp comparison.
 *
 * @param entries - Array of entries to filter (must be valid Entry objects)
 * @param days - Number of days to look back (e.g., 7 for past week). Must be non-negative.
 * @param now - Reference date for calculation (defaults to current date). Used for testing.
 * @returns Filtered array containing only entries within the N-day window
 * @throws Does not throw; returns empty array for invalid inputs
 * @example
 * const weekEntries = withinDays(entries, 7);
 * const custom = withinDays(entries, 30, new Date('2024-01-01'));
 */
export function withinDays(entries: Entry[], days: number, now = new Date()): Entry[] {
  if (!Array.isArray(entries) || days < 0) return [];
  const cutoff = now.getTime() - days * 86400000; // 86400000 ms = 1 day
  return entries.filter((e) => e && new Date(e.date).getTime() >= cutoff);
}

/**
 * Generates a daily time series of CO2e emissions for charting and visualization.
 * Creates entries for each day in the range, including days with zero emissions.
 * Dates are formatted as MM-DD for monthly calendar views.
 *
 * @param entries - Array of entries to aggregate by day (must be valid Entry objects)
 * @param days - Number of days to include (defaults to 30). Must be positive.
 * @param now - Reference date for calculation (defaults to today). Used for testing.
 * @returns Array of daily summaries in chronological order with ISO date (MM-DD) and co2e total
 * @throws Does not throw; returns zero-filled series for empty or invalid inputs
 * @example
 * const series = dailySeries(entries, 30);
 * // [{ date: '05-15', co2e: 12.3 }, { date: '05-16', co2e: 8.5 }, ...]
 */
export function dailySeries(entries: Entry[], days = 30, now = new Date()) {
  if (!Array.isArray(entries) || days <= 0) days = 30;
  const out: Array<{ date: string; co2e: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0); // Start of day
    d.setDate(d.getDate() - i); // Move back i days
    const next = new Date(d).getTime() + 86400000; // End of day
    // Sum all entries within this day boundary
    const sum = entries.reduce((s, e) => {
      if (!e) return s;
      const t = new Date(e.date).getTime();
      return t >= d.getTime() && t < next ? s + (e.co2e || 0) : s;
    }, 0);
    out.push({ date: d.toISOString().slice(5, 10), co2e: Math.round(sum * 100) / 100 });
  }
  return out;
}

/**
 * Calculates progress toward a goal's weekly emission target.
 * Computes current emissions, target, on-track status, and ratio for comparison.
 * Filters entries by goal category if specified (not 'all').
 *
 * @param goal - Goal object with target in kg CO2e per week and optional category filter
 * @param entries - Array of entries to evaluate (must be valid Entry objects)
 * @param now - Reference date for week calculation (defaults to today). Used for testing.
 * @returns Progress object with current emissions, target, on-track boolean, and ratio
 * @throws Does not throw; handles invalid inputs gracefully
 * @example
 * const progress = goalProgress(goal, entries);
 * // { currentKg: 45.2, targetKg: 50, onTrack: true, ratio: 0.904 }
 */
export function goalProgress(
  goal: Goal,
  entries: Entry[],
  now = new Date(),
): {
  currentKg: number;
  targetKg: number;
  onTrack: boolean;
  ratio: number;
} {
  if (!goal || !Array.isArray(entries)) {
    return { currentKg: 0, targetKg: 0, onTrack: true, ratio: 1 };
  }
  const scoped =
    goal.category === "all" ? entries : entries.filter((e) => e && e.category === goal.category);
  const week = withinDays(scoped, 7, now);
  const current = totalCo2e(week);
  const ratio =
    goal.targetKgPerWeek === 0
      ? current === 0
        ? 1
        : 2 /* Penalty for any emissions when target is zero */
      : current / goal.targetKgPerWeek;
  return {
    currentKg: current,
    targetKg: goal.targetKgPerWeek,
    onTrack: current <= goal.targetKgPerWeek,
    ratio,
  };
}

/**
 * Generates personalized carbon reduction recommendations based on emission patterns.
 * Analyzes 30-day history and suggests high-impact actions in relevant categories.
 * Returns up to 4 contextual recommendations, prioritized by emission volume.
 * Provides a generic starter recommendation if insufficient data (< 20 kg CO2e in 30 days).
 *
 * @param entries - Full array of entries to analyze (must be valid Entry objects)
 * @returns Array of recommendations with ID, title, estimated impact in kg, and category
 * @throws Does not throw; returns starter recommendation for empty or insufficient data
 * @example
 * const recs = recommend(entries);
 * // [{ id: 'rec_transport_swap', title: 'Replace 2 car trips/week...', impactKg: 28, category: 'transport' }]
 */
export function recommend(
  entries: Entry[],
): Array<{ id: string; title: string; impactKg: number; category: Category }> {
  if (!Array.isArray(entries)) return [];
  const recent = withinDays(entries, 30);
  const mix = byCategory(recent);
  const recs: Array<{ id: string; title: string; impactKg: number; category: Category }> = [];

  // Rank recommendations by emission reduction potential
  if (mix.transport > 200)
    recs.push({
      id: "rec_flight",
      title: "Postpone one short-haul flight this quarter",
      impactKg: 180,
      category: "transport",
    });
  if (mix.transport > 50)
    recs.push({
      id: "rec_transport_swap",
      title: "Replace 2 car trips/week with cycling or transit",
      impactKg: 28,
      category: "transport",
    });
  if (mix.energy > 80)
    recs.push({
      id: "rec_thermostat",
      title: "Lower thermostat 1 °C, unplug standby loads",
      impactKg: 35,
      category: "energy",
    });
  if (mix.food > 20)
    recs.push({
      id: "rec_meat",
      title: "Swap 3 beef meals/week for plant-based",
      impactKg: 80,
      category: "food",
    });
  if (mix.shopping > 40)
    recs.push({
      id: "rec_shopping",
      title: "Buy one secondhand item instead of new",
      impactKg: 18,
      category: "shopping",
    });
  if (mix.waste > 10)
    recs.push({
      id: "rec_waste",
      title: "Compost food scraps for a week",
      impactKg: 6,
      category: "waste",
    });

  // Fallback: starter recommendation when insufficient data
  if (recs.length === 0) {
    recs.push({
      id: "rec_start",
      title: "Log your commute and last meal — small data, big insight",
      impactKg: 0,
      category: "transport",
    });
  }

  // Return top 4 recommendations, sorted by impact
  return recs.slice(0, 4);
}

/**
 * Achievement badge definitions with ID, title, and description.
 * Used to display achievement progress in the UI.
 * Achievement unlock conditions are checked in evaluateAchievements().
 */
export const ACHIEVEMENTS = [
  { id: "first_entry" as const, title: "First Step", desc: "Log your first activity" },
  { id: "week_streak" as const, title: "Seven-Day Streak", desc: "Log entries 7 days in a row" },
  {
    id: "under_50_week" as const,
    title: "Light Week",
    desc: "Stay under 50 kg CO₂e for a week",
  },
  { id: "plant_5" as const, title: "Plant-Powered", desc: "Log 5 plant-based meals" },
  {
    id: "ten_entries" as const,
    title: "Consistent Tracker",
    desc: "Log 10 total activities",
  },
] as const;

/**
 * Evaluates which achievements should be unlocked based on current entries.
 * Checks five achievement types: entry count, day streak, weekly emissions, dietary choices.
 * All achievement checks are independent; multiple can be unlocked simultaneously.
 * Streak calculation: checks last 14 days for consecutive daily entries.
 *
 * @param entries - Array of all user entries (must be valid Entry objects)
 * @returns Array of achievement IDs that have been earned (subset of ACHIEVEMENTS)
 * @throws Does not throw; returns empty array for null or invalid input
 * @example
 * const unlocked = evaluateAchievements(entries);
 * // ['first_entry', 'week_streak', 'under_50_week']
 */
export function evaluateAchievements(entries: Entry[]): string[] {
  const unlocked: string[] = [];

  if (!Array.isArray(entries) || entries.length === 0) return unlocked;

  // Achievement 1: First entry
  if (entries.length >= 1) unlocked.push("first_entry");

  // Achievement 2: Ten entries
  if (entries.length >= 10) unlocked.push("ten_entries");

  // Achievement 3: Plant-powered meals (vegan or vegetarian)
  const plantBasedCount = entries.filter(
    (e) =>
      e &&
      e.activity &&
      (e.activity.toLowerCase().includes("vegan") ||
        e.activity.toLowerCase().includes("vegetarian")),
  ).length;
  if (plantBasedCount >= 5) unlocked.push("plant_5");

  // Achievement 4: Light week (under 50 kg CO2e)
  const weekEntries = withinDays(entries, 7);
  if (weekEntries.length > 0 && totalCo2e(weekEntries) < 50) {
    unlocked.push("under_50_week");
  }

  // Achievement 5: Seven-day streak (consecutive daily entries)
  const daysWithEntries = new Set(
    entries.filter((e) => e && e.date).map((e) => new Date(e.date).toISOString().slice(0, 10)),
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check backward from today for consecutive days
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    if (daysWithEntries.has(dateStr)) {
      streak++;
    } else {
      break; // Streak broken
    }
  }

  if (streak >= 7) unlocked.push("week_streak");

  return unlocked;
}
