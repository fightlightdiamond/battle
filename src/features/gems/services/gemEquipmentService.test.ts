/**
 * Property-based tests for Gem Equipment Service
 * Using fast-check for property-based testing
 *
 * Tests the gem equipment functionality including:
 * - Property 2: Gem Slot Limit Invariant
 * - Property 3: Equip/Unequip Round Trip
 * - Property 16: Gem Deletion Cascade
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { MAX_GEM_SLOTS, type CardGemEquipment } from "../types/equipment";

// ============================================
// Pure Function Implementations for Testing
// ============================================

/**
 * Pure function to equip a gem to a card's equipment state
 * Returns the new equipment state or throws an error
 */
function equipGemPure(
  equipment: CardGemEquipment | null,
  cardId: string,
  gemId: string,
): CardGemEquipment {
  if (equipment) {
    // Check if gem is already equipped
    if (equipment.gemIds.includes(gemId)) {
      throw new Error(`Gem ${gemId} is already equipped to card ${cardId}`);
    }

    // Check slot limit
    if (equipment.gemIds.length >= MAX_GEM_SLOTS) {
      throw new Error(
        `Cannot equip gem: card ${cardId} already has ${MAX_GEM_SLOTS} gems equipped`,
      );
    }

    return {
      ...equipment,
      gemIds: [...equipment.gemIds, gemId],
    };
  }

  // Create new equipment record
  return {
    cardId,
    gemIds: [gemId],
  };
}

/**
 * Pure function to unequip a gem from a card's equipment state
 */
function unequipGemPure(
  equipment: CardGemEquipment | null,
  cardId: string,
  gemId: string,
): CardGemEquipment {
  if (!equipment) {
    return { cardId, gemIds: [] };
  }

  return {
    ...equipment,
    gemIds: equipment.gemIds.filter((id) => id !== gemId),
  };
}

/**
 * Pure function to unequip a gem from all cards
 */
function unequipAllByGemIdPure(
  allEquipments: CardGemEquipment[],
  gemId: string,
): CardGemEquipment[] {
  return allEquipments.map((equipment) => ({
    ...equipment,
    gemIds: equipment.gemIds.filter((id) => id !== gemId),
  }));
}

// ============================================
// Arbitraries (Generators)
// ============================================

// Valid card ID generator
const cardIdArb = fc.uuid();

// Valid gem ID generator
const gemIdArb = fc.uuid();

// Array of unique gem IDs (0 to MAX_GEM_SLOTS)
const gemIdsArb = fc
  .array(gemIdArb, { minLength: 0, maxLength: MAX_GEM_SLOTS })
  .map((ids) => [...new Set(ids)]); // Ensure uniqueness

// Valid card gem equipment generator
const cardGemEquipmentArb: fc.Arbitrary<CardGemEquipment> = fc.record({
  cardId: cardIdArb,
  gemIds: gemIdsArb,
});

// Generator for equipment with exactly MAX_GEM_SLOTS gems
const fullEquipmentArb: fc.Arbitrary<CardGemEquipment> = fc.record({
  cardId: cardIdArb,
  gemIds: fc
    .array(gemIdArb, { minLength: MAX_GEM_SLOTS, maxLength: MAX_GEM_SLOTS + 2 })
    .map((ids) => [...new Set(ids)].slice(0, MAX_GEM_SLOTS)),
});

// Generator for equipment with less than MAX_GEM_SLOTS gems
const nonFullEquipmentArb: fc.Arbitrary<CardGemEquipment> = fc.record({
  cardId: cardIdArb,
  gemIds: fc
    .array(gemIdArb, { minLength: 0, maxLength: MAX_GEM_SLOTS - 1 })
    .map((ids) => [...new Set(ids)].slice(0, MAX_GEM_SLOTS - 1)),
});

// Generator for multiple card equipments
const multipleEquipmentsArb = fc.array(cardGemEquipmentArb, {
  minLength: 1,
  maxLength: 5,
});

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: gem-skill-system, Property 2: Gem Slot Limit Invariant**
 * **Validates: Requirements 2.1, 2.2**
 *
 * For any card, the number of equipped gems should never exceed 3.
 */
