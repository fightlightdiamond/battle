import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fc from "fast-check";
import "fake-indexeddb/auto";

// Mock OPFS image storage with in-memory implementation
vi.mock(
  "../services/imageStorage",
  () => import("../services/__mocks__/imageStorage")
);

import { CardService } from "../services/cardService";
import { deleteDB } from "../services/db";
import { clearImageStore } from "../services/__mocks__/imageStorage";
import type { CardFormInput } from "../types";

// Arbitrary for valid card form input (without image for simplicity)
const validCardFormInputArb = fc.record({
  name: fc
    .string({ minLength: 1, maxLength: 100 })
    .filter((s) => s.trim().length > 0),
  atk: fc.integer({ min: 0, max: 10000 }),
  hp: fc.integer({ min: 1, max: 10000 }),
  image: fc.constant(null as File | null),
});

/**
 * **Feature: card-game-manager, Property 2: Valid card creation adds to list**
 * **Validates: Requirements 2.2**
 *
 * For any valid CardFormInput (non-empty name, ATK >= 0, HP >= 1),
 * creating a card SHALL result in the card list containing a card with those exact values.
 */
describe("Property 2: Valid card creation adds to list", () => {
  beforeEach(async () => {
    clearImageStore();
    await CardService.clear();
  });

  afterEach(async () => {
    clearImageStore();
    await deleteDB();
  });

  it("creates a card that appears in the list with correct values", async () => {
    await fc.assert(
      fc.asyncProperty(validCardFormInputArb, async (input: CardFormInput) => {
        // Create card using CardService (same as mutation hook uses)
        const created = await CardService.create(input);

        // Get all cards (simulating what useCards would return)
        const allCards = await CardService.getAll();

        // Verify the created card is in the list
        const found = allCards.find((c) => c.id === created.id);
        expect(found).not.toBeUndefined();

        // Verify the card has the exact values from input
        expect(found!.name).toBe(input.name);
        expect(found!.atk).toBe(input.atk);
        expect(found!.hp).toBe(input.hp);

        // Clean up for next iteration
        await CardService.delete(created.id);
      }),
      { numRuns: 100 }
    );
  });

  it("increases the card count by one after creation", async () => {
    await fc.assert(
      fc.asyncProperty(validCardFormInputArb, async (input: CardFormInput) => {
        // Get initial count
        const initialCards = await CardService.getAll();
        const initialCount = initialCards.length;

        // Create card
        const created = await CardService.create(input);

        // Get new count
        const afterCards = await CardService.getAll();
        const afterCount = afterCards.length;

        // Verify count increased by 1
        expect(afterCount).toBe(initialCount + 1);

        // Clean up
        await CardService.delete(created.id);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: card-game-manager, Property 4: Card update preserves identity**
 * **Validates: Requirements 3.2**
 *
 * For any existing Card and valid CardFormInput, updating the card
 * SHALL preserve the card's id while updating name, ATK, and HP to the new values.
 */
describe("Property 4: Card update preserves identity", () => {
  beforeEach(async () => {
    clearImageStore();
    await CardService.clear();
  });

  afterEach(async () => {
    clearImageStore();
    await deleteDB();
  });

  it("preserves card id while updating other properties", async () => {
    await fc.assert(
      fc.asyncProperty(
        validCardFormInputArb,
        validCardFormInputArb,
        async (initialInput: CardFormInput, updateInput: CardFormInput) => {
          // Create initial card
          const created = await CardService.create(initialInput);
          const originalId = created.id;
          const originalCreatedAt = created.createdAt;

          // Update the card (simulating what useUpdateCard mutation does)
          const updated = await CardService.update(originalId, updateInput);

          // Verify update succeeded
          expect(updated).not.toBeNull();

          // Verify id is preserved
          expect(updated!.id).toBe(originalId);

          // Verify createdAt is preserved
          expect(updated!.createdAt).toBe(originalCreatedAt);

          // Verify values are updated to new input
          expect(updated!.name).toBe(updateInput.name);
          expect(updated!.atk).toBe(updateInput.atk);
          expect(updated!.hp).toBe(updateInput.hp);

          // Verify the card in the list has updated values
          const allCards = await CardService.getAll();
          const found = allCards.find((c) => c.id === originalId);
          expect(found).not.toBeUndefined();
          expect(found!.name).toBe(updateInput.name);
          expect(found!.atk).toBe(updateInput.atk);
          expect(found!.hp).toBe(updateInput.hp);

          // Clean up
          await CardService.delete(originalId);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("does not create duplicate cards on update", async () => {
    await fc.assert(
      fc.asyncProperty(
        validCardFormInputArb,
        validCardFormInputArb,
        async (initialInput: CardFormInput, updateInput: CardFormInput) => {
          // Create initial card
          const created = await CardService.create(initialInput);

          // Get count before update
          const beforeCards = await CardService.getAll();
          const beforeCount = beforeCards.length;

          // Update the card
          await CardService.update(created.id, updateInput);

          // Get count after update
          const afterCards = await CardService.getAll();
          const afterCount = afterCards.length;

          // Verify count is unchanged (no duplicates)
          expect(afterCount).toBe(beforeCount);

          // Clean up
          await CardService.delete(created.id);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: card-game-manager, Property 5: Card deletion removes from list**
 * **Validates: Requirements 4.2**
 *
 * For any existing Card, deleting it SHALL result in the card list
 * no longer containing that card's id.
 */
describe("Property 5: Card deletion removes from list", () => {
  beforeEach(async () => {
    clearImageStore();
    await CardService.clear();
  });

  afterEach(async () => {
    clearImageStore();
    await deleteDB();
  });

  it("removes card from list after deletion", async () => {
    await fc.assert(
      fc.asyncProperty(validCardFormInputArb, async (input: CardFormInput) => {
        // Create card
        const created = await CardService.create(input);
        const cardId = created.id;

        // Verify card exists in list
        const beforeCards = await CardService.getAll();
        const existsBefore = beforeCards.some((c) => c.id === cardId);
        expect(existsBefore).toBe(true);

        // Delete the card (simulating what useDeleteCard mutation does)
        const deleted = await CardService.delete(cardId);
        expect(deleted).toBe(true);

        // Verify card no longer exists in list
        const afterCards = await CardService.getAll();
        const existsAfter = afterCards.some((c) => c.id === cardId);
        expect(existsAfter).toBe(false);

        // Verify getById also returns null
        const retrieved = await CardService.getById(cardId);
        expect(retrieved).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("decreases the card count by one after deletion", async () => {
    await fc.assert(
      fc.asyncProperty(validCardFormInputArb, async (input: CardFormInput) => {
        // Create card
        const created = await CardService.create(input);

        // Get count before deletion
        const beforeCards = await CardService.getAll();
        const beforeCount = beforeCards.length;

        // Delete the card
        await CardService.delete(created.id);

        // Get count after deletion
        const afterCards = await CardService.getAll();
        const afterCount = afterCards.length;

        // Verify count decreased by 1
        expect(afterCount).toBe(beforeCount - 1);
      }),
      { numRuns: 100 }
    );
  });

  it("only removes the specified card, not others", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(validCardFormInputArb, { minLength: 2, maxLength: 5 }),
        async (inputs: CardFormInput[]) => {
          // Create multiple cards
          const createdCards = [];
          for (const input of inputs) {
            const card = await CardService.create(input);
            createdCards.push(card);
          }

          // Pick a random card to delete (first one)
          const cardToDelete = createdCards[0];
          const remainingCards = createdCards.slice(1);

          // Delete the selected card
          await CardService.delete(cardToDelete.id);

          // Verify deleted card is gone
          const allCards = await CardService.getAll();
          const deletedExists = allCards.some((c) => c.id === cardToDelete.id);
          expect(deletedExists).toBe(false);

          // Verify all other cards still exist
          for (const remaining of remainingCards) {
            const exists = allCards.some((c) => c.id === remaining.id);
            expect(exists).toBe(true);
          }

          // Clean up remaining cards
          for (const card of remainingCards) {
            await CardService.delete(card.id);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
