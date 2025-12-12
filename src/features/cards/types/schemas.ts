import { z } from "zod";

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
export const CARD_HP_MIN = 1;

/** Minimum ATK value for a card */
export const CARD_ATK_MIN = 0;

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
  atk: z
    .number()
    .int("ATK must be an integer")
    .min(CARD_ATK_MIN, "ATK must be non-negative"),
  hp: z
    .number()
    .int("HP must be an integer")
    .min(CARD_HP_MIN, `HP must be at least ${CARD_HP_MIN}`),
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

// Card form schema for create/edit (without id and timestamps)
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
  atk: z
    .number()
    .int("ATK must be an integer")
    .min(CARD_ATK_MIN, "ATK must be non-negative"),
  hp: z
    .number()
    .int("HP must be an integer")
    .min(CARD_HP_MIN, `HP must be at least ${CARD_HP_MIN}`),
  image: imageSchema.nullable(),
});

// Type inference from schemas
export type CardSchemaType = z.infer<typeof cardSchema>;
export type CardFormSchemaType = z.infer<typeof cardFormSchema>;
