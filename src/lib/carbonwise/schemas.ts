import { z } from "zod";

// Current version of the storage format. Increment when migration is needed.
export const STORAGE_VERSION = 1;

/**
 * User profile information including name, household size, and preferences.
 * Validated with Zod schema to ensure data integrity.
 */
export const profileSchema = z.object({
  id: z.string().min(1, "Profile ID must not be empty"),
  name: z.string().trim().min(1, "Name is required").max(60, "Name must be at most 60 characters"),
  country: z.string().trim().max(60, "Country must be at most 60 characters").default("Global"),
  householdSize: z
    .number()
    .int()
    .min(1, "Household must have at least 1 person")
    .max(20, "Household size must be at most 20")
    .default(1),
  createdAt: z.string().datetime("Invalid date format"),
  theme: z
    .enum(["light", "dark", "system"], { message: "Theme must be 'light', 'dark', or 'system'" })
    .default("system"),
});
export type Profile = z.infer<typeof profileSchema>;

/** Emission categories for carbon tracking: transport, energy, food, shopping, waste */
export const categoryEnum = z.enum(["transport", "energy", "food", "shopping", "waste"]);
export type Category = z.infer<typeof categoryEnum>;

/** Single emission activity entry with CO2e calculation */
export const entrySchema = z.object({
  id: z.string().min(1, "Entry ID required"),
  date: z.string().datetime("Invalid ISO date"),
  category: categoryEnum,
  activity: z.string().trim().min(1, "Activity name required").max(80, "Activity name too long"),
  amount: z.number().min(0, "Amount cannot be negative").max(100000, "Amount exceeds maximum"),
  unit: z.string().trim().min(1, "Unit required").max(20, "Unit too long"),
  /** CO2e in kilograms */
  co2e: z.number().min(0, "CO2e cannot be negative").max(1_000_000, "CO2e exceeds maximum"),
  note: z.string().trim().max(280, "Note must be at most 280 characters").optional(),
});
export type Entry = z.infer<typeof entrySchema>;

/** Weekly emissions reduction goal for a specific category or all categories */
export const goalSchema = z.object({
  id: z.string().min(1, "Goal ID required"),
  title: z.string().trim().min(1, "Title required").max(80, "Title too long"),
  category: categoryEnum.or(z.literal("all"), {
    message: "Category must be a valid category or 'all'",
  }),
  /** Target kg CO2e per week */
  targetKgPerWeek: z
    .number()
    .min(0, "Target cannot be negative")
    .max(10000, "Target exceeds maximum"),
  createdAt: z.string().datetime("Invalid creation date"),
  active: z.boolean().default(true),
});
export type Goal = z.infer<typeof goalSchema>;

/** Badge/achievement unlocked by user (e.g., first entry, week streak) */
export const achievementSchema = z.object({
  id: z.string().min(1, "Achievement ID required"),
  unlockedAt: z.string().datetime("Invalid unlock date"),
});
export type Achievement = z.infer<typeof achievementSchema>;

/** Root store object containing all user data and state */
export const storeSchema = z.object({
  version: z.number().int().min(1, "Invalid store version"),
  profile: profileSchema.nullable(),
  entries: z.array(entrySchema, { message: "Entries must be an array of valid entries" }),
  goals: z.array(goalSchema, { message: "Goals must be an array of valid goals" }),
  achievements: z.array(achievementSchema, { message: "Achievements must be an array" }),
});
export type Store = z.infer<typeof storeSchema>;

export const emptyStore: Store = {
  version: STORAGE_VERSION,
  profile: null,
  entries: [],
  goals: [],
  achievements: [],
};
