/**
 * Property-based tests for Code Generator
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder, Property 6: Schema Round-Trip Validation**
 * **Validates: Requirements 2.3**
 *
 * For any valid EntityDefinition and any data object:
 * - If data matches the schema constraints, validation SHALL pass
 * - If data violates any constraint, validation SHALL fail with appropriate error
 * - Creating a runtime schema from the definition and validating sample data SHALL produce consistent results
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { createRuntimeSchema } from "./codeGenerator";
import type {
  EntityDefinition,
  FieldDefinition,
  FieldType,
  SelectChoice,
} from "../types/entityDefinition";

// ============================================
// Arbitraries (Generators)
// ============================================

// Valid camelCase field key generator
const validFieldKeyArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom(
      "a",
      "b",
      "c",
      "d",
      "e",
      "f",
      "g",
      "h",
      "i",
      "j",
      "k",
      "l",
      "m",
      "n",
      "o",
      "p",
      "q",
      "r",
      "s",
      "t",
      "u",
      "v",
      "w",
      "x",
      "y",
      "z",
    ),
    fc.array(
      fc.constantFrom(
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
      ),
      { minLength: 0, maxLength: 10 },
    ),
  )
  .map(([first, rest]) => first + rest.join(""));

// Valid PascalCase entity name generator
const validEntityNameArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom(
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
    ),
    fc.array(
      fc.constantFrom(
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "g",
        "h",
        "i",
        "j",
        "k",
        "l",
        "m",
        "n",
        "o",
        "p",
        "q",
        "r",
        "s",
        "t",
        "u",
        "v",
        "w",
        "x",
        "y",
        "z",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J",
        "K",
        "L",
        "M",
        "N",
        "O",
        "P",
        "Q",
        "R",
        "S",
        "T",
        "U",
        "V",
        "W",
        "X",
        "Y",
        "Z",
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
      ),
      { minLength: 0, maxLength: 15 },
    ),
  )
  .map(([first, rest]) => first + rest.join(""));

// Valid label generator
const validLabelArb: fc.Arbitrary<string> = fc.string({
  minLength: 1,
  maxLength: 50,
});

// Select choice generator
const selectChoiceArb: fc.Arbitrary<SelectChoice> = fc.record({
  value: fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => /^[a-zA-Z0-9]+$/.test(s)),
  label: fc.string({ minLength: 1, maxLength: 30 }),
});

// Text field definition generator
const textFieldArb: fc.Arbitrary<FieldDefinition> = fc.record({
  id: fc.uuid(),
  key: validFieldKeyArb,
  label: validLabelArb,
  type: fc.constant("text" as FieldType),
  required: fc.boolean(),
  options: fc.option(
    fc.record({
      minLength: fc.option(fc.integer({ min: 0, max: 10 }), { nil: undefined }),
      maxLength: fc.option(fc.integer({ min: 11, max: 100 }), {
        nil: undefined,
      }),
    }),
    { nil: undefined },
  ),
});

// Number field definition generator
const numberFieldArb: fc.Arbitrary<FieldDefinition> = fc.record({
  id: fc.uuid(),
  key: validFieldKeyArb,
  label: validLabelArb,
  type: fc.constant("number" as FieldType),
  required: fc.boolean(),
  options: fc.option(
    fc.record({
      min: fc.option(fc.integer({ min: -1000, max: 0 }), { nil: undefined }),
      max: fc.option(fc.integer({ min: 1, max: 1000 }), { nil: undefined }),
      step: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined }),
    }),
    { nil: undefined },
  ),
});

// Select field definition generator
const selectFieldArb: fc.Arbitrary<FieldDefinition> = fc
  .array(selectChoiceArb, { minLength: 1, maxLength: 5 })
  .chain((choices) =>
    fc.record({
      id: fc.uuid(),
      key: validFieldKeyArb,
      label: validLabelArb,
      type: fc.constant("select" as FieldType),
      required: fc.boolean(),
      options: fc.constant({ choices }),
    }),
  );

// Boolean field definition generator
const booleanFieldArb: fc.Arbitrary<FieldDefinition> = fc.record({
  id: fc.uuid(),
  key: validFieldKeyArb,
  label: validLabelArb,
  type: fc.constant("boolean" as FieldType),
  required: fc.boolean(),
  options: fc.constant(undefined),
});

// Any field definition generator
const fieldDefinitionArb: fc.Arbitrary<FieldDefinition> = fc.oneof(
  textFieldArb,
  numberFieldArb,
  selectFieldArb,
  booleanFieldArb,
);

// Entity definition with unique field keys
const entityDefinitionArb: fc.Arbitrary<EntityDefinition> = fc
  .array(fieldDefinitionArb, { minLength: 1, maxLength: 5 })
  .chain((fields) => {
    // Ensure unique keys by appending index
    const uniqueFields = fields.map((field, index) => ({
      ...field,
      key: `${field.key}${index}`,
    }));
    return fc.record({
      id: fc.uuid(),
      name: validEntityNameArb,
      fields: fc.constant(uniqueFields),
      createdAt: fc.integer({ min: 0, max: Date.now() }),
      updatedAt: fc.integer({ min: 0, max: Date.now() }),
    });
  });

// Generate valid data for a field
function generateValidDataForField(
  field: FieldDefinition,
): fc.Arbitrary<unknown> {
  switch (field.type) {
    case "text": {
      const minLen = field.options?.minLength ?? 1;
      const maxLen = field.options?.maxLength ?? 50;
      return fc.string({
        minLength: minLen,
        maxLength: Math.max(minLen, maxLen),
      });
    }
    case "number": {
      const min = field.options?.min ?? -1000;
      const max = field.options?.max ?? 1000;
      return fc.integer({ min, max: Math.max(min, max) });
    }
    case "select": {
      const choices = field.options?.choices ?? [];
      if (choices.length > 0) {
        return fc.constantFrom(...choices.map((c) => c.value));
      }
      return fc.string({ minLength: 1, maxLength: 20 });
    }
    case "boolean":
      return fc.boolean();
    default:
      return fc.anything();
  }
}

// Generate valid data object for an entity definition
function generateValidDataArb(
  entity: EntityDefinition,
): fc.Arbitrary<Record<string, unknown>> {
  const shape: Record<string, fc.Arbitrary<unknown>> = {};
  for (const field of entity.fields) {
    if (field.required) {
      shape[field.key] = generateValidDataForField(field);
    } else {
      shape[field.key] = fc.option(generateValidDataForField(field), {
        nil: undefined,
      });
    }
  }
  return fc.record(shape);
}

// Generate invalid data for a field (wrong type)
function generateInvalidDataForField(
  field: FieldDefinition,
): fc.Arbitrary<unknown> {
  switch (field.type) {
    case "text":
      return fc.integer(); // number instead of string
    case "number":
      return fc.string({ minLength: 1 }); // string instead of number
    case "select": {
      const choices = field.options?.choices ?? [];
      if (choices.length > 0) {
        // Return a string that's not in the choices
        return fc
          .string({ minLength: 10, maxLength: 20 })
          .filter((s) => !choices.some((c) => c.value === s));
      }
      return fc.integer(); // number instead of string
    }
    case "boolean":
      return fc.string({ minLength: 1 }); // string instead of boolean
    default:
      return fc.anything();
  }
}

// Helper function to generate a valid value for a field respecting constraints
function generateValidValueForField(field: FieldDefinition): unknown {
  switch (field.type) {
    case "text": {
      const minLen = field.options?.minLength ?? 1;
      const maxLen = field.options?.maxLength ?? 50;
      const targetLen = Math.max(minLen, Math.min(maxLen, minLen + 5));
      return "x".repeat(targetLen);
    }
    case "number": {
      const min = field.options?.min ?? -1000;
      const max = field.options?.max ?? 1000;
      return Math.floor((min + max) / 2);
    }
    case "select":
      return field.options?.choices?.[0]?.value ?? "default";
    case "boolean":
      return true;
    default:
      return null;
  }
}

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: low-code-builder, Property 6: Schema Round-Trip Validation**
 * **Validates: Requirements 2.3**
 */
