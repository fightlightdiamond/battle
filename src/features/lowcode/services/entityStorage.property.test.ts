/**
 * Property-based tests for Entity Storage
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder, Property 8: Persistence Round-Trip**
 * **Validates: Requirements 4.1, 4.3**
 *
 * For any valid EntityDefinition, saving then loading SHALL produce
 * an equivalent EntityDefinition (same name, same fields with same properties).
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  saveEntity,
  loadEntity,
  deleteEntity,
  listEntities,
  clearAllEntities,
} from "./entityStorage";
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
  .array(fieldDefinitionArb, { minLength: 0, maxLength: 5 })
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
// Helper Functions
// ============================================

/**
 * Compares two EntityDefinitions for structural equality
 * (ignoring updatedAt which may change on save)
 */
function areEntitiesEquivalent(
  a: EntityDefinition,
  b: EntityDefinition,
): boolean {
  // Compare id and name
  if (a.id !== b.id || a.name !== b.name) {
    return false;
  }

  // Compare fields length
  if (a.fields.length !== b.fields.length) {
    return false;
  }

  // Compare each field
  for (let i = 0; i < a.fields.length; i++) {
    const fieldA = a.fields[i];
    const fieldB = b.fields[i];

    if (
      fieldA.id !== fieldB.id ||
      fieldA.key !== fieldB.key ||
      fieldA.label !== fieldB.label ||
      fieldA.type !== fieldB.type ||
      fieldA.required !== fieldB.required
    ) {
      return false;
    }

    // Compare options (deep comparison)
    if (JSON.stringify(fieldA.options) !== JSON.stringify(fieldB.options)) {
      return false;
    }
  }

  return true;
}

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: low-code-builder, Property 8: Persistence Round-Trip**
 * **Validates: Requirements 4.1, 4.3**
 */
describe("Property 8: Persistence Round-Trip", () => {
  beforeEach(() => {
    // Clear storage before each test
    clearAllEntities();
  });

  it("property: saving then loading an entity produces equivalent entity", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        // Save the entity
        const savedEntity = saveEntity(entity);

        // Load the entity back
        const loadedEntity = loadEntity(entity.id);

        // Verify loaded entity exists
        expect(loadedEntity).not.toBeNull();

        // Verify structural equivalence (id, name, fields)
        expect(areEntitiesEquivalent(savedEntity, loadedEntity!)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: saving multiple entities preserves all of them", () => {
    fc.assert(
      fc.property(
        fc.array(entityDefinitionArb, { minLength: 1, maxLength: 10 }),
        (entities) => {
          // Clear storage at start of each iteration
          clearAllEntities();

          // Ensure unique IDs
          const uniqueEntities = entities.map((e, i) => ({
            ...e,
            id: `${e.id}-${i}`,
          }));

          // Save all entities
          for (const entity of uniqueEntities) {
            saveEntity(entity);
          }

          // List all entities
          const listedEntities = listEntities();

          // Verify all entities are present
          expect(listedEntities.length).toBe(uniqueEntities.length);

          // Verify each entity can be loaded
          for (const entity of uniqueEntities) {
            const loaded = loadEntity(entity.id);
            expect(loaded).not.toBeNull();
            expect(loaded!.id).toBe(entity.id);
            expect(loaded!.name).toBe(entity.name);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: updating an entity preserves the update", () => {
    fc.assert(
      fc.property(
        entityDefinitionArb,
        validEntityNameArb,
        (entity, newName) => {
          // Save original entity
          saveEntity(entity);

          // Update with new name
          const updatedEntity: EntityDefinition = {
            ...entity,
            name: newName,
          };
          saveEntity(updatedEntity);

          // Load and verify
          const loaded = loadEntity(entity.id);
          expect(loaded).not.toBeNull();
          expect(loaded!.name).toBe(newName);

          // Verify only one entity exists with this ID
          const allEntities = listEntities();
          const matchingEntities = allEntities.filter(
            (e) => e.id === entity.id,
          );
          expect(matchingEntities.length).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: deleting an entity removes it from storage", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        // Save the entity
        saveEntity(entity);

        // Verify it exists
        expect(loadEntity(entity.id)).not.toBeNull();

        // Delete the entity
        const deleted = deleteEntity(entity.id);
        expect(deleted).toBe(true);

        // Verify it no longer exists
        expect(loadEntity(entity.id)).toBeNull();

        // Verify it's not in the list
        const allEntities = listEntities();
        expect(allEntities.find((e) => e.id === entity.id)).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: listEntities returns entities sorted by updatedAt (most recent first)", () => {
    fc.assert(
      fc.property(
        fc.array(entityDefinitionArb, { minLength: 2, maxLength: 5 }),
        (entities) => {
          // Clear and save entities with different timestamps
          clearAllEntities();

          // Ensure unique IDs and save with incrementing timestamps
          const uniqueEntities = entities.map((e, i) => ({
            ...e,
            id: `${e.id}-${i}`,
            updatedAt: Date.now() + i * 1000, // Ensure different timestamps
          }));

          for (const entity of uniqueEntities) {
            saveEntity(entity);
          }

          // List entities
          const listed = listEntities();

          // Verify sorted by updatedAt descending
          for (let i = 1; i < listed.length; i++) {
            expect(listed[i - 1].updatedAt).toBeGreaterThanOrEqual(
              listed[i].updatedAt,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: field options are preserved through round-trip", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        // Save the entity
        saveEntity(entity);

        // Load the entity back
        const loaded = loadEntity(entity.id);
        expect(loaded).not.toBeNull();

        // Verify each field's options are preserved
        for (let i = 0; i < entity.fields.length; i++) {
          const originalField = entity.fields[i];
          const loadedField = loaded!.fields[i];

          // Deep compare options
          expect(JSON.stringify(loadedField.options)).toBe(
            JSON.stringify(originalField.options),
          );
        }
      }),
      { numRuns: 100 },
    );
  });
});
