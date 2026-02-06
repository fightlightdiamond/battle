/**
 * Property-based tests for Component Generator
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder-v2, Property 1: All Component Types Generated**
 * **Feature: low-code-builder-v2, Property 2: Components Use shadcn/ui**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  generateFormComponent,
  generateCardComponent,
  generateListComponent,
} from "./componentGenerator";
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
 * **Feature: low-code-builder-v2, Property 1: All Component Types Generated**
 * **Validates: Requirements 1.1, 1.2, 1.3**
 *
 * For any valid EntityDefinition, the component generator SHALL produce
 * Form, Card, and List component code strings that are non-empty and
 * contain the entity name.
 */
describe("Property 1: All Component Types Generated", () => {
  it("property: Form component is generated with entity name", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const formCode = generateFormComponent(entity);

        // Form code should be non-empty
        expect(formCode.length).toBeGreaterThan(0);

        // Form code should contain entity name
        expect(formCode).toContain(entity.name);

        // Form code should contain Form component structure
        expect(formCode).toContain("FormField");
        expect(formCode).toContain("useForm");
      }),
      { numRuns: 100 },
    );
  });

  it("property: Card component is generated with entity name", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const cardCode = generateCardComponent(entity);

        // Card code should be non-empty
        expect(cardCode.length).toBeGreaterThan(0);

        // Card code should contain entity name
        expect(cardCode).toContain(entity.name);

        // Card code should contain Card component structure
        expect(cardCode).toContain("CardContent");
      }),
      { numRuns: 100 },
    );
  });

  it("property: List component is generated with entity name", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const listCode = generateListComponent(entity);

        // List code should be non-empty
        expect(listCode.length).toBeGreaterThan(0);

        // List code should contain entity name
        expect(listCode).toContain(entity.name);

        // List code should contain mapping structure
        expect(listCode).toContain(".map(");

        // List code should contain delete button
        expect(listCode).toContain("onDelete");
        expect(listCode).toContain("Trash2");
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: low-code-builder-v2, Property 2: Components Use shadcn/ui**
 * **Validates: Requirements 1.4**
 *
 * For any valid EntityDefinition, all generated component code SHALL
 * contain imports from @/components/ui/.
 */
describe("Property 2: Components Use shadcn/ui", () => {
  it("property: Form component imports from @/components/ui/", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const formCode = generateFormComponent(entity);

        // Form should import from shadcn/ui
        expect(formCode).toContain('@/components/ui/button"');
        expect(formCode).toContain('@/components/ui/input"');
        expect(formCode).toContain('@/components/ui/form"');
      }),
      { numRuns: 100 },
    );
  });

  it("property: Card component imports from @/components/ui/", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const cardCode = generateCardComponent(entity);

        // Card should import from shadcn/ui
        expect(cardCode).toContain('@/components/ui/card"');
      }),
      { numRuns: 100 },
    );
  });

  it("property: List component imports from @/components/ui/", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const listCode = generateListComponent(entity);

        // List should import from shadcn/ui
        expect(listCode).toContain('@/components/ui/card"');
        expect(listCode).toContain('@/components/ui/button"');
      }),
      { numRuns: 100 },
    );
  });

  it("property: Form with select field imports Select component", () => {
    // Create entity with at least one select field
    const entityWithSelectArb = fc
      .array(selectFieldArb, { minLength: 1, maxLength: 3 })
      .chain((selectFields) => {
        const uniqueFields = selectFields.map((field, index) => ({
          ...field,
          key: `select${index}`,
        }));
        return fc.record({
          id: fc.uuid(),
          name: validEntityNameArb,
          fields: fc.constant(uniqueFields),
          createdAt: fc.integer({ min: 0, max: Date.now() }),
          updatedAt: fc.integer({ min: 0, max: Date.now() }),
        });
      });

    fc.assert(
      fc.property(entityWithSelectArb, (entity) => {
        const formCode = generateFormComponent(entity);

        // Form with select should import Select component
        expect(formCode).toContain('@/components/ui/select"');
        expect(formCode).toContain("SelectTrigger");
        expect(formCode).toContain("SelectContent");
        expect(formCode).toContain("SelectItem");
      }),
      { numRuns: 100 },
    );
  });

  it("property: Form with boolean field imports Switch component", () => {
    // Create entity with at least one boolean field
    const entityWithBooleanArb = fc
      .array(booleanFieldArb, { minLength: 1, maxLength: 3 })
      .chain((booleanFields) => {
        const uniqueFields = booleanFields.map((field, index) => ({
          ...field,
          key: `bool${index}`,
        }));
        return fc.record({
          id: fc.uuid(),
          name: validEntityNameArb,
          fields: fc.constant(uniqueFields),
          createdAt: fc.integer({ min: 0, max: Date.now() }),
          updatedAt: fc.integer({ min: 0, max: Date.now() }),
        });
      });

    fc.assert(
      fc.property(entityWithBooleanArb, (entity) => {
        const formCode = generateFormComponent(entity);

        // Form with boolean should import Switch component
        expect(formCode).toContain('@/components/ui/switch"');
        expect(formCode).toContain("Switch");
      }),
      { numRuns: 100 },
    );
  });
});
