/**
 * Property-based tests for DynamicForm component
 * Using fast-check for property-based testing
 *
 * **Feature: low-code-builder, Property 7: Dynamic Form Renders and Validates**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 *
 * For any valid EntityDefinition:
 * - The DynamicForm SHALL render exactly N form fields for N field definitions
 * - Submitting valid data SHALL succeed and return the data
 * - Submitting invalid data SHALL show validation errors
 */

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import * as fc from "fast-check";
import { DynamicForm } from "./DynamicForm";
import type {
  EntityDefinition,
  FieldDefinition,
  FieldType,
  SelectChoice,
} from "../types/entityDefinition";

// Mock ResizeObserver for Radix UI components
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Clean up after each test to prevent state leakage
afterEach(() => {
  cleanup();
});

// ============================================
// Arbitraries (Generators)
// ============================================

// Valid camelCase field key generator
const validFieldKeyArb: fc.Arbitrary<string> = fc
  .array(fc.constantFrom("a", "b", "c", "d", "e", "f", "g", "h"), {
    minLength: 3,
    maxLength: 8,
  })
  .map((arr) => arr.join(""));

// Valid PascalCase entity name generator
const validEntityNameArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom("A", "B", "C", "D", "E", "F", "G", "H"),
    fc.array(fc.constantFrom("a", "b", "c", "d", "e", "f", "g", "h"), {
      minLength: 2,
      maxLength: 6,
    }),
  )
  .map(([first, rest]) => first + rest.join(""));

// Valid label generator (simple readable labels)
const validLabelArb: fc.Arbitrary<string> = fc
  .tuple(
    fc.constantFrom("A", "B", "C", "D", "E", "F", "G", "H"),
    fc.array(fc.constantFrom("a", "b", "c", "d", "e", "f", "g", "h", " "), {
      minLength: 2,
      maxLength: 10,
    }),
  )
  .map(([first, rest]) => first + rest.join(""));

// Select choice generator
const selectChoiceArb: fc.Arbitrary<SelectChoice> = fc
  .tuple(
    fc.array(fc.constantFrom("a", "b", "c", "d", "e"), {
      minLength: 2,
      maxLength: 5,
    }),
    fc.array(fc.constantFrom("A", "B", "C", "D", "E", "a", "b", "c"), {
      minLength: 2,
      maxLength: 8,
    }),
  )
  .map(([valueArr, labelArr]) => ({
    value: valueArr.join(""),
    label: labelArr.join(""),
  }));

// Text field definition generator
const textFieldArb: fc.Arbitrary<FieldDefinition> = fc.record({
  id: fc.uuid(),
  key: validFieldKeyArb,
  label: validLabelArb,
  type: fc.constant("text" as FieldType),
  required: fc.boolean(),
  options: fc.constant(undefined),
});

// Number field definition generator
const numberFieldArb: fc.Arbitrary<FieldDefinition> = fc.record({
  id: fc.uuid(),
  key: validFieldKeyArb,
  label: validLabelArb,
  type: fc.constant("number" as FieldType),
  required: fc.boolean(),
  options: fc.constant(undefined),
});

