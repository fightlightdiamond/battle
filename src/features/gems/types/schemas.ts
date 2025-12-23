import { z } from "zod";

// ============================================
// Gem field constraints
// ============================================

/** Maximum length for gem name */
export const GEM_NAME_MAX_LENGTH = 100;

/** Maximum length for gem description */
export const GEM_DESCRIPTION_MAX_LENGTH = 500;

/** Activation chance range */
export const ACTIVATION_CHANCE_RANGE = { min: 0, max: 100 };

/** Cooldown range */
export const COOLDOWN_RANGE = { min: 0, max: 10 };

/** Effect parameter ranges */
export const EFFECT_PARAM_RANGES = {
  knockbackDistance: { min: 1, max: 3 },
  moveDistance: { min: 1, max: 3 },
  attackCount: { min: 2, max: 3 },
  executeThreshold: { min: 1, max: 50 },
  leapRange: { min: 1, max: 3 },
  leapKnockback: { min: 1, max: 3 },
} as const;

// ============================================
// Zod Schemas
// ============================================

// Skill trigger schema
export const skillTriggerSchema = z.enum(["movement", "combat"]);

// Skill type schema
export const skillTypeSchema = z.enum([
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
]);

// Name schema - validates non-empty, non-whitespace
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(
    GEM_NAME_MAX_LENGTH,
    `Name must be ${GEM_NAME_MAX_LENGTH} characters or less`,
  )
  .refine(
    (val) => val.trim().length > 0,
    "Name cannot be empty or whitespace only",
  );

// Description schema
const descriptionSchema = z
  .string()
  .max(
    GEM_DESCRIPTION_MAX_LENGTH,
    `Description must be ${GEM_DESCRIPTION_MAX_LENGTH} characters or less`,
  );

// Activation chance schema
const activationChanceSchema = z
  .number()
  .int("Activation chance must be an integer")
  .min(
    ACTIVATION_CHANCE_RANGE.min,
    `Activation chance must be at least ${ACTIVATION_CHANCE_RANGE.min}`,
  )
  .max(
    ACTIVATION_CHANCE_RANGE.max,
    `Activation chance must be at most ${ACTIVATION_CHANCE_RANGE.max}`,
  );

// Cooldown schema
const cooldownSchema = z
  .number()
  .int("Cooldown must be an integer")
  .min(COOLDOWN_RANGE.min, `Cooldown must be at least ${COOLDOWN_RANGE.min}`)
  .max(COOLDOWN_RANGE.max, `Cooldown must be at most ${COOLDOWN_RANGE.max}`);

// Effect parameters schema
export const skillEffectParamsSchema = z.object({
  knockbackDistance: z
    .number()
    .int()
    .min(EFFECT_PARAM_RANGES.knockbackDistance.min)
    .max(EFFECT_PARAM_RANGES.knockbackDistance.max)
    .optional(),
  moveDistance: z
    .number()
    .int()
    .min(EFFECT_PARAM_RANGES.moveDistance.min)
    .max(EFFECT_PARAM_RANGES.moveDistance.max)
    .optional(),
  attackCount: z
    .number()
    .int()
    .min(EFFECT_PARAM_RANGES.attackCount.min)
    .max(EFFECT_PARAM_RANGES.attackCount.max)
    .optional(),
  executeThreshold: z
    .number()
    .int()
    .min(EFFECT_PARAM_RANGES.executeThreshold.min)
    .max(EFFECT_PARAM_RANGES.executeThreshold.max)
    .optional(),
  leapRange: z
    .number()
    .int()
    .min(EFFECT_PARAM_RANGES.leapRange.min)
    .max(EFFECT_PARAM_RANGES.leapRange.max)
    .optional(),
  leapKnockback: z
    .number()
    .int()
    .min(EFFECT_PARAM_RANGES.leapKnockback.min)
    .max(EFFECT_PARAM_RANGES.leapKnockback.max)
    .optional(),
});

// Gem form schema for create/edit (without id and timestamps)
export const gemFormSchema = z.object({
  name: nameSchema,
  description: descriptionSchema,
  skillType: skillTypeSchema,
  trigger: skillTriggerSchema,
  activationChance: activationChanceSchema,
  cooldown: cooldownSchema,
  effectParams: skillEffectParamsSchema,
});

// Gem schema for stored gems (with id and timestamps)
export const gemSchema = z.object({
  id: z.string().min(1),
  name: nameSchema,
  description: descriptionSchema,
  skillType: skillTypeSchema,
  trigger: skillTriggerSchema,
  activationChance: activationChanceSchema,
  cooldown: cooldownSchema,
  effectParams: skillEffectParamsSchema,
  imagePath: z.string().nullable(),
  imageUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Type inference from schemas
export type GemSchemaType = z.infer<typeof gemSchema>;
export type GemFormSchemaType = z.infer<typeof gemFormSchema>;
export type SkillEffectParamsSchemaType = z.infer<
  typeof skillEffectParamsSchema
>;

/**
 * Validates a gem name and returns validation result
 * @param name - The name to validate
 * @returns Object with success boolean and optional error message
 */
export function validateGemName(name: string): {
  success: boolean;
  error?: string;
} {
  if (!name || name.length === 0) {
    return { success: false, error: "Name is required" };
  }

  if (name.trim().length === 0) {
    return { success: false, error: "Name cannot be empty or whitespace only" };
  }

  if (name.length > GEM_NAME_MAX_LENGTH) {
    return {
      success: false,
      error: `Name must be ${GEM_NAME_MAX_LENGTH} characters or less`,
    };
  }

  return { success: true };
}
