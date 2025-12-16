// ============================================================================
// SCHEMA GENERATOR - Generate Zod schemas from Stat Registry
// ============================================================================

import { z } from "zod";
import { STAT_REGISTRY, type StatDefinition } from "./statConfig";
import type { CardStats } from "./statTypes";

/**
 * Generate a Zod schema for a single stat based on its definition
 */
function generateStatFieldSchema(stat: StatDefinition): z.ZodNumber {
  let schema = z.number();

  // Apply min validation if not -Infinity
  if (stat.min !== -Infinity) {
    schema = schema.min(stat.min, `${stat.label} must be at least ${stat.min}`);
  }

  // Apply max validation if not Infinity
  if (stat.max !== Infinity) {
    schema = schema.max(stat.max, `${stat.label} must be at most ${stat.max}`);
  }

  // Apply integer constraint for number format with 0 decimal places
  if (stat.format === "number" && stat.decimalPlaces === 0) {
    schema = schema.int(`${stat.label} must be an integer`);
  }

  return schema;
}

// Type for stat schema shape - maps CardStats keys to ZodNumber
type StatSchemaShape = {
  [K in keyof CardStats]: z.ZodNumber;
};

// Type for stat schema shape with defaults
type StatSchemaShapeWithDefaults = {
  [K in keyof CardStats]: z.ZodDefault<z.ZodNumber>;
};

/**
 * Generate a complete stat schema object from the registry
 * Returns schema without defaults (for form validation with explicit values)
 */
export function generateStatSchema(): z.ZodObject<StatSchemaShape> {
  const shape = {} as StatSchemaShape;

  for (const stat of STAT_REGISTRY) {
    (shape as Record<string, z.ZodNumber>)[stat.key] =
      generateStatFieldSchema(stat);
  }

  return z.object(shape);
}

/**
 * Generate a complete stat schema object with default values
 * Returns schema with defaults (for parsing input that may have missing fields)
 */
export function generateStatSchemaWithDefaults(): z.ZodObject<StatSchemaShapeWithDefaults> {
  const shape = {} as StatSchemaShapeWithDefaults;

  for (const stat of STAT_REGISTRY) {
    (shape as Record<string, z.ZodDefault<z.ZodNumber>>)[stat.key] =
      generateStatFieldSchema(stat).default(stat.defaultValue);
  }

  return z.object(shape);
}

// ============================================================================
// GENERATED SCHEMAS
// ============================================================================

/**
 * Generated stat schema without defaults
 * Use for form validation where values are explicitly provided
 */
export const generatedStatSchema = generateStatSchema();

/**
 * Generated stat schema with defaults
 * Use for parsing input that may have missing stat fields
 */
export const generatedStatSchemaWithDefaults = generateStatSchemaWithDefaults();

// Type inference from generated schemas
export type GeneratedStatSchemaType = z.infer<typeof generatedStatSchema>;
export type GeneratedStatSchemaWithDefaultsType = z.infer<
  typeof generatedStatSchemaWithDefaults
>;