describe("Property 6: Schema Round-Trip Validation", () => {
  it("property: valid data matching schema constraints passes validation", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const schema = createRuntimeSchema(entity);
        const validDataArb = generateValidDataArb(entity);

        // Generate and validate multiple valid data samples
        fc.assert(
          fc.property(validDataArb, (data) => {
            const result = schema.safeParse(data);
            expect(result.success).toBe(true);
          }),
          { numRuns: 10 },
        );
      }),
      { numRuns: 100 },
    );
  });

  it("property: data with wrong type fails validation", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        // Only test entities with required fields
        const requiredFields = entity.fields.filter((f) => f.required);
        if (requiredFields.length === 0) return;

        const schema = createRuntimeSchema(entity);

        // Pick a random required field to invalidate
        const fieldToInvalidate = requiredFields[0];
        const invalidValueArb = generateInvalidDataForField(fieldToInvalidate);

        fc.assert(
          fc.property(invalidValueArb, (invalidValue) => {
            // Create data with one invalid field
            const data: Record<string, unknown> = {};
            for (const field of entity.fields) {
              if (field.key === fieldToInvalidate.key) {
                data[field.key] = invalidValue;
              } else if (field.required) {
                // Use a valid value respecting constraints
                data[field.key] = generateValidValueForField(field);
              }
            }

            const result = schema.safeParse(data);
            expect(result.success).toBe(false);
          }),
          { numRuns: 10 },
        );
      }),
      { numRuns: 100 },
    );
  });

  it("property: missing required field fails validation", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        // Only test entities with required fields
        const requiredFields = entity.fields.filter((f) => f.required);
        if (requiredFields.length === 0) return;

        const schema = createRuntimeSchema(entity);

        // Create data missing the first required field
        const missingField = requiredFields[0];
        const data: Record<string, unknown> = {};

        for (const field of entity.fields) {
          if (field.key === missingField.key) {
            // Skip this field (don't include it)
            continue;
          }
          if (field.required) {
            // Use valid values respecting constraints
            data[field.key] = generateValidValueForField(field);
          }
        }

        const result = schema.safeParse(data);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: optional fields can be omitted", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const schema = createRuntimeSchema(entity);

        // Create data with only required fields, respecting constraints
        const data: Record<string, unknown> = {};
        for (const field of entity.fields) {
          if (field.required) {
            data[field.key] = generateValidValueForField(field);
          }
          // Optional fields are not included
        }

        const result = schema.safeParse(data);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: text field constraints are enforced", () => {
    // Create entity with text field that has min/max length constraints
    const textFieldWithConstraintsArb = fc.record({
      id: fc.uuid(),
      key: fc.constant("textField"),
      label: fc.constant("Text Field"),
      type: fc.constant("text" as FieldType),
      required: fc.constant(true),
      options: fc.record({
        minLength: fc.constant(5),
        maxLength: fc.constant(10),
      }),
    });

    const entityWithTextConstraintsArb = textFieldWithConstraintsArb.chain(
      (field) =>
        fc.record({
          id: fc.uuid(),
          name: fc.constant("TestEntity"),
          fields: fc.constant([field]),
          createdAt: fc.constant(Date.now()),
          updatedAt: fc.constant(Date.now()),
        }),
    );

    fc.assert(
      fc.property(entityWithTextConstraintsArb, (entity) => {
        const schema = createRuntimeSchema(entity);

        // Valid: string with length 5-10
        expect(schema.safeParse({ textField: "hello" }).success).toBe(true);
        expect(schema.safeParse({ textField: "helloworld" }).success).toBe(
          true,
        );

        // Invalid: string too short
        expect(schema.safeParse({ textField: "hi" }).success).toBe(false);

        // Invalid: string too long
        expect(schema.safeParse({ textField: "hello world!" }).success).toBe(
          false,
        );
      }),
      { numRuns: 100 },
    );
  });

  it("property: number field constraints are enforced", () => {
    // Create entity with number field that has min/max constraints
    const numberFieldWithConstraintsArb = fc.record({
      id: fc.uuid(),
      key: fc.constant("numberField"),
      label: fc.constant("Number Field"),
      type: fc.constant("number" as FieldType),
      required: fc.constant(true),
      options: fc.record({
        min: fc.constant(0),
        max: fc.constant(100),
      }),
    });

    const entityWithNumberConstraintsArb = numberFieldWithConstraintsArb.chain(
      (field) =>
        fc.record({
          id: fc.uuid(),
          name: fc.constant("TestEntity"),
          fields: fc.constant([field]),
          createdAt: fc.constant(Date.now()),
          updatedAt: fc.constant(Date.now()),
        }),
    );

    fc.assert(
      fc.property(entityWithNumberConstraintsArb, (entity) => {
        const schema = createRuntimeSchema(entity);

        // Valid: number within range
        expect(schema.safeParse({ numberField: 0 }).success).toBe(true);
        expect(schema.safeParse({ numberField: 50 }).success).toBe(true);
        expect(schema.safeParse({ numberField: 100 }).success).toBe(true);

        // Invalid: number below min
        expect(schema.safeParse({ numberField: -1 }).success).toBe(false);

        // Invalid: number above max
        expect(schema.safeParse({ numberField: 101 }).success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: select field only accepts valid choices", () => {
    // Create entity with select field
    const selectFieldArb = fc.record({
      id: fc.uuid(),
      key: fc.constant("status"),
      label: fc.constant("Status"),
      type: fc.constant("select" as FieldType),
      required: fc.constant(true),
      options: fc.constant({
        choices: [
          { value: "active", label: "Active" },
          { value: "inactive", label: "Inactive" },
        ],
      }),
    });

    const entityWithSelectArb = selectFieldArb.chain((field) =>
      fc.record({
        id: fc.uuid(),
        name: fc.constant("TestEntity"),
        fields: fc.constant([field]),
        createdAt: fc.constant(Date.now()),
        updatedAt: fc.constant(Date.now()),
      }),
    );

    fc.assert(
      fc.property(entityWithSelectArb, (entity) => {
        const schema = createRuntimeSchema(entity);

        // Valid: one of the choices
        expect(schema.safeParse({ status: "active" }).success).toBe(true);
        expect(schema.safeParse({ status: "inactive" }).success).toBe(true);

        // Invalid: not one of the choices
        expect(schema.safeParse({ status: "pending" }).success).toBe(false);
        expect(schema.safeParse({ status: "" }).success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: runtime schema produces consistent validation results", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        // Create schema twice
        const schema1 = createRuntimeSchema(entity);
        const schema2 = createRuntimeSchema(entity);

        // Generate test data
        const validDataArb = generateValidDataArb(entity);

        fc.assert(
          fc.property(validDataArb, (data) => {
            // Both schemas should produce the same result
            const result1 = schema1.safeParse(data);
            const result2 = schema2.safeParse(data);

            expect(result1.success).toBe(result2.success);
          }),
          { numRuns: 10 },
        );
      }),
      { numRuns: 100 },
    );
  });
});
