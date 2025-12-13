import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  generateStatSchema,
  generateStatSchemaWithDefaults,
  generatedStatSchema,
} from "./schemaGenerator";
import { STAT_REGISTRY, type StatDefinition } from "./statConfig";

/**
 * **Feature: config-driven-stats, Property 2: Schema-Config Consistency**
 * **Validates: Requirements 4.1, 4.2, 4.3, 2.3, 2.4**
 *
 * For any stat in the registry, the generated Zod schema SHALL have a
 * corresponding field with matching min/max validation and default value.
 */
describe("Property 2: Schema-Config Consistency", () => {
  it("generated schema has a field for every stat in registry", () => {
    const schema = generateStatSchema();
    const schemaShape = schema.shape;

    for (const stat of STAT_REGISTRY) {
      expect(schemaShape).toHaveProperty(stat.key);
    }
  });

  it("generated schema has exactly the same number of fields as registry", () => {
    const schema = generateStatSchema();
    const schemaKeys = Object.keys(schema.shape);

    expect(schemaKeys.length).toBe(STAT_REGISTRY.length);
  });

  it("schema with defaults applies correct default values", () => {
    const schema = generateStatSchemaWithDefaults();

    // Parse empty object - should get all defaults
    const result = schema.parse({});

    for (const stat of STAT_REGISTRY) {
      expect(result[stat.key]).toBe(stat.defaultValue);
    }
  });

  it("property: for any stat, schema field validates min constraint correctly", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const schema = generatedStatSchema;

        // Value at min should pass
        const atMin = { [stat.key]: stat.min };
        const fullAtMin = createFullStatObject(atMin);
        expect(() => schema.parse(fullAtMin)).not.toThrow();

        // Value below min should fail (if min is finite)
        if (stat.min > -Infinity) {
          const belowMin = { [stat.key]: stat.min - 1 };
          const fullBelowMin = createFullStatObject(belowMin);
          expect(() => schema.parse(fullBelowMin)).toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("property: for any stat, schema field validates max constraint correctly", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const schema = generatedStatSchema;

        // Value at max should pass (if max is finite)
        if (stat.max < Infinity) {
          const atMax = { [stat.key]: stat.max };
          const fullAtMax = createFullStatObject(atMax);
          expect(() => schema.parse(fullAtMax)).not.toThrow();

          // Value above max should fail
          const aboveMax = { [stat.key]: stat.max + 1 };
          const fullAboveMax = createFullStatObject(aboveMax);
          expect(() => schema.parse(fullAboveMax)).toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("property: for any stat with defaults, default value matches config", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const schema = generateStatSchemaWithDefaults();

        // Parse empty object and check this stat's default
        const result = schema.parse({});
        expect(result[stat.key]).toBe(stat.defaultValue);
      }),
      { numRuns: 100 }
    );
  });

  it("property: schema validates integer constraint for number format with 0 decimals", () => {
    const integerStats = STAT_REGISTRY.filter(
      (s) => s.format === "number" && s.decimalPlaces === 0
    );

    fc.assert(
      fc.property(fc.constantFrom(...integerStats), (stat: StatDefinition) => {
        const schema = generatedStatSchema;

        // Non-integer should fail for integer stats
        const nonInteger = { [stat.key]: stat.defaultValue + 0.5 };
        const fullNonInteger = createFullStatObject(nonInteger);
        expect(() => schema.parse(fullNonInteger)).toThrow();

        // Integer should pass
        const integer = { [stat.key]: stat.defaultValue };
        const fullInteger = createFullStatObject(integer);
        expect(() => schema.parse(fullInteger)).not.toThrow();
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Helper function to create a full stat object with valid defaults,
 * overriding specific fields for testing
 */
function createFullStatObject(
  overrides: Record<string, number>
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const stat of STAT_REGISTRY) {
    result[stat.key] = stat.defaultValue;
  }

  return { ...result, ...overrides };
}

/**
 * **Feature: config-driven-stats, Property 7: Validation Range Enforcement**
 * **Validates: Requirements 4.2, 2.4**
 *
 * For any stat and for any input value, the validation SHALL pass if and only if
 * min <= value <= max as defined in the stat's config.
 */
describe("Property 7: Validation Range Enforcement", () => {
  it("property: values within range pass validation", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STAT_REGISTRY),
        fc.double({ min: 0, max: 10000, noNaN: true }),
        (stat: StatDefinition, randomOffset: number) => {
          const schema = generatedStatSchema;

          // Generate a value within the valid range
          const range = Math.min(stat.max, 10000) - stat.min;
          const normalizedOffset = (randomOffset / 10000) * range;
          let value = stat.min + normalizedOffset;

          // Ensure value is within bounds
          value = Math.max(stat.min, Math.min(stat.max, value));

          // For integer stats, round the value
          if (stat.format === "number" && stat.decimalPlaces === 0) {
            value = Math.round(value);
            // Ensure rounding didn't push us out of bounds
            value = Math.max(stat.min, Math.min(stat.max, value));
          }

          const testObj = createFullStatObject({ [stat.key]: value });
          expect(() => schema.parse(testObj)).not.toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: values below min fail validation", () => {
    // Only test stats with finite min
    const statsWithFiniteMin = STAT_REGISTRY.filter((s) => s.min > -Infinity);

    fc.assert(
      fc.property(
        fc.constantFrom(...statsWithFiniteMin),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        (stat: StatDefinition, offset: number) => {
          const schema = generatedStatSchema;

          // Value below min should fail
          const value = stat.min - offset;
          const testObj = createFullStatObject({ [stat.key]: value });

          const result = schema.safeParse(testObj);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: values above max fail validation", () => {
    // Only test stats with finite max
    const statsWithFiniteMax = STAT_REGISTRY.filter((s) => s.max < Infinity);

    fc.assert(
      fc.property(
        fc.constantFrom(...statsWithFiniteMax),
        fc.double({ min: 0.1, max: 100, noNaN: true }),
        (stat: StatDefinition, offset: number) => {
          const schema = generatedStatSchema;

          // Value above max should fail
          const value = stat.max + offset;
          const testObj = createFullStatObject({ [stat.key]: value });

          const result = schema.safeParse(testObj);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: boundary values (min and max) pass validation", () => {
    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        const schema = generatedStatSchema;

        // Min value should pass
        let minValue = stat.min;
        if (stat.format === "number" && stat.decimalPlaces === 0) {
          minValue = Math.ceil(minValue);
        }
        const atMin = createFullStatObject({ [stat.key]: minValue });
        expect(() => schema.parse(atMin)).not.toThrow();

        // Max value should pass (if finite)
        if (stat.max < Infinity) {
          let maxValue = stat.max;
          if (stat.format === "number" && stat.decimalPlaces === 0) {
            maxValue = Math.floor(maxValue);
          }
          const atMax = createFullStatObject({ [stat.key]: maxValue });
          expect(() => schema.parse(atMax)).not.toThrow();
        }
      }),
      { numRuns: 100 }
    );
  });
});
