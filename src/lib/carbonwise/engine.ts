import type { Category, Entry, Goal } from "./schemas";

/**
 * Emission factors (kg CO2e per unit).
 * Sources: UK DEFRA 2023, IPCC AR6, EPA. Approximate, suitable for awareness.
 */
export const ACTIVITIES: Record<Category, Array<{
  key: string; label: string; unit: string; factor: number;
}>> = {
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

export function computeCo2e(category: Category, activityKey: string, amount: number): number {
  const list = ACTIVITIES[category];
  const def = list?.find((a) => a.key === activityKey);
  if (!def || !isFinite(amount) || amount < 0) return 0;
  return Math.round(def.factor * amount * 100) / 100;
}

export function findActivity(category: Category, key: string) {
  return ACTIVITIES[category]?.find((a) => a.key === key);
}

export function totalCo2e(entries: Entry[]): number {
  return Math.round(entries.reduce((s, e) => s + e.co2e, 0) * 100) / 100;
}

export function byCategory(entries: Entry[]): Record<Category, number> {
  const out = { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0 } as Record<Category, number>;
  for (const e of entries) out[e.category] += e.co2e;
  for (const k of Object.keys(out) as Category[]) out[k] = Math.round(out[k] * 100) / 100;
  return out;
}

export function withinDays(entries: Entry[], days: number, now = new Date()): Entry[] {
  const cutoff = now.getTime() - days * 86400000;
  return entries.filter((e) => new Date(e.date).getTime() >= cutoff);
}

export function dailySeries(entries: Entry[], days = 30, now = new Date()) {
  const out: Array<{ date: string; co2e: number }> = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const next = new Date(d).getTime() + 86400000;
    const sum = entries.reduce((s, e) => {
      const t = new Date(e.date).getTime();
      return t >= d.getTime() && t < next ? s + e.co2e : s;
    }, 0);
    out.push({ date: d.toISOString().slice(5, 10), co2e: Math.round(sum * 100) / 100 });
  }
  return out;
}

/** Goal progress: weekly emissions vs target (lower is better). */
export function goalProgress(goal: Goal, entries: Entry[], now = new Date()) {
  const scoped = goal.category === "all" ? entries : entries.filter((e) => e.category === goal.category);
  const week = withinDays(scoped, 7, now);
  const current = totalCo2e(week);
  const ratio = goal.targetKgPerWeek === 0 ? (current === 0 ? 1 : 2) : current / goal.targetKgPerWeek;
  return {
    currentKg: current,
    targetKg: goal.targetKgPerWeek,
    onTrack: current <= goal.targetKgPerWeek,
    ratio,
  };
}

/** Personalized recommendations based on emission mix. */
export function recommend(entries: Entry[]): Array<{ id: string; title: string; impactKg: number; category: Category; }>{
  const recent = withinDays(entries, 30);
  const mix = byCategory(recent);
  const recs: Array<{ id: string; title: string; impactKg: number; category: Category }> = [];
  if (mix.transport > 50) recs.push({ id: "rec_transport_swap", title: "Replace 2 car trips/week with cycling or transit", impactKg: 28, category: "transport" });
  if (mix.transport > 200) recs.push({ id: "rec_flight", title: "Postpone one short-haul flight this quarter", impactKg: 180, category: "transport" });
  if (mix.food > 20) recs.push({ id: "rec_meat", title: "Swap 3 beef meals/week for plant-based", impactKg: 80, category: "food" });
  if (mix.energy > 80) recs.push({ id: "rec_thermostat", title: "Lower thermostat 1 °C, unplug standby loads", impactKg: 35, category: "energy" });
  if (mix.shopping > 40) recs.push({ id: "rec_shopping", title: "Buy one secondhand item instead of new", impactKg: 18, category: "shopping" });
  if (mix.waste > 10) recs.push({ id: "rec_waste", title: "Compost food scraps for a week", impactKg: 6, category: "waste" });
  if (recs.length === 0) {
    recs.push({ id: "rec_start", title: "Log your commute and last meal — small data, big insight", impactKg: 0, category: "transport" });
  }
  return recs.slice(0, 4);
}

/** Achievement definitions, evaluated against current store. */
export const ACHIEVEMENTS = [
  { id: "first_entry", title: "First Step", desc: "Log your first activity" },
  { id: "week_streak", title: "Seven-Day Streak", desc: "Log entries 7 days in a row" },
  { id: "under_50_week", title: "Light Week", desc: "Stay under 50 kg CO₂e for a week" },
  { id: "plant_5", title: "Plant-Powered", desc: "Log 5 plant-based meals" },
  { id: "ten_entries", title: "Consistent Tracker", desc: "Log 10 total activities" },
] as const;

export function evaluateAchievements(entries: Entry[]): string[] {
  const unlocked: string[] = [];
  if (entries.length >= 1) unlocked.push("first_entry");
  if (entries.length >= 10) unlocked.push("ten_entries");
  if (entries.filter((e) => e.activity.toLowerCase().includes("vegan") || e.activity.toLowerCase().includes("vegetarian")).length >= 5) unlocked.push("plant_5");
  if (totalCo2e(withinDays(entries, 7)) < 50 && withinDays(entries, 7).length > 0) unlocked.push("under_50_week");
  // streak
  const days = new Set(entries.map((e) => new Date(e.date).toISOString().slice(0, 10)));
  let streak = 0;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 14; i++) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    if (days.has(d.toISOString().slice(0, 10))) streak++; else break;
  }
  if (streak >= 7) unlocked.push("week_streak");
  return unlocked;
}
