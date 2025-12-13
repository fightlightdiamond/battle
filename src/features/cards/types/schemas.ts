import { z } from "zod";
import { DEFAULT_STATS, STAT_RANGES } from "./constants";

// ============================================
// Image validation constants
// ============================================

/** Allowed image MIME types for card images */
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
// Card field constraints
// ============================================

/** Maximum length for card name */
export const CARD_NAME_MAX_LENGTH = 100;

/** Minimum HP value for a card */
export const CARD_HP_MIN = STAT_RANGES.hp.min;

/** Minimum ATK value for a card */
export const CARD_ATK_MIN = STAT_RANGES.atk.min;

/** Minimum DEF value for a card */
export const CARD_DEF_MIN = STAT_RANGES.def.min;

/** Minimum SPD value for a card */
export const CARD_SPD_MIN = STAT_RANGES.spd.min;

/** Crit Chance range */
export const CARD_CRIT_CHANCE_MIN = STAT_RANGES.critChance.min;
export const CARD_CRIT_CHANCE_MAX = STAT_RANGES.critChance.max;

/** Crit Damage minimum (100% = no bonus) */
export const CARD_CRIT_DAMAGE_MIN = STAT_RANGES.critDamage.min;

/** Armor Penetration range */
export const CARD_ARMOR_PEN_MIN = STAT_RANGES.armorPen.min;
export const CARD_ARMOR_PEN_MAX = STAT_RANGES.armorPen.max;

/** Lifesteal range */
export const CARD_LIFESTEAL_MIN = STAT_RANGES.lifesteal.min;
export const CARD_LIFESTEAL_MAX = STAT_RANGES.lifesteal.max;

// ============================================
// Zod Schemas
// ============================================