// Select field definition generator (with valid choices)
const selectFieldArb: fc.Arbitrary<FieldDefinition> = fc
  .array(selectChoiceArb, { minLength: 2, maxLength: 4 })
  .chain((choices) => {
    // Ensure unique values
    const uniqueChoices = choices.map((choice, idx) => ({
      ...choice,
      value: `${choice.value}${idx}`,
    }));

    return fc.record({
      id: fc.uuid(),
      key: validFieldKeyArb,
      label: validLabelArb,
      type: fc.constant("select" as FieldType),
      required: fc.boolean(),
      options: fc.constant({ choices: uniqueChoices }),
    });
  });

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
  .array(fieldDefinitionArb, { minLength: 1, maxLength: 4 })
  .chain((fields) => {
    // Ensure unique keys by appending index
    const uniqueFields = fields.map((field, index) => ({
      ...field,
      key: `field${index}`,
      label: `Field ${index}`,
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
 * **Feature: low-code-builder, Property 7: Dynamic Form Renders and Validates**
 * **Validates: Requirements 3.1, 3.2, 3.3**
 */
describe("Property 7: Dynamic Form Renders and Validates", () => {
  it("property: renders exactly N form fields for N field definitions", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const { container, unmount } = render(
          <DynamicForm entityDefinition={entity} />,
        );

        // Count form items (each field should have a FormItem wrapper)
        const formItems = container.querySelectorAll('[data-slot="form-item"]');
        expect(formItems.length).toBe(entity.fields.length);

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("property: renders correct input types for each field type", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const { container, unmount } = render(
          <DynamicForm entityDefinition={entity} />,
        );

        for (const field of entity.fields) {
          switch (field.type) {
            case "text": {
              // Should have a text input
              const input = container.querySelector(
                `input[name="${field.key}"]`,
              );
              expect(input).toBeTruthy();
              expect(input?.getAttribute("type")).not.toBe("number");
              break;
            }
            case "number": {
              // Should have a number input
              const input = container.querySelector(
                `input[name="${field.key}"]`,
              );
              expect(input).toBeTruthy();
              expect(input?.getAttribute("type")).toBe("number");
              break;
            }
            case "boolean": {
              // Should have a switch
              const switchEl = container.querySelector('[data-slot="switch"]');
              expect(switchEl).toBeTruthy();
              break;
            }
            case "select": {
              // Should have a select trigger
              const selectTrigger = container.querySelector(
                '[data-slot="select-trigger"]',
              );
              expect(selectTrigger).toBeTruthy();
              break;
            }
          }
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("property: displays field labels correctly", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const { container, unmount } = render(
          <DynamicForm entityDefinition={entity} />,
        );

        for (const field of entity.fields) {
          const expectedLabel = field.label || field.key;
          // Label should be visible in the document - use queryAllByText to handle multiple
          const labelElements = container.querySelectorAll(
            '[data-slot="form-label"]',
          );
          const hasLabel = Array.from(labelElements).some((el) =>
            el.textContent?.includes(expectedLabel),
          );
          expect(hasLabel).toBe(true);
        }

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("property: shows required indicator for required fields", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const { container, unmount } = render(
          <DynamicForm entityDefinition={entity} />,
        );

        const requiredFields = entity.fields.filter((f) => f.required);
        const requiredIndicators =
          container.querySelectorAll(".text-destructive");

        // Should have at least as many required indicators as required fields
        expect(requiredIndicators.length).toBeGreaterThanOrEqual(
          requiredFields.length,
        );

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("property: submit button is always present", () => {
    fc.assert(
      fc.property(entityDefinitionArb, (entity) => {
        const { unmount } = render(<DynamicForm entityDefinition={entity} />);

        const submitButton = screen.getByRole("button", { name: /submit/i });
        expect(submitButton).toBeTruthy();

        unmount();
      }),
      { numRuns: 100 },
    );
  });

  it("property: onSubmit callback is called with form data on valid submission", async () => {
    // Use a simpler entity for this test to avoid complexity
    const simpleEntity: EntityDefinition = {
      id: "test-id",
      name: "TestEntity",
      fields: [
        {
          id: "field-1",
          key: "textField",
          label: "Text Field",
          type: "text",
          required: false,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<DynamicForm entityDefinition={simpleEntity} onSubmit={onSubmit} />);

    // Fill in the text field
    const input = screen.getByPlaceholderText(/enter text field/i);
    await user.type(input, "test value");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    // Wait for form submission
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    // Verify the data was passed
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ textField: "test value" }),
    );
  });

  it("property: displays submitted data after successful submission", async () => {
    const simpleEntity: EntityDefinition = {
      id: "test-id",
      name: "TestEntity",
      fields: [
        {
          id: "field-1",
          key: "name",
          label: "Name",
          type: "text",
          required: false,
        },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const user = userEvent.setup();

    render(<DynamicForm entityDefinition={simpleEntity} />);

    // Fill in the text field
    const input = screen.getByPlaceholderText(/enter name/i);
    await user.type(input, "John Doe");

    // Submit the form
    const submitButton = screen.getByRole("button", { name: /submit/i });
    await user.click(submitButton);

    // Wait for submitted data to appear
    await waitFor(() => {
      expect(screen.getByText(/submitted data/i)).toBeTruthy();
    });

    // Verify the submitted data is displayed
    expect(screen.getByText(/John Doe/)).toBeTruthy();
  });

  it("property: empty entity shows placeholder message", () => {
    const emptyEntity: EntityDefinition = {
      id: "empty-id",
      name: "EmptyEntity",
      fields: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    render(<DynamicForm entityDefinition={emptyEntity} />);

    // Should show placeholder message
    expect(
      screen.getByText(/add fields to see the form preview/i),
    ).toBeTruthy();
  });
});
