import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import "fake-indexeddb/auto";

// Mock OPFS image storage with in-memory implementation
vi.mock("./imageStorage", () => import("./__mocks__/imageStorage"));

import { CardService } from "./cardService";
import { deleteDB } from "./db";
import { clearImageStore } from "./__mocks__/imageStorage";
import type { CardFormInput } from "../types";

/**
 * **Feature: card-game-manager, Property 1: Card serialization round-trip**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 *
 * For any valid Card object, serializing to IndexedDB and then deserializing
 * back SHALL produce an equivalent Card object with all properties preserved exactly.
 */
describe("Property 1: Card serialization round-trip", () => {
  beforeEach(async () => {
    clearImageStore();
    await CardService.clear();
  });

  afterEach(async () => {
    clearImageStore();
    await deleteDB();
  });

  // Arbitrary for valid card form input (without image for simplicity)
  const validCardFormInputArb = fc.record({
    name: fc
      .string({ minLength: 1, maxLength: 100 })
      .filter((s) => s.trim().length > 0),
    atk: fc.integer({ min: 0, max: 10000 }),
    hp: fc.integer({ min: 1, max: 10000 }),
    image: fc.constant(null as File | null),
  });

  it("preserves card properties after create and retrieve", async () => {
    await fc.assert(
      fc.asyncProperty(validCardFormInputArb, async (input: CardFormInput) => {
        // Create card
        const created = await CardService.create(input);

        // Retrieve card by ID
        const retrieved = await CardService.getById(created.id);

        // Verify round-trip preserves all properties
        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(created.id);
        expect(retrieved!.name).toBe(input.name);
        expect(retrieved!.atk).toBe(input.atk);
        expect(retrieved!.hp).toBe(input.hp);
        expect(retrieved!.createdAt).toBe(created.createdAt);
        expect(retrieved!.updatedAt).toBe(created.updatedAt);

        // Clean up for next iteration
        await CardService.delete(created.id);
      }),
      { numRuns: 100 }
    );
  });

  it("preserves card properties after getAll retrieval", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validCardFormInputArb, { minLength: 1, maxLength: 5 }),
        async (inputs: CardFormInput[]) => {
          // Create multiple cards
          const createdCards = [];
          for (const input of inputs) {
            const card = await CardService.create(input);
            createdCards.push({ input, card });
          }

          // Retrieve all cards
          const allCards = await CardService.getAll();

          // Verify each created card is in the list with correct properties
          for (const { input, card } of createdCards) {
            const found = allCards.find((c) => c.id === card.id);
            expect(found).not.toBeUndefined();
            expect(found!.name).toBe(input.name);
            expect(found!.atk).toBe(input.atk);
            expect(found!.hp).toBe(input.hp);
          }

          // Clean up
          for (const { card } of createdCards) {
            await CardService.delete(card.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("preserves card properties after update round-trip", async () => {
    await fc.assert(
      fc.asyncProperty(
        validCardFormInputArb,
        validCardFormInputArb,
        async (initialInput: CardFormInput, updateInput: CardFormInput) => {
          // Create initial card
          const created = await CardService.create(initialInput);

          // Update the card
          const updated = await CardService.update(created.id, updateInput);

          // Retrieve card
          const retrieved = await CardService.getById(created.id);

          // Verify round-trip preserves updated properties
          expect(retrieved).not.toBeNull();
          expect(updated).not.toBeNull();
          expect(retrieved!.id).toBe(created.id); // ID preserved
          expect(retrieved!.name).toBe(updateInput.name);
          expect(retrieved!.atk).toBe(updateInput.atk);
          expect(retrieved!.hp).toBe(updateInput.hp);
          expect(retrieved!.createdAt).toBe(created.createdAt); // createdAt preserved
          expect(retrieved!.updatedAt).toBe(updated!.updatedAt);

          // Clean up
          await CardService.delete(created.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});
