/**
 * Property-based tests for Feature Exporter
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder-v2, Property 5: Export Generates All Required Files**
 * **Feature: low-code-builder-v2, Property 6: Route Configuration Generated**
 * **Validates: Requirements 4.1-4.5, 6.1, 6.2**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { generateFeatureFiles, generateRouteConfig } from "./featureExporter";
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
 * **Feature: low-code-builder-v2, Property 5: Export Generates All Required Files**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 *
 * For any valid EntityDefinition, the feature exporter SHALL generate files for:
 * types, components (Form, Card, List), pages (List, Create, Edit), services, and index files.
 */
describe("Property 5: Export Generates All Required Files", () => {
  it("property: generates types file with correct path", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const files = generateFeatureFiles(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Should have types file
        const typesFile = files.find((f) =>
          f.path.includes(`types/${entityLower}.ts`),
        );
        expect(typesFile).toBeDefined();
        expect(typesFile!.content).toContain(`interface ${entity.name}`);
        expect(typesFile!.content).toContain("z.object");
      }),
      { numRuns: 100 },
    );
  });

  it("property: generates all component files (Form, Card, List)", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const files = generateFeatureFiles(entity);

        // Should have Form component
        const formFile = files.find((f) =>
          f.path.includes(`${entity.name}Form.tsx`),
        );
        expect(formFile).toBeDefined();
        expect(formFile!.content).toContain(`${entity.name}Form`);

        // Should have Card component
        const cardFile = files.find((f) =>
          f.path.includes(`${entity.name}Card.tsx`),
        );
        expect(cardFile).toBeDefined();
        expect(cardFile!.content).toContain(`${entity.name}Card`);

        // Should have List component
        const listFile = files.find((f) =>
          f.path.includes(`${entity.name}List.tsx`),
        );
        expect(listFile).toBeDefined();
        expect(listFile!.content).toContain(`${entity.name}List`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: generates all page files (ListPage, CreatePage, EditPage)", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const files = generateFeatureFiles(entity);

        // Should have ListPage
        const listPage = files.find((f) =>
          f.path.includes(`${entity.name}ListPage.tsx`),
        );
        expect(listPage).toBeDefined();
        expect(listPage!.content).toContain(`${entity.name}ListPage`);

        // Should have CreatePage
        const createPage = files.find((f) =>
          f.path.includes(`${entity.name}CreatePage.tsx`),
        );
        expect(createPage).toBeDefined();
        expect(createPage!.content).toContain(`${entity.name}CreatePage`);

        // Should have EditPage
        const editPage = files.find((f) =>
          f.path.includes(`${entity.name}EditPage.tsx`),
        );
        expect(editPage).toBeDefined();
        expect(editPage!.content).toContain(`${entity.name}EditPage`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: generates service file with CRUD operations", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const files = generateFeatureFiles(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Should have service file
        const serviceFile = files.find((f) =>
          f.path.includes(`${entityLower}Service.ts`),
        );
        expect(serviceFile).toBeDefined();
        expect(serviceFile!.content).toContain(`getAll${entity.name}s`);
        expect(serviceFile!.content).toContain(`get${entity.name}ById`);
        expect(serviceFile!.content).toContain(`create${entity.name}`);
        expect(serviceFile!.content).toContain(`update${entity.name}`);
        expect(serviceFile!.content).toContain(`delete${entity.name}`);
        expect(serviceFile!.content).toContain("localStorage");
      }),
      { numRuns: 100 },
    );
  });

  it("property: generates all index files for proper exports", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const files = generateFeatureFiles(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);
        const basePath = `src/features/${entityLower}`;

        // Should have types index
        const typesIndex = files.find(
          (f) => f.path === `${basePath}/types/index.ts`,
        );
        expect(typesIndex).toBeDefined();

        // Should have components index
        const componentsIndex = files.find(
          (f) => f.path === `${basePath}/components/index.ts`,
        );
        expect(componentsIndex).toBeDefined();
        expect(componentsIndex!.content).toContain(`${entity.name}Form`);
        expect(componentsIndex!.content).toContain(`${entity.name}Card`);
        expect(componentsIndex!.content).toContain(`${entity.name}List`);

        // Should have pages index
        const pagesIndex = files.find(
          (f) => f.path === `${basePath}/pages/index.ts`,
        );
        expect(pagesIndex).toBeDefined();
        expect(pagesIndex!.content).toContain(`${entity.name}ListPage`);
        expect(pagesIndex!.content).toContain(`${entity.name}CreatePage`);
        expect(pagesIndex!.content).toContain(`${entity.name}EditPage`);

        // Should have services index
        const servicesIndex = files.find(
          (f) => f.path === `${basePath}/services/index.ts`,
        );
        expect(servicesIndex).toBeDefined();

        // Should have feature index
        const featureIndex = files.find(
          (f) => f.path === `${basePath}/index.ts`,
        );
        expect(featureIndex).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: file paths follow correct naming convention", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const files = generateFeatureFiles(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);
        const basePath = `src/features/${entityLower}`;

        // All files should be under the correct base path
        for (const file of files) {
          expect(file.path.startsWith(basePath)).toBe(true);
        }

        // Should have exactly 13 files
        // types: 2 (entity.ts, index.ts)
        // components: 4 (Form, Card, List, index.ts)
        // pages: 4 (ListPage, CreatePage, EditPage, index.ts)
        // services: 2 (service.ts, index.ts)
        // feature: 1 (index.ts)
        expect(files.length).toBe(13);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: low-code-builder-v2, Property 6: Route Configuration Generated**
 * **Validates: Requirements 6.1, 6.2**
 *
 * For any valid EntityDefinition, the route generator SHALL produce route
 * configuration code that includes paths for list, create, and edit pages.
 */
describe("Property 6: Route Configuration Generated", () => {
  it("property: route config contains list route", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const routeConfig = generateRouteConfig(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Should contain list route
        expect(routeConfig).toContain(`/${entityLower}s"`);
        expect(routeConfig).toContain(`${entity.name}ListPage`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: route config contains create route", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const routeConfig = generateRouteConfig(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Should contain create route
        expect(routeConfig).toContain(`/${entityLower}s/new"`);
        expect(routeConfig).toContain(`${entity.name}CreatePage`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: route config contains edit route with id param", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const routeConfig = generateRouteConfig(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Should contain edit route with :id param
        expect(routeConfig).toContain(`/${entityLower}s/:id/edit"`);
        expect(routeConfig).toContain(`${entity.name}EditPage`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: route config contains import statement", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const routeConfig = generateRouteConfig(entity);
        const entityLower =
          entity.name.charAt(0).toLowerCase() + entity.name.slice(1);

        // Should contain import statement
        expect(routeConfig).toContain("import {");
        expect(routeConfig).toContain(`from "./features/${entityLower}"`);
        expect(routeConfig).toContain(`${entity.name}ListPage`);
        expect(routeConfig).toContain(`${entity.name}CreatePage`);
        expect(routeConfig).toContain(`${entity.name}EditPage`);
      }),
      { numRuns: 100 },
    );
  });

  it("property: route config follows React Router pattern", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const routeConfig = generateRouteConfig(entity);

        // Should use Route component pattern
        expect(routeConfig).toContain("<Route");
        expect(routeConfig).toContain("path=");
        expect(routeConfig).toContain("element={");
        expect(routeConfig).toContain("/>");
      }),
      { numRuns: 100 },
    );
  });
});
