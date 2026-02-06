/**
 * Property-based tests for Service Generator
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder-v2, Property 4: Service Has Complete CRUD**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateService } from "./serviceGenerator";
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
      { minLength: 1, maxLength: 15 },
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

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: low-code-builder-v2, Property 4: Service Has Complete CRUD**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * For any valid EntityDefinition, the generated service code SHALL contain
 * all CRUD function names (getAll, getById, create, update, delete) and
 * localStorage references.
 */
describe("Property 4: Service Has Complete CRUD", () => {
  it("property: Service contains all CRUD function names", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const serviceCode = generateService(entity);

        // Service code should be non-empty
        expect(serviceCode.length).toBeGreaterThan(0);

        // Service code should contain entity name
        expect(serviceCode).toContain(entity.name);

        // Service should contain getAll function
        expect(serviceCode).toContain(`getAll${entity.name}s`);

        // Service should contain getById function
        expect(serviceCode).toContain(`get${entity.name}ById`);

        // Service should contain create function
        expect(serviceCode).toContain(`create${entity.name}`);

        // Service should contain update function
        expect(serviceCode).toContain(`update${entity.name}`);

        // Service should contain delete function
        expect(serviceCode).toContain(`delete${entity.name}`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: Service uses localStorage for persistence", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const serviceCode = generateService(entity);

        // Service should reference localStorage
        expect(serviceCode).toContain("localStorage.getItem");
        expect(serviceCode).toContain("localStorage.setItem");

        // Service should have a STORAGE_KEY constant
        expect(serviceCode).toContain("STORAGE_KEY");
      }),
      { numRuns: 100 },
    );
  });

  it("property: Service includes proper TypeScript types", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const serviceCode = generateService(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Service should import the entity type
        expect(serviceCode).toContain(`import type { ${entity.name} }`);
        expect(serviceCode).toContain(`from "../types/${entityLower}"`);

        // Service should use proper return types
        expect(serviceCode).toContain(`${entity.name}[]`);
        expect(serviceCode).toContain(`${entity.name} | undefined`);

        // Service should use Omit for create function
        expect(serviceCode).toContain(`Omit<${entity.name}, "id">`);

        // Service should use Partial for update function
        expect(serviceCode).toContain(`Partial<${entity.name}>`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: Service generates unique IDs using crypto.randomUUID", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const serviceCode = generateService(entity);

        // Service should use crypto.randomUUID for ID generation
        expect(serviceCode).toContain("crypto.randomUUID()");
      }),
      { numRuns: 100 },
    );
  });
});