// Card schema for stored cards (with id and timestamps)
export const cardSchema = z.object({
  id: z.uuidv4(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(
      CARD_NAME_MAX_LENGTH,
      `Name must be ${CARD_NAME_MAX_LENGTH} characters or less`
    ),
  // Core Stats (Tier 1)
  hp: z
    .number()
    .int("HP must be an integer")
    .min(CARD_HP_MIN, `HP must be at least ${CARD_HP_MIN}`)
    .default(DEFAULT_STATS.hp),
  atk: z
    .number()
    .int("ATK must be an integer")
    .min(CARD_ATK_MIN, "ATK must be non-negative")
    .default(DEFAULT_STATS.atk),
  def: z
    .number()
    .int("DEF must be an integer")
    .min(CARD_DEF_MIN, "DEF must be non-negative")
    .default(DEFAULT_STATS.def),
  spd: z
    .number()
    .int("SPD must be an integer")
    .min(CARD_SPD_MIN, `SPD must be at least ${CARD_SPD_MIN}`)
    .default(DEFAULT_STATS.spd),
  // Combat Stats (Tier 2)
  critChance: z
    .number()
    .min(
      CARD_CRIT_CHANCE_MIN,
      `Crit Chance must be at least ${CARD_CRIT_CHANCE_MIN}`
    )
    .max(
      CARD_CRIT_CHANCE_MAX,
      `Crit Chance must be at most ${CARD_CRIT_CHANCE_MAX}`
    )
    .default(DEFAULT_STATS.critChance),
  critDamage: z
    .number()
    .min(
      CARD_CRIT_DAMAGE_MIN,
      `Crit Damage must be at least ${CARD_CRIT_DAMAGE_MIN}`
    )
    .default(DEFAULT_STATS.critDamage),
  armorPen: z
    .number()
    .min(CARD_ARMOR_PEN_MIN, `Armor Pen must be at least ${CARD_ARMOR_PEN_MIN}`)
    .max(CARD_ARMOR_PEN_MAX, `Armor Pen must be at most ${CARD_ARMOR_PEN_MAX}`)
    .default(DEFAULT_STATS.armorPen),
  lifesteal: z
    .number()
    .min(CARD_LIFESTEAL_MIN, `Lifesteal must be at least ${CARD_LIFESTEAL_MIN}`)
    .max(CARD_LIFESTEAL_MAX, `Lifesteal must be at most ${CARD_LIFESTEAL_MAX}`)
    .default(DEFAULT_STATS.lifesteal),
  // Metadata
  imagePath: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  createdAt: z.number(),
  updatedAt: z.number(),
});

// Image validation schema
export const imageSchema = z
  .instanceof(File)
  .refine(
    (file) =>
      ALLOWED_IMAGE_TYPES.includes(
        file.type as (typeof ALLOWED_IMAGE_TYPES)[number]
      ),
    "Only PNG, JPG, and WEBP formats are allowed"
  )
  .refine(
    (file) => file.size <= MAX_IMAGE_SIZE,
    `Image must be less than ${MAX_IMAGE_SIZE_MB}MB`
  );

// Base stat schemas without defaults (for form validation with explicit values)
const hpSchema = z
  .number()
  .int("HP must be an integer")
  .min(CARD_HP_MIN, `HP must be at least ${CARD_HP_MIN}`);

const atkSchema = z
  .number()
  .int("ATK must be an integer")
  .min(CARD_ATK_MIN, "ATK must be non-negative");

const defSchema = z
  .number()
  .int("DEF must be an integer")
  .min(CARD_DEF_MIN, "DEF must be non-negative");

const spdSchema = z
  .number()
  .int("SPD must be an integer")
  .min(CARD_SPD_MIN, `SPD must be at least ${CARD_SPD_MIN}`);

const critChanceSchema = z
  .number()
  .min(
    CARD_CRIT_CHANCE_MIN,
    `Crit Chance must be at least ${CARD_CRIT_CHANCE_MIN}`
  )
  .max(
    CARD_CRIT_CHANCE_MAX,
    `Crit Chance must be at most ${CARD_CRIT_CHANCE_MAX}`
  );

const critDamageSchema = z
  .number()
  .min(
    CARD_CRIT_DAMAGE_MIN,
    `Crit Damage must be at least ${CARD_CRIT_DAMAGE_MIN}`
  );

const armorPenSchema = z
  .number()
  .min(CARD_ARMOR_PEN_MIN, `Armor Pen must be at least ${CARD_ARMOR_PEN_MIN}`)
  .max(CARD_ARMOR_PEN_MAX, `Armor Pen must be at most ${CARD_ARMOR_PEN_MAX}`);

const lifestealSchema = z
  .number()
  .min(CARD_LIFESTEAL_MIN, `Lifesteal must be at least ${CARD_LIFESTEAL_MIN}`)
  .max(CARD_LIFESTEAL_MAX, `Lifesteal must be at most ${CARD_LIFESTEAL_MAX}`);

// Card form schema for create/edit (without id and timestamps)
// Uses required fields - form component provides default values
export const cardFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(
      CARD_NAME_MAX_LENGTH,
      `Name must be ${CARD_NAME_MAX_LENGTH} characters or less`
    )
    .refine(
      (val) => val.trim().length > 0,
      "Name cannot be empty or whitespace only"
    ),
  // Core Stats (Tier 1)
  hp: hpSchema,
  atk: atkSchema,
  def: defSchema,
  spd: spdSchema,
  // Combat Stats (Tier 2)
  critChance: critChanceSchema,
  critDamage: critDamageSchema,
  armorPen: armorPenSchema,
  lifesteal: lifestealSchema,
  image: imageSchema.nullable(),
});

// Card form schema with defaults - for parsing input that may have missing fields
// This is used when validating external input that should have defaults applied
export const cardFormSchemaWithDefaults = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(
      CARD_NAME_MAX_LENGTH,
      `Name must be ${CARD_NAME_MAX_LENGTH} characters or less`
    )
    .refine(
      (val) => val.trim().length > 0,
      "Name cannot be empty or whitespace only"
    ),
  // Core Stats (Tier 1)
  hp: hpSchema.default(DEFAULT_STATS.hp),
  atk: atkSchema.default(DEFAULT_STATS.atk),
  def: defSchema.default(DEFAULT_STATS.def),
  spd: spdSchema.default(DEFAULT_STATS.spd),
  // Combat Stats (Tier 2)
  critChance: critChanceSchema.default(DEFAULT_STATS.critChance),
  critDamage: critDamageSchema.default(DEFAULT_STATS.critDamage),
  armorPen: armorPenSchema.default(DEFAULT_STATS.armorPen),
  lifesteal: lifestealSchema.default(DEFAULT_STATS.lifesteal),
  image: imageSchema.nullable(),
});

// Type inference from schemas
export type CardSchemaType = z.infer<typeof cardSchema>;
export type CardFormSchemaType = z.infer<typeof cardFormSchema>;