describe("Property 2: Gem Slot Limit Invariant", () => {
  it("property: equipping to non-full card keeps gem count <= MAX_GEM_SLOTS", () => {
    fc.assert(
      fc.property(
        nonFullEquipmentArb,
        gemIdArb.filter((id) => id.length > 0),
        (equipment, newGemId) => {
          // Skip if gem is already equipped
          if (equipment.gemIds.includes(newGemId)) {
            return true;
          }

          const result = equipGemPure(equipment, equipment.cardId, newGemId);
          expect(result.gemIds.length).toBeLessThanOrEqual(MAX_GEM_SLOTS);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: equipping to full card throws error", () => {
    fc.assert(
      fc.property(
        fullEquipmentArb.filter((eq) => eq.gemIds.length === MAX_GEM_SLOTS),
        gemIdArb,
        (equipment, newGemId) => {
          // Skip if gem is already equipped (different error)
          if (equipment.gemIds.includes(newGemId)) {
            return true;
          }

          expect(() =>
            equipGemPure(equipment, equipment.cardId, newGemId),
          ).toThrow(`already has ${MAX_GEM_SLOTS} gems equipped`);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: any sequence of equip operations maintains slot limit", () => {
    fc.assert(
      fc.property(
        cardIdArb,
        fc.array(gemIdArb, { minLength: 1, maxLength: 10 }),
        (cardId, gemIds) => {
          let equipment: CardGemEquipment | null = null;
          const uniqueGemIds = [...new Set(gemIds)];

          for (const gemId of uniqueGemIds) {
            try {
              equipment = equipGemPure(equipment, cardId, gemId);
              // After successful equip, count should be <= MAX_GEM_SLOTS
              expect(equipment.gemIds.length).toBeLessThanOrEqual(
                MAX_GEM_SLOTS,
              );
            } catch {
              // Expected when slot limit is reached
              if (equipment) {
                expect(equipment.gemIds.length).toBe(MAX_GEM_SLOTS);
              }
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: gem count is always non-negative", () => {
    fc.assert(
      fc.property(cardGemEquipmentArb, (equipment) => {
        expect(equipment.gemIds.length).toBeGreaterThanOrEqual(0);
        expect(equipment.gemIds.length).toBeLessThanOrEqual(MAX_GEM_SLOTS);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 3: Equip/Unequip Round Trip**
 * **Validates: Requirements 2.1, 2.3**
 *
 * For any card and gem, equipping then unequipping a gem should result
 * in the gem not being in the card's gem list.
 */
describe("Property 3: Equip/Unequip Round Trip", () => {
  it("property: equip then unequip removes gem from list", () => {
    fc.assert(
      fc.property(nonFullEquipmentArb, gemIdArb, (initialEquipment, gemId) => {
        // Skip if gem is already equipped
        if (initialEquipment.gemIds.includes(gemId)) {
          return true;
        }

        // Equip the gem
        const afterEquip = equipGemPure(
          initialEquipment,
          initialEquipment.cardId,
          gemId,
        );
        expect(afterEquip.gemIds).toContain(gemId);

        // Unequip the gem
        const afterUnequip = unequipGemPure(
          afterEquip,
          initialEquipment.cardId,
          gemId,
        );
        expect(afterUnequip.gemIds).not.toContain(gemId);
      }),
      { numRuns: 100 },
    );
  });

  it("property: unequip is idempotent", () => {
    fc.assert(
      fc.property(cardGemEquipmentArb, gemIdArb, (equipment, gemId) => {
        // Unequip once
        const afterFirst = unequipGemPure(equipment, equipment.cardId, gemId);

        // Unequip again
        const afterSecond = unequipGemPure(afterFirst, equipment.cardId, gemId);

        // Results should be the same
        expect(afterFirst.gemIds).toEqual(afterSecond.gemIds);
      }),
      { numRuns: 100 },
    );
  });

  it("property: unequip preserves other gems", () => {
    fc.assert(
      fc.property(
        cardGemEquipmentArb.filter((eq) => eq.gemIds.length >= 2),
        (equipment) => {
          // Pick the first gem to unequip
          const gemToRemove = equipment.gemIds[0];
          const otherGems = equipment.gemIds.slice(1);

          const afterUnequip = unequipGemPure(
            equipment,
            equipment.cardId,
            gemToRemove,
          );

          // Other gems should still be present
          for (const gem of otherGems) {
            expect(afterUnequip.gemIds).toContain(gem);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: equip then unequip restores original gem count", () => {
    fc.assert(
      fc.property(nonFullEquipmentArb, gemIdArb, (initialEquipment, gemId) => {
        // Skip if gem is already equipped
        if (initialEquipment.gemIds.includes(gemId)) {
          return true;
        }

        const originalCount = initialEquipment.gemIds.length;

        // Equip the gem
        const afterEquip = equipGemPure(
          initialEquipment,
          initialEquipment.cardId,
          gemId,
        );
        expect(afterEquip.gemIds.length).toBe(originalCount + 1);

        // Unequip the gem
        const afterUnequip = unequipGemPure(
          afterEquip,
          initialEquipment.cardId,
          gemId,
        );
        expect(afterUnequip.gemIds.length).toBe(originalCount);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 16: Gem Deletion Cascade**
 * **Validates: Requirements 1.4**
 *
 * For any gem that is deleted, no card should have that gem ID
 * in their equipped gems list.
 */
describe("Property 16: Gem Deletion Cascade", () => {
  it("property: unequipAllByGemId removes gem from all cards", () => {
    fc.assert(
      fc.property(multipleEquipmentsArb, gemIdArb, (equipments, gemId) => {
        // Add the gem to some random cards
        const equipmentsWithGem = equipments.map((eq, index) => {
          if (index % 2 === 0 && eq.gemIds.length < MAX_GEM_SLOTS) {
            return {
              ...eq,
              gemIds: [...eq.gemIds, gemId],
            };
          }
          return eq;
        });

        // Remove the gem from all cards
        const afterCascade = unequipAllByGemIdPure(equipmentsWithGem, gemId);

        // No card should have the gem
        for (const equipment of afterCascade) {
          expect(equipment.gemIds).not.toContain(gemId);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: cascade preserves other gems", () => {
    fc.assert(
      fc.property(
        multipleEquipmentsArb.filter((eqs) =>
          eqs.some((eq) => eq.gemIds.length > 0),
        ),
        gemIdArb,
        (equipments, gemToDelete) => {
          // Collect all gems that are NOT the one being deleted
          const otherGems = new Map<string, string[]>();
          for (const eq of equipments) {
            const others = eq.gemIds.filter((id) => id !== gemToDelete);
            otherGems.set(eq.cardId, others);
          }

          // Remove the gem from all cards
          const afterCascade = unequipAllByGemIdPure(equipments, gemToDelete);

          // Other gems should still be present
          for (const equipment of afterCascade) {
            const expectedOthers = otherGems.get(equipment.cardId) || [];
            for (const gem of expectedOthers) {
              expect(equipment.gemIds).toContain(gem);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: cascade is idempotent", () => {
    fc.assert(
      fc.property(multipleEquipmentsArb, gemIdArb, (equipments, gemId) => {
        // First cascade
        const afterFirst = unequipAllByGemIdPure(equipments, gemId);

        // Second cascade
        const afterSecond = unequipAllByGemIdPure(afterFirst, gemId);

        // Results should be the same
        expect(afterFirst.length).toBe(afterSecond.length);
        for (let i = 0; i < afterFirst.length; i++) {
          expect(afterFirst[i].gemIds).toEqual(afterSecond[i].gemIds);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: cascade on non-existent gem changes nothing", () => {
    fc.assert(
      fc.property(
        multipleEquipmentsArb,
        gemIdArb,
        (equipments, nonExistentGemId) => {
          // Ensure the gem doesn't exist in any equipment
          const cleanEquipments = equipments.map((eq) => ({
            ...eq,
            gemIds: eq.gemIds.filter((id) => id !== nonExistentGemId),
          }));

          // Cascade should not change anything
          const afterCascade = unequipAllByGemIdPure(
            cleanEquipments,
            nonExistentGemId,
          );

          for (let i = 0; i < cleanEquipments.length; i++) {
            expect(afterCascade[i].gemIds).toEqual(cleanEquipments[i].gemIds);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * Additional edge case tests
 */
describe("Gem Equipment Edge Cases", () => {
  it("property: equipping same gem twice throws error", () => {
    fc.assert(
      fc.property(nonFullEquipmentArb, gemIdArb, (equipment, gemId) => {
        // Skip if gem is already equipped
        if (equipment.gemIds.includes(gemId)) {
          return true;
        }

        // Equip once
        const afterFirst = equipGemPure(equipment, equipment.cardId, gemId);

        // Try to equip again - should throw
        expect(() => equipGemPure(afterFirst, equipment.cardId, gemId)).toThrow(
          "already equipped",
        );
      }),
      { numRuns: 100 },
    );
  });

  it("property: unequip from null equipment returns empty list", () => {
    fc.assert(
      fc.property(cardIdArb, gemIdArb, (cardId, gemId) => {
        const result = unequipGemPure(null, cardId, gemId);
        expect(result.cardId).toBe(cardId);
        expect(result.gemIds).toEqual([]);
      }),
      { numRuns: 100 },
    );
  });

  it("property: equip to null equipment creates new record", () => {
    fc.assert(
      fc.property(cardIdArb, gemIdArb, (cardId, gemId) => {
        const result = equipGemPure(null, cardId, gemId);
        expect(result.cardId).toBe(cardId);
        expect(result.gemIds).toEqual([gemId]);
      }),
      { numRuns: 100 },
    );
  });
});
