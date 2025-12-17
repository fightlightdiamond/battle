import { z } from "zod";
import { WEAPON_STAT_RANGES } from "./weapon";

// ============================================
// Image validation constants
// ============================================

/** Allowed image MIME types for weapon images */
export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
] as const;

/** Maximum image file size in bytes (2MB) */
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024;

/** Maximum image size in MB for display */
export const MAX_IMAGE_SIZE_MB = 2;

// ============================================
// Weapon field constraints
// ============================================

/** Maximum length for weapon name */
export const WEAPON_NAME_MAX_LENGTH = 100;

// ============================================
// Zod Schemas
// ============================================

// Image validation schema
export const imageSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number],
      ),
    "Only PNG, JPG, and WEBP formats are allowed",
  )
  .refine(
    (file) => file.size <= MAX_IMAGE_SIZE,
    `Image must be less than ${MAX_IMAGE_SIZE_MB}MB`,
  );

// Name schema - validates non-empty, non-whitespace
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(
    WEAPON_NAME_MAX_LENGTH,
    `Name must be ${WEAPON_NAME_MAX_LENGTH} characters or less`,
  )
  .refine(
    (val) => val.trim().length > 0,
    "Name cannot be empty or whitespace only",
  );

// Stat schemas with range validation
const atkSchema = z
  .number()
  .int("ATK must be an integer")
  .min(
    WEAPON_STAT_RANGES.atk.min,
    `ATK must be at least ${WEAPON_STAT_RANGES.atk.min}`,
  )
  .max(
    WEAPON_STAT_RANGES.atk.max,
    `ATK must be at most ${WEAPON_STAT_RANGES.atk.max}`,
  )
  .default(0);

const critChanceSchema = z
  .number()
  .int("Crit Chance must be an integer")
  .min(
    WEAPON_STAT_RANGES.critChance.min,
    `Crit Chance must be at least ${WEAPON_STAT_RANGES.critChance.min}`,
  )
  .max(
    WEAPON_STAT_RANGES.critChance.max,
    `Crit Chance must be at most ${WEAPON_STAT_RANGES.critChance.max}`,
  )
  .default(0);

const critDamageSchema = z
  .number()
  .int("Crit Damage must be an integer")
  .min(
    WEAPON_STAT_RANGES.critDamage.min,
    `Crit Damage must be at least ${WEAPON_STAT_RANGES.critDamage.min}`,
  )
  .max(
    WEAPON_STAT_RANGES.critDamage.max,
    `Crit Damage must be at most ${WEAPON_STAT_RANGES.critDamage.max}`,
  )
  .default(0);

const armorPenSchema = z
  .number()
  .int("Armor Pen must be an integer")
  .min(
    WEAPON_STAT_RANGES.armorPen.min,
    `Armor Pen must be at least ${WEAPON_STAT_RANGES.armorPen.min}`,
  )
  .max(
    WEAPON_STAT_RANGES.armorPen.max,
    `Armor Pen must be at most ${WEAPON_STAT_RANGES.armorPen.max}`,
  )
  .default(0);

const lifestealSchema = z
  .number()
  .int("Lifesteal must be an integer")
  .min(
    WEAPON_STAT_RANGES.lifesteal.min,
    `Lifesteal must be at least ${WEAPON_STAT_RANGES.lifesteal.min}`,
  )
  .max(
    WEAPON_STAT_RANGES.lifesteal.max,
    `Lifesteal must be at most ${WEAPON_STAT_RANGES.lifesteal.max}`,
  )
  .default(0);

const attackRangeSchema = z
  .number()
  .int("Attack Range must be an integer")
  .min(
    WEAPON_STAT_RANGES.attackRange.min,
    `Attack Range must be at least ${WEAPON_STAT_RANGES.attackRange.min}`,
  )
  .max(
    WEAPON_STAT_RANGES.attackRange.max,
    `Attack Range must be at most ${WEAPON_STAT_RANGES.attackRange.max}`,
  )
  .default(0);

// Weapon stats schema
export const weaponStatsSchema = z.object({
  atk: atkSchema,
  critChance: critChanceSchema,
  critDamage: critDamageSchema,
  armorPen: armorPenSchema,
  lifesteal: lifestealSchema,
  attackRange: attackRangeSchema,
});

// Weapon form schema for create/edit (without id and timestamps)
export const weaponFormSchema = z.object({
  name: nameSchema,
  image: imageSchema.nullable(),
  atk: atkSchema.optional(),
  critChance: critChanceSchema.optional(),
  critDamage: critDamageSchema.optional(),
  armorPen: armorPenSchema.optional(),
  lifesteal: lifestealSchema.optional(),
  attackRange: attackRangeSchema.optional(),
});

// Weapon schema for stored weapons (with id and timestamps)
export const weaponSchema = z.object({
  id: z.string().uuid(),
  name: nameSchema,
  imagePath: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  atk: atkSchema,
  critChance: critChanceSchema,
  critDamage: critDamageSchema,
  armorPen: armorPenSchema,
  lifesteal: lifestealSchema,
  attackRange: attackRangeSchema,
});

// Type inference from schemas
export type WeaponSchemaType = z.infer<typeof weaponSchema>;
export type WeaponFormSchemaType = z.infer<typeof weaponFormSchema>;
export type WeaponStatsSchemaType = z.infer<typeof weaponStatsSchema>;

/**
 * Validates a weapon name and returns validation result
 * @param name - The name to validate
 * @returns Object with success boolean and optional error message
 */
export function validateWeaponName(name: string): {
  success: boolean;
  error?: string;
} {
  // Check if empty
  if (!name || name.length === 0) {
    return { success: false, error: "Name is required" };
  }

  // Check if whitespace only
  if (name.trim().length === 0) {
    return { success: false, error: "Name cannot be empty or whitespace only" };
  }

  // Check max length
  if (name.length > WEAPON_NAME_MAX_LENGTH) {
    return {
      success: false,
      error: `Name must be ${WEAPON_NAME_MAX_LENGTH} characters or less`,
    };
  }

  return { success: true };
}
