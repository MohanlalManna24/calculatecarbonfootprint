import { z } from "zod";

export const STORAGE_VERSION = 1;

export const profileSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(60),
  country: z.string().trim().max(60).default("Global"),
  householdSize: z.number().int().min(1).max(20).default(1),
  createdAt: z.string().datetime(),
  theme: z.enum(["light", "dark", "system"]).default("system"),
});
export type Profile = z.infer<typeof profileSchema>;

export const categoryEnum = z.enum([
  "transport",
  "energy",
  "food",
  "shopping",
  "waste",
]);
export type Category = z.infer<typeof categoryEnum>;

export const entrySchema = z.object({
  id: z.string().min(1),
  date: z.string().datetime(),
  category: categoryEnum,
  activity: z.string().trim().min(1).max(80),
  amount: z.number().min(0).max(100000),
  unit: z.string().trim().min(1).max(20),
  /** kg CO2e */
  co2e: z.number().min(0).max(1_000_000),
  note: z.string().trim().max(280).optional(),
});
export type Entry = z.infer<typeof entrySchema>;

export const goalSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(80),
  category: categoryEnum.or(z.literal("all")),
  /** target kg CO2e per week */
  targetKgPerWeek: z.number().min(0).max(10000),
  createdAt: z.string().datetime(),
  active: z.boolean().default(true),
});
export type Goal = z.infer<typeof goalSchema>;

export const achievementSchema = z.object({
  id: z.string().min(1),
  unlockedAt: z.string().datetime(),
});
export type Achievement = z.infer<typeof achievementSchema>;

export const storeSchema = z.object({
  version: z.number().int(),
  profile: profileSchema.nullable(),
  entries: z.array(entrySchema),
  goals: z.array(goalSchema),
  achievements: z.array(achievementSchema),
});
export type Store = z.infer<typeof storeSchema>;

export const emptyStore: Store = {
  version: STORAGE_VERSION,
  profile: null,
  entries: [],
  goals: [],
  achievements: [],
};
