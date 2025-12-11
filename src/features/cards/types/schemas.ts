import { z } from "zod";

// Allowed image MIME types
const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Card schema for stored cards (with id and timestamps)
export const cardSchema = z.object({
  id: z.uuidv4(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less"),
  atk: z
    .number()
    .int("ATK must be an integer")
    .min(0, "ATK must be non-negative"),
  hp: z.number().int("HP must be an integer").min(1, "HP must be at least 1"),
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
  .refine((file) => file.size <= MAX_IMAGE_SIZE, "Image must be less than 2MB");

// Card form schema for create/edit (without id and timestamps)
export const cardFormSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be 100 characters or less")
    .refine(
      (val) => val.trim().length > 0,
      "Name cannot be empty or whitespace only"
    ),
  atk: z
    .number()
    .int("ATK must be an integer")
    .min(0, "ATK must be non-negative"),
  hp: z.number().int("HP must be an integer").min(1, "HP must be at least 1"),
  image: imageSchema.nullable(),
});

// Type inference from schemas
export type CardSchemaType = z.infer<typeof cardSchema>;
export type CardFormSchemaType = z.infer<typeof cardFormSchema>;
