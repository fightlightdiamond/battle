import { z } from "zod";
import {
  generatedStatSchema,
  generatedStatSchemaWithDefaults,
} from "./schemaGenerator";

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

// ============================================
// Zod Schemas
// ============================================

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

// Name schema - shared between card and form schemas
const nameSchema = z
  .string()
  .min(1, "Name is required")
  .max(
    CARD_NAME_MAX_LENGTH,
    `Name must be ${CARD_NAME_MAX_LENGTH} characters or less`
  );

// Name schema with whitespace validation for forms
const nameSchemaWithTrim = nameSchema.refine(
  (val) => val.trim().length > 0,
  "Name cannot be empty or whitespace only"
);

// Card schema for stored cards (with id and timestamps)
// Uses generated stat schema with defaults from STAT_REGISTRY
export const cardSchema = z
  .object({
    id: z.string().uuid(),
    name: nameSchema,
    imagePath: z.string().nullable().optional(),
    imageUrl: z.string().nullable().optional(),
    createdAt: z.number(),
    updatedAt: z.number(),
  })
  .merge(generatedStatSchemaWithDefaults);

// Card form schema for create/edit (without id and timestamps)
// Uses generated stat schema from STAT_REGISTRY (no defaults - form provides values)
export const cardFormSchema = z
  .object({
    name: nameSchemaWithTrim,
    image: imageSchema.nullable(),
  })
  .merge(generatedStatSchema);

// Card form schema with defaults - for parsing input that may have missing fields
// Uses generated stat schema with defaults from STAT_REGISTRY
export const cardFormSchemaWithDefaults = z
  .object({
    name: nameSchemaWithTrim,
    image: imageSchema.nullable(),
  })
  .merge(generatedStatSchemaWithDefaults);

// Type inference from schemas
export type CardSchemaType = z.infer<typeof cardSchema>;
export type CardFormSchemaType = z.infer<typeof cardFormSchema>;
