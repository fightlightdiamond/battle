/**
 * Property-based tests for Page Generator
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder-v2, Property 3: All Page Types Generated**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  generateListPage,
  generateCreatePage,
  generateEditPage,
} from "./pageGenerator";
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
 * **Feature: low-code-builder-v2, Property 3: All Page Types Generated**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4**
 *
 * For any valid EntityDefinition, the page generator SHALL produce
 * ListPage, CreatePage, and EditPage code strings that contain AppLayout import.
 */
describe("Property 3: All Page Types Generated", () => {
  it("property: ListPage is generated with entity name and AppLayout", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const listPageCode = generateListPage(entity);

        // ListPage code should be non-empty
        expect(listPageCode.length).toBeGreaterThan(0);

        // ListPage code should contain entity name
        expect(listPageCode).toContain(entity.name);

        // ListPage code should import AppLayout
        expect(listPageCode).toContain("AppLayout");
        expect(listPageCode).toContain('@/components/layouts"');

        // ListPage should have create button with Link
        expect(listPageCode).toContain("Link");
        expect(listPageCode).toContain("Plus");
        expect(listPageCode).toContain("/new");
      }),
      { numRuns: 100 },
    );
  });

  it("property: CreatePage is generated with entity name and AppLayout", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const createPageCode = generateCreatePage(entity);

        // CreatePage code should be non-empty
        expect(createPageCode.length).toBeGreaterThan(0);

        // CreatePage code should contain entity name
        expect(createPageCode).toContain(entity.name);

        // CreatePage code should import AppLayout
        expect(createPageCode).toContain("AppLayout");
        expect(createPageCode).toContain('@/components/layouts"');

        // CreatePage should have navigation back to list
        expect(createPageCode).toContain("useNavigate");
        expect(createPageCode).toContain("backTo");
        expect(createPageCode).toContain("Back to List");

        // CreatePage should use Form component
        expect(createPageCode).toContain(`${entity.name}Form`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: EditPage is generated with entity name and AppLayout", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const editPageCode = generateEditPage(entity);

        // EditPage code should be non-empty
        expect(editPageCode.length).toBeGreaterThan(0);

        // EditPage code should contain entity name
        expect(editPageCode).toContain(entity.name);

        // EditPage code should import AppLayout
        expect(editPageCode).toContain("AppLayout");
        expect(editPageCode).toContain('@/components/layouts"');

        // EditPage should use useParams for id
        expect(editPageCode).toContain("useParams");
        expect(editPageCode).toContain("id");

        // EditPage should have loading state handling
        expect(editPageCode).toContain("isLoading");
        expect(editPageCode).toContain("Skeleton");

        // EditPage should use Form component
        expect(editPageCode).toContain(`${entity.name}Form`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: All pages use consistent routing patterns", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const listPageCode = generateListPage(entity);
        const createPageCode = generateCreatePage(entity);
        const editPageCode = generateEditPage(entity);

        // Get lowercase entity name for route
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // ListPage should link to create page
        expect(listPageCode).toContain(`/${entityLower}s/new`);

        // CreatePage should navigate back to list
        expect(createPageCode).toContain(`/${entityLower}s`);

        // EditPage should navigate back to list
        expect(editPageCode).toContain(`/${entityLower}s`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: Pages import required service functions", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const listPageCode = generateListPage(entity);
        const createPageCode = generateCreatePage(entity);
        const editPageCode = generateEditPage(entity);

        // ListPage should import getAll and delete
        expect(listPageCode).toContain(`getAll${entity.name}s`);
        expect(listPageCode).toContain(`delete${entity.name}`);

        // CreatePage should import create
        expect(createPageCode).toContain(`create${entity.name}`);

        // EditPage should import getById and update
        expect(editPageCode).toContain(`get${entity.name}ById`);
        expect(editPageCode).toContain(`update${entity.name}`);
      }),
      { numRuns: 100 },
    );
  });
});
