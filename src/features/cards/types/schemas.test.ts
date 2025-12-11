import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { cardFormSchema, imageSchema } from "./schemas";

/**
 * **Feature: card-game-manager, Property 3: Invalid card validation rejection**
 * **Validates: Requirements 2.3, 2.4, 2.5, 2.7, 2.8**
 *
 * For any CardFormInput with invalid values (empty/whitespace name, negative ATK,
 * HP < 1, invalid image type, or image > 2MB), the validation SHALL reject the
 * input and return appropriate error messages.
 */
describe("Property 3: Invalid card validation rejection", () => {
  // Helper to create a mock File
  const createMockFile = (name: string, size: number, type: string): File => {
    const content = new Uint8Array(size);
    const blob = new Blob([content], { type });
    return new File([blob], name, { type });
  };

  it("rejects empty or whitespace-only names (Requirement 2.3)", () => {
    // Generate empty strings or whitespace-only strings
    const whitespaceArb = fc.oneof(
      fc.constant(""),
      fc
        .array(fc.constantFrom(" ", "\t", "\n", "\r"), {
          minLength: 1,
          maxLength: 10,
        })
        .map((chars: string[]) => chars.join(""))
    );

    fc.assert(
      fc.property(whitespaceArb, (emptyOrWhitespaceName) => {
        const input = {
          name: emptyOrWhitespaceName,
          atk: 10,
          hp: 10,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const nameErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "name"
          );
          expect(nameErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects negative ATK values (Requirement 2.4)", () => {
    fc.assert(
      fc.property(fc.integer({ max: -1 }), (negativeAtk) => {
        const input = {
          name: "Valid Card",
          atk: negativeAtk,
          hp: 10,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const atkErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "atk"
          );
          expect(atkErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects HP values less than 1 (Requirement 2.5)", () => {
    fc.assert(
      fc.property(fc.integer({ max: 0 }), (invalidHp) => {
        const input = {
          name: "Valid Card",
          atk: 10,
          hp: invalidHp,
          image: null,
        };
        const result = cardFormSchema.safeParse(input);
        expect(result.success).toBe(false);
        if (!result.success) {
          const hpErrors = result.error.issues.filter(
            (issue) => issue.path[0] === "hp"
          );
          expect(hpErrors.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("rejects invalid image types (Requirement 2.7)", () => {
    const invalidTypes = [
      "image/gif",
      "image/bmp",
      "image/svg+xml",
      "application/pdf",
      "text/plain",
      "video/mp4",
    ];

    fc.assert(
      fc.property(fc.constantFrom(...invalidTypes), (invalidType) => {
        const file = createMockFile("test.file", 1024, invalidType);
        const result = imageSchema.safeParse(file);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("rejects images larger than 2MB (Requirement 2.8)", () => {
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB

    fc.assert(
      fc.property(
        fc.integer({ min: MAX_SIZE + 1, max: MAX_SIZE + 1024 * 1024 }), // 2MB+1 to 3MB
        (oversizedBytes) => {
          const file = createMockFile("large.png", oversizedBytes, "image/png");
          const result = imageSchema.safeParse(file);
          expect(result.success).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid card form inputs", () => {
    fc.assert(
      fc.property(
        fc.record({
          name: fc
            .string({ minLength: 1, maxLength: 100 })
            .filter((s) => s.trim().length > 0),
          atk: fc.integer({ min: 0, max: 10000 }),
          hp: fc.integer({ min: 1, max: 10000 }),
        }),
        ({ name, atk, hp }) => {
          const input = {
            name,
            atk,
            hp,
            image: null,
          };
          const result = cardFormSchema.safeParse(input);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("accepts valid image types (PNG, JPG, WEBP)", () => {
    const validTypes = ["image/png", "image/jpeg", "image/webp"];

    fc.assert(
      fc.property(
        fc.constantFrom(...validTypes),
        fc.integer({ min: 1, max: 2 * 1024 * 1024 }), // 1 byte to 2MB
        (validType, size) => {
          const file = createMockFile("test.img", size, validType);
          const result = imageSchema.safeParse(file);
          expect(result.success).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
