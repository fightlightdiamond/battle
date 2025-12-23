/**
 * Property-based tests for Skill System
 * Using fast-check for property-based testing
 *
 * Tests validate the correctness properties defined in the design document.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  createSkillSystem,
  clampPosition,
  getDirectionSign,
} from "./SkillSystem";
import type { Gem, SkillType, SkillTrigger } from "../../../gems/types/gem";
import type {
  EquippedGemState,
  BattleCardGems,
} from "../../../gems/types/equipment";
import type { AttackResult } from "../core/types";

// ============================================
// Arbitraries (Generators)
// ============================================

// Valid skill types
const skillTypeArb: fc.Arbitrary<SkillType> = fc.constantFrom(
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
);

// Valid skill triggers
const skillTriggerArb: fc.Arbitrary<SkillTrigger> = fc.constantFrom(
  "movement",
  "combat",
);

// Valid activation chance (0-100)
const activationChanceArb = fc.integer({ min: 0, max: 100 });

// Valid cooldown (0-10)
const cooldownArb = fc.integer({ min: 0, max: 10 });

// Valid ISO date string generator using timestamp range
const validIsoDateArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

// Valid gem generator
const gemArb: fc.Arbitrary<Gem> = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  skillType: skillTypeArb,
  trigger: skillTriggerArb,
  activationChance: activationChanceArb,
  cooldown: cooldownArb,
  effectParams: fc.record({
    knockbackDistance: fc.option(fc.integer({ min: 1, max: 3 }), {
      nil: undefined,
    }),
    moveDistance: fc.option(fc.integer({ min: 1, max: 3 }), { nil: undefined }),
    attackCount: fc.option(fc.integer({ min: 2, max: 4 }), { nil: undefined }),
    executeThreshold: fc.option(fc.integer({ min: 1, max: 50 }), {
      nil: undefined,
    }),
    leapRange: fc.option(fc.integer({ min: 1, max: 3 }), { nil: undefined }),
    leapKnockback: fc.option(fc.integer({ min: 1, max: 3 }), {
      nil: undefined,
    }),
  }),
  createdAt: validIsoDateArb,
  updatedAt: validIsoDateArb,
});

// Equipped gem state generator
const equippedGemStateArb: fc.Arbitrary<EquippedGemState> = fc.record({
  gem: gemArb,
  currentCooldown: fc.integer({ min: 0, max: 10 }),
});

// Battle card gems generator
const battleCardGemsArb: fc.Arbitrary<BattleCardGems> = fc.record({
  cardId: fc.uuid(),
  equippedGems: fc.array(equippedGemStateArb, { minLength: 0, maxLength: 3 }),
});

// ============================================
// Utility Function Tests
// ============================================

describe("clampPosition", () => {
  it("property: clamps values to [0, 7] range", () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 100 }), (position) => {
        const clamped = clampPosition(position);
        expect(clamped).toBeGreaterThanOrEqual(0);
        expect(clamped).toBeLessThanOrEqual(7);
      }),
      { numRuns: 100 },
    );
  });

  it("property: values within range are unchanged", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 7 }), (position) => {
        const clamped = clampPosition(position);
        expect(clamped).toBe(position);
      }),
      { numRuns: 100 },
    );
  });
});

describe("getDirectionSign", () => {
  it("property: returns 1 when target is to the right", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        fc.integer({ min: 1, max: 7 }),
        (from, offset) => {
          const to = from + offset;
          if (to <= 7) {
            expect(getDirectionSign(from, to)).toBe(1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: returns -1 when target is to the left", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 7 }),
        fc.integer({ min: 1, max: 7 }),
        (from, offset) => {
          const to = from - offset;
          if (to >= 0) {
            expect(getDirectionSign(from, to)).toBe(-1);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: returns 0 when positions are the same", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 7 }), (position) => {
        expect(getDirectionSign(position, position)).toBe(0);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: gem-skill-system, Property 13: Activation Chance Distribution**
 * **Validates: Requirements 10.1, 10.2**
 *
 * For any skill with activation chance C, over many trials the activation rate
 * should approximate C% within statistical tolerance.
 */
describe("Property 13: Activation Chance Distribution", () => {
  it("property: 0% chance never activates", () => {
    const skillSystem = createSkillSystem();

    // Run 100 times to verify 0% never activates
    for (let i = 0; i < 100; i++) {
      const result = skillSystem.rollActivation(0);
      expect(result).toBe(false);
    }
  });

  it("property: 100% chance always activates", () => {
    const skillSystem = createSkillSystem();

    // Run 100 times to verify 100% always activates
    for (let i = 0; i < 100; i++) {
      const result = skillSystem.rollActivation(100);
      expect(result).toBe(true);
    }
  });

  it("property: activation rate approximates chance within tolerance", () => {
    // Test with deterministic random for reproducibility
    // We use a seeded sequence to test distribution
    fc.assert(
      fc.property(
        fc.integer({ min: 10, max: 90 }), // Test chances between 10-90%
        (chance) => {
          const trials = 1000;
          let activations = 0;

          // Create skill system with Math.random
          const skillSystem = createSkillSystem();

          for (let i = 0; i < trials; i++) {
            if (skillSystem.rollActivation(chance)) {
              activations++;
            }
          }

          const actualRate = (activations / trials) * 100;
          const tolerance = 10; // Allow 10% tolerance for statistical variance

          // The actual rate should be within tolerance of expected chance
          expect(actualRate).toBeGreaterThanOrEqual(chance - tolerance);
          expect(actualRate).toBeLessThanOrEqual(chance + tolerance);
        },
      ),
      { numRuns: 10 }, // Fewer runs since each run does 1000 trials
    );
  });

  it("property: deterministic random produces expected results", () => {
    // Test with a deterministic random function
    let callCount = 0;
    const deterministicRandom = () => {
      callCount++;
      // Returns values cycling through 0.0, 0.25, 0.5, 0.75
      return ((callCount - 1) % 4) * 0.25;
    };

    const skillSystem = createSkillSystem(deterministicRandom);

    // With 50% chance:
    // Roll 0.0 * 100 = 0 < 50 -> true
    // Roll 0.25 * 100 = 25 < 50 -> true
    // Roll 0.5 * 100 = 50 < 50 -> false (not strictly less than)
    // Roll 0.75 * 100 = 75 < 50 -> false
    expect(skillSystem.rollActivation(50)).toBe(true); // 0
    expect(skillSystem.rollActivation(50)).toBe(true); // 25
    expect(skillSystem.rollActivation(50)).toBe(false); // 50
    expect(skillSystem.rollActivation(50)).toBe(false); // 75
  });

  it("property: chance is clamped to valid range", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(fc.integer({ min: -100, max: -1 }), (negativeChance) => {
        // Negative chances should be treated as 0%
        const result = skillSystem.rollActivation(negativeChance);
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );

    fc.assert(
      fc.property(fc.integer({ min: 101, max: 200 }), (overChance) => {
        // Chances over 100 should be treated as 100%
        const result = skillSystem.rollActivation(overChance);
        expect(result).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 14: Failed Activation No Cooldown**
 * **Validates: Requirements 10.3**
 *
 * For any skill activation attempt that fails the chance roll,
 * the skill's cooldown should remain unchanged.
 */
describe("Property 14: Failed Activation No Cooldown", () => {
  it("property: failed activation does not set cooldown", () => {
    // Use deterministic random that always fails (returns 1.0)
    const alwaysFailRandom = () => 1.0;
    const skillSystem = createSkillSystem(alwaysFailRandom);

    fc.assert(
      fc.property(
        gemArb.filter((gem) => gem.activationChance < 100 && gem.cooldown > 0),
        (gem) => {
          const gemState: EquippedGemState = {
            gem,
            currentCooldown: 0, // Ready to activate
          };

          const result = skillSystem.tryActivateSkill(gemState);

          // Activation should fail
          expect(result.activated).toBe(false);
          // Cooldown should remain 0 (unchanged)
          expect(result.newCooldown).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: successful activation sets cooldown", () => {
    // Use deterministic random that always succeeds (returns 0.0)
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        gemArb.filter((gem) => gem.activationChance > 0),
        (gem) => {
          const gemState: EquippedGemState = {
            gem,
            currentCooldown: 0, // Ready to activate
          };

          const result = skillSystem.tryActivateSkill(gemState);

          // Activation should succeed
          expect(result.activated).toBe(true);
          // Cooldown should be set to gem's cooldown value
          expect(result.newCooldown).toBe(gem.cooldown);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: skill on cooldown cannot activate regardless of roll", () => {
    // Use deterministic random that always succeeds
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        gemArb,
        fc.integer({ min: 1, max: 10 }), // Current cooldown > 0
        (gem, currentCooldown) => {
          const gemState: EquippedGemState = {
            gem,
            currentCooldown,
          };

          const result = skillSystem.tryActivateSkill(gemState);

          // Activation should fail due to cooldown
          expect(result.activated).toBe(false);
          // Cooldown should remain unchanged
          expect(result.newCooldown).toBe(currentCooldown);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 12: Cooldown Decrement**
 * **Validates: Requirements 9.1, 9.2**
 *
 * For any equipped gem with currentCooldown > 0, after turn end
 * the cooldown should be decremented by 1.
 */
describe("Property 12: Cooldown Decrement", () => {
  it("property: cooldown decrements by exactly 1 each turn", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(
        battleCardGemsArb.filter((cg) => cg.equippedGems.length > 0),
        (cardGems) => {
          const result = skillSystem.decrementCooldowns(cardGems);

          // Each gem's cooldown should be decremented by exactly 1 (min 0)
          result.equippedGems.forEach((gemState, index) => {
            const originalCooldown =
              cardGems.equippedGems[index].currentCooldown;
            const expectedCooldown = Math.max(0, originalCooldown - 1);
            expect(gemState.currentCooldown).toBe(expectedCooldown);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: cooldown reaches 0 allows activation", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        gemArb.filter((gem) => gem.activationChance > 0),
        (gem) => {
          // Start with cooldown of 1
          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem, currentCooldown: 1 }],
          };

          // Before decrement, skill cannot activate
          expect(skillSystem.canActivate(cardGems.equippedGems[0])).toBe(false);

          // After decrement, cooldown should be 0
          const afterDecrement = skillSystem.decrementCooldowns(cardGems);
          expect(afterDecrement.equippedGems[0].currentCooldown).toBe(0);

          // Now skill can activate
          expect(skillSystem.canActivate(afterDecrement.equippedGems[0])).toBe(
            true,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: multiple decrements eventually reach 0", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(
        gemArb,
        fc.integer({ min: 1, max: 10 }),
        (gem, initialCooldown) => {
          let cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem, currentCooldown: initialCooldown }],
          };

          // Decrement exactly initialCooldown times
          for (let i = 0; i < initialCooldown; i++) {
            cardGems = skillSystem.decrementCooldowns(cardGems);
          }

          // Cooldown should now be 0
          expect(cardGems.equippedGems[0].currentCooldown).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: cooldown never goes negative", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(battleCardGemsArb, (cardGems) => {
        // Decrement multiple times
        let result = cardGems;
        for (let i = 0; i < 20; i++) {
          result = skillSystem.decrementCooldowns(result);
        }

        // All cooldowns should be >= 0
        result.equippedGems.forEach((gemState) => {
          expect(gemState.currentCooldown).toBeGreaterThanOrEqual(0);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("property: gem data is preserved after decrement", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(battleCardGemsArb, (cardGems) => {
        const result = skillSystem.decrementCooldowns(cardGems);

        // Card ID should be preserved
        expect(result.cardId).toBe(cardGems.cardId);

        // Gem data should be preserved
        result.equippedGems.forEach((gemState, index) => {
          const originalGem = cardGems.equippedGems[index].gem;
          expect(gemState.gem).toEqual(originalGem);
        });
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Cooldown decrement tests (additional)
 */
describe("Cooldown Management", () => {
  it("property: decrementCooldowns reduces all cooldowns by 1", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(battleCardGemsArb, (cardGems) => {
        const result = skillSystem.decrementCooldowns(cardGems);

        // Each gem's cooldown should be decremented by 1 (min 0)
        result.equippedGems.forEach((gemState, index) => {
          const originalCooldown = cardGems.equippedGems[index].currentCooldown;
          const expectedCooldown = Math.max(0, originalCooldown - 1);
          expect(gemState.currentCooldown).toBe(expectedCooldown);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("property: cooldown never goes below 0", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(battleCardGemsArb, (cardGems) => {
        const result = skillSystem.decrementCooldowns(cardGems);

        result.equippedGems.forEach((gemState) => {
          expect(gemState.currentCooldown).toBeGreaterThanOrEqual(0);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("property: cardId is preserved after decrement", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(battleCardGemsArb, (cardGems) => {
        const result = skillSystem.decrementCooldowns(cardGems);
        expect(result.cardId).toBe(cardGems.cardId);
      }),
      { numRuns: 100 },
    );
  });

  it("property: gem data is preserved after decrement", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(battleCardGemsArb, (cardGems) => {
        const result = skillSystem.decrementCooldowns(cardGems);

        result.equippedGems.forEach((gemState, index) => {
          const originalGem = cardGems.equippedGems[index].gem;
          expect(gemState.gem).toEqual(originalGem);
        });
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 11: Cooldown Blocks Activation**
 * **Validates: Requirements 3.3, 4.3, 5.3, 6.3, 7.3, 8.5, 9.3**
 *
 * For any skill with currentCooldown > 0, the skill should not activate
 * regardless of trigger conditions.
 */
describe("Property 11: Cooldown Blocks Activation", () => {
  it("property: skill with cooldown > 0 cannot activate", () => {
    // Use deterministic random that always succeeds (returns 0.0)
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        gemArb,
        fc.integer({ min: 1, max: 10 }), // Current cooldown > 0
        (gem, currentCooldown) => {
          const gemState: EquippedGemState = {
            gem,
            currentCooldown,
          };

          // canActivate should return false
          expect(skillSystem.canActivate(gemState)).toBe(false);

          // tryActivateSkill should not activate
          const result = skillSystem.tryActivateSkill(gemState);
          expect(result.activated).toBe(false);
          // Cooldown should remain unchanged
          expect(result.newCooldown).toBe(currentCooldown);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: skill with cooldown = 0 can activate (if roll succeeds)", () => {
    // Use deterministic random that always succeeds
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        gemArb.filter((gem) => gem.activationChance > 0),
        (gem) => {
          const gemState: EquippedGemState = {
            gem,
            currentCooldown: 0, // Ready to activate
          };

          // canActivate should return true
          expect(skillSystem.canActivate(gemState)).toBe(true);

          // tryActivateSkill should activate
          const result = skillSystem.tryActivateSkill(gemState);
          expect(result.activated).toBe(true);
          // Cooldown should be set to gem's cooldown value
          expect(result.newCooldown).toBe(gem.cooldown);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: cooldown blocks activation for all skill types", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const skillTypes: SkillType[] = [
      "knockback",
      "retreat",
      "double_move",
      "double_attack",
      "execute",
      "leap_strike",
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...skillTypes),
        fc.integer({ min: 1, max: 10 }),
        (skillType, currentCooldown) => {
          const gem: Gem = {
            id: "test-gem",
            name: "Test Gem",
            description: "Test",
            skillType,
            trigger:
              skillType === "double_move" || skillType === "leap_strike"
                ? "movement"
                : "combat",
            activationChance: 100, // Would always activate if not on cooldown
            cooldown: 3,
            effectParams: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const gemState: EquippedGemState = {
            gem,
            currentCooldown,
          };

          // Should not activate due to cooldown
          const result = skillSystem.tryActivateSkill(gemState);
          expect(result.activated).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * canActivate tests
 */
describe("canActivate", () => {
  it("property: returns true when cooldown is 0", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(gemArb, (gem) => {
        const gemState: EquippedGemState = {
          gem,
          currentCooldown: 0,
        };

        expect(skillSystem.canActivate(gemState)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: returns false when cooldown is greater than 0", () => {
    const skillSystem = createSkillSystem();

    fc.assert(
      fc.property(gemArb, fc.integer({ min: 1, max: 10 }), (gem, cooldown) => {
        const gemState: EquippedGemState = {
          gem,
          currentCooldown: cooldown,
        };

        expect(skillSystem.canActivate(gemState)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Movement Skill Property Tests
// ============================================

// Valid arena position (0-7)
const cellIndexArb = fc.integer({ min: 0, max: 7 }) as fc.Arbitrary<
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7
>;

/**
 * **Feature: gem-skill-system, Property 6: Double Move Distance**
 * **Validates: Requirements 5.1, 5.2**
 *
 * For any card position P and move direction, double move should result
 * in position P ± 2, clamped to [0, 7].
 */
describe("Property 6: Double Move Distance", () => {
  it("property: double move moves 2 cells in the movement direction", () => {
    // Use deterministic random that always succeeds
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb,
        fc.constantFrom(-1, 1), // Move direction: -1 = left, 1 = right
        fc.integer({ min: 0, max: 7 }), // Enemy position (doesn't affect double_move)
        (currentPosition, moveDirection, enemyPosition) => {
          // Create a double_move gem
          const doubleMoveGem: Gem = {
            id: "double-move-gem",
            name: "Double Move Stone",
            description: "Move 2 cells",
            skillType: "double_move",
            trigger: "movement",
            activationChance: 100,
            cooldown: 0,
            effectParams: { moveDistance: 2 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: doubleMoveGem, currentCooldown: 0 }],
          };

          // Calculate normal target position (1 cell move)
          const normalTarget = clampPosition(currentPosition + moveDirection);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            normalTarget,
            enemyPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          );

          // Expected position: current + 2 * direction, clamped to [0, 7]
          const expectedPosition = clampPosition(
            currentPosition + moveDirection * 2,
          );

          expect(result.finalPosition).toBe(expectedPosition);
          expect(result.skillsActivated.length).toBe(1);
          expect(result.skillsActivated[0].skillType).toBe("double_move");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: double move clamps to arena boundaries", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    // Test left boundary
    const doubleMoveGem: Gem = {
      id: "double-move-gem",
      name: "Double Move Stone",
      description: "Move 2 cells",
      skillType: "double_move",
      trigger: "movement",
      activationChance: 100,
      cooldown: 0,
      effectParams: { moveDistance: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test from position 1 moving left (should clamp to 0)
    const cardGemsLeft: BattleCardGems = {
      cardId: "test-card",
      equippedGems: [{ gem: doubleMoveGem, currentCooldown: 0 }],
    };

    const resultLeft = skillSystem.processMovementSkills(
      cardGemsLeft,
      1,
      0, // Normal target would be 0
      7, // Enemy far away
    );

    expect(resultLeft.finalPosition).toBe(0); // Clamped to 0, not -1

    // Test from position 6 moving right (should clamp to 7)
    const cardGemsRight: BattleCardGems = {
      cardId: "test-card",
      equippedGems: [{ gem: doubleMoveGem, currentCooldown: 0 }],
    };

    const resultRight = skillSystem.processMovementSkills(
      cardGemsRight,
      6,
      7, // Normal target would be 7
      0, // Enemy far away
    );

    expect(resultRight.finalPosition).toBe(7); // Clamped to 7, not 8
  });

  it("property: double move on cooldown uses normal movement", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb.filter((p) => p >= 2 && p <= 5), // Middle positions
        fc.constantFrom(-1, 1),
        fc.integer({ min: 1, max: 10 }), // Cooldown > 0
        (currentPosition, moveDirection, cooldown) => {
          const doubleMoveGem: Gem = {
            id: "double-move-gem",
            name: "Double Move Stone",
            description: "Move 2 cells",
            skillType: "double_move",
            trigger: "movement",
            activationChance: 100,
            cooldown: 3,
            effectParams: { moveDistance: 2 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: doubleMoveGem, currentCooldown: cooldown }],
          };

          const normalTarget = clampPosition(currentPosition + moveDirection);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            normalTarget,
            7 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          );

          // Should use normal movement (target position unchanged)
          expect(result.finalPosition).toBe(normalTarget);
          expect(result.skillsActivated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: double move respects custom move distance", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 4 }), // Start position with room to move
        fc.integer({ min: 1, max: 3 }), // Custom move distance
        (currentPosition, moveDistance) => {
          const doubleMoveGem: Gem = {
            id: "double-move-gem",
            name: "Double Move Stone",
            description: `Move ${moveDistance} cells`,
            skillType: "double_move",
            trigger: "movement",
            activationChance: 100,
            cooldown: 0,
            effectParams: { moveDistance },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: doubleMoveGem, currentCooldown: 0 }],
          };

          // Moving right
          const normalTarget = clampPosition(currentPosition + 1);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            normalTarget,
            7 as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          );

          const expectedPosition = clampPosition(
            currentPosition + moveDistance,
          );
          expect(result.finalPosition).toBe(expectedPosition);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 9: Leap Strike Positioning**
 * **Validates: Requirements 8.1, 8.4**
 *
 * For any card position P and enemy position E where |P - E| <= 2,
 * leap strike should move card to position adjacent to enemy (E ± 1).
 */
describe("Property 9: Leap Strike Positioning", () => {
  it("property: leap strike moves card to adjacent position of enemy when within range", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb,
        cellIndexArb,
        (currentPosition, enemyPosition) => {
          const distanceToEnemy = Math.abs(currentPosition - enemyPosition);

          // Skip if same position or out of leap range
          if (distanceToEnemy === 0 || distanceToEnemy > 2) {
            return;
          }

          const leapStrikeGem: Gem = {
            id: "leap-strike-gem",
            name: "Leap Strike Stone",
            description: "Jump to enemy and knock back",
            skillType: "leap_strike",
            trigger: "movement",
            activationChance: 100,
            cooldown: 0,
            effectParams: { leapRange: 2, leapKnockback: 2 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
          };

          // Normal movement direction
          const moveDirection = getDirectionSign(
            currentPosition,
            enemyPosition,
          );
          const normalTarget = clampPosition(currentPosition + moveDirection);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition,
            normalTarget,
            enemyPosition,
          );

          // Card should move to position adjacent to enemy
          const directionToEnemy = getDirectionSign(
            currentPosition,
            enemyPosition,
          );
          const expectedPosition = clampPosition(
            enemyPosition - directionToEnemy,
          );

          expect(result.finalPosition).toBe(expectedPosition);
          expect(result.skillsActivated.length).toBe(1);
          expect(result.skillsActivated[0].skillType).toBe("leap_strike");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: leap strike does not activate when enemy is out of range", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 3 }), // Card on left side
        fc.integer({ min: 6, max: 7 }), // Enemy on right side (distance > 2)
        (currentPosition, enemyPosition) => {
          const distanceToEnemy = Math.abs(currentPosition - enemyPosition);

          // Ensure enemy is out of range
          if (distanceToEnemy <= 2) {
            return;
          }

          const leapStrikeGem: Gem = {
            id: "leap-strike-gem",
            name: "Leap Strike Stone",
            description: "Jump to enemy and knock back",
            skillType: "leap_strike",
            trigger: "movement",
            activationChance: 100,
            cooldown: 0,
            effectParams: { leapRange: 2, leapKnockback: 2 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
          };

          // Normal movement (moving right toward enemy)
          const normalTarget = clampPosition(currentPosition + 1);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            normalTarget,
            enemyPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          );

          // Should use normal movement since enemy is out of range
          expect(result.finalPosition).toBe(normalTarget);
          expect(result.skillsActivated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: leap strike on cooldown uses normal movement", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 5 }),
        fc.integer({ min: 1, max: 2 }), // Distance within leap range
        fc.integer({ min: 1, max: 10 }), // Cooldown > 0
        (currentPosition, distance, cooldown) => {
          const enemyPosition = currentPosition + distance;
          if (enemyPosition > 7) return;

          const leapStrikeGem: Gem = {
            id: "leap-strike-gem",
            name: "Leap Strike Stone",
            description: "Jump to enemy and knock back",
            skillType: "leap_strike",
            trigger: "movement",
            activationChance: 100,
            cooldown: 3,
            effectParams: { leapRange: 2, leapKnockback: 2 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: leapStrikeGem, currentCooldown: cooldown }],
          };

          const normalTarget = clampPosition(currentPosition + 1);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            normalTarget,
            enemyPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
          );

          // Should use normal movement since on cooldown
          expect(result.finalPosition).toBe(normalTarget);
          expect(result.skillsActivated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: leap strike respects custom leap range", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    // Test with leap range of 3
    const leapStrikeGem: Gem = {
      id: "leap-strike-gem",
      name: "Leap Strike Stone",
      description: "Jump to enemy and knock back",
      skillType: "leap_strike",
      trigger: "movement",
      activationChance: 100,
      cooldown: 0,
      effectParams: { leapRange: 3, leapKnockback: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cardGems: BattleCardGems = {
      cardId: "test-card",
      equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
    };

    // Enemy at distance 3 (would be out of range with default leapRange=2)
    const result = skillSystem.processMovementSkills(
      cardGems,
      0, // Current position
      1, // Normal target
      3, // Enemy at distance 3
    );

    // Should activate since custom leapRange is 3
    expect(result.skillsActivated.length).toBe(1);
    expect(result.skillsActivated[0].skillType).toBe("leap_strike");
    expect(result.finalPosition).toBe(2); // Adjacent to enemy at position 3
  });
});

/**
 * **Feature: gem-skill-system, Property 10: Leap Strike Knockback**
 * **Validates: Requirements 8.2, 8.3**
 *
 * For any leap strike activation, enemy should be pushed 2 cells away
 * from new card position, clamped to [0, 7].
 */
describe("Property 10: Leap Strike Knockback", () => {
  it("property: leap strike pushes enemy 2 cells away from card's new position", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb,
        cellIndexArb,
        (currentPosition, enemyPosition) => {
          const distanceToEnemy = Math.abs(currentPosition - enemyPosition);

          // Skip if same position or out of leap range
          if (distanceToEnemy === 0 || distanceToEnemy > 2) {
            return;
          }

          const leapKnockback = 2;
          const leapStrikeGem: Gem = {
            id: "leap-strike-gem",
            name: "Leap Strike Stone",
            description: "Jump to enemy and knock back",
            skillType: "leap_strike",
            trigger: "movement",
            activationChance: 100,
            cooldown: 0,
            effectParams: { leapRange: 2, leapKnockback },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
          };

          const moveDirection = getDirectionSign(
            currentPosition,
            enemyPosition,
          );
          const normalTarget = clampPosition(currentPosition + moveDirection);

          const result = skillSystem.processMovementSkills(
            cardGems,
            currentPosition,
            normalTarget,
            enemyPosition,
          );

          // Calculate expected enemy position
          // Card moves to adjacent position of enemy
          const directionToEnemy = getDirectionSign(
            currentPosition,
            enemyPosition,
          );
          const cardNewPosition = clampPosition(
            enemyPosition - directionToEnemy,
          );

          // Enemy is knocked back 2 cells away from card's new position
          const knockbackDirection = getDirectionSign(
            cardNewPosition,
            enemyPosition,
          );
          const expectedEnemyPosition = clampPosition(
            enemyPosition + knockbackDirection * leapKnockback,
          );

          expect(result.enemyNewPosition).toBe(expectedEnemyPosition);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: leap strike knockback clamps to arena boundaries", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    // Test knockback at right boundary
    const leapStrikeGem: Gem = {
      id: "leap-strike-gem",
      name: "Leap Strike Stone",
      description: "Jump to enemy and knock back",
      skillType: "leap_strike",
      trigger: "movement",
      activationChance: 100,
      cooldown: 0,
      effectParams: { leapRange: 2, leapKnockback: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test right boundary: card at 4, enemy at 6
    // Card leaps to 5, enemy knocked from 6 to 8 -> clamped to 7
    const cardGemsRight: BattleCardGems = {
      cardId: "test-card",
      equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
    };

    const resultRight = skillSystem.processMovementSkills(
      cardGemsRight,
      4, // Current position
      5, // Normal target
      6, // Enemy position
    );

    expect(resultRight.finalPosition).toBe(5); // Card at adjacent position
    expect(resultRight.enemyNewPosition).toBe(7); // Clamped to boundary

    // Test left boundary: card at 3, enemy at 1
    // Card leaps to 2, enemy knocked from 1 to -1 -> clamped to 0
    const cardGemsLeft: BattleCardGems = {
      cardId: "test-card",
      equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
    };

    const resultLeft = skillSystem.processMovementSkills(
      cardGemsLeft,
      3, // Current position
      2, // Normal target
      1, // Enemy position
    );

    expect(resultLeft.finalPosition).toBe(2); // Card at adjacent position
    expect(resultLeft.enemyNewPosition).toBe(0); // Clamped to boundary
  });

  it("property: leap strike respects custom knockback distance", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Custom knockback distance
        (leapKnockback) => {
          const leapStrikeGem: Gem = {
            id: "leap-strike-gem",
            name: "Leap Strike Stone",
            description: "Jump to enemy and knock back",
            skillType: "leap_strike",
            trigger: "movement",
            activationChance: 100,
            cooldown: 0,
            effectParams: { leapRange: 2, leapKnockback },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const cardGems: BattleCardGems = {
            cardId: "test-card",
            equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
          };

          // Card at 2, enemy at 4 (distance 2, within range)
          const result = skillSystem.processMovementSkills(
            cardGems,
            2, // Current position
            3, // Normal target
            4, // Enemy position
          );

          // Card moves to position 3 (adjacent to enemy at 4)
          expect(result.finalPosition).toBe(3);

          // Enemy knocked back by custom distance
          // From position 4, knocked right by leapKnockback
          const expectedEnemyPosition = clampPosition(4 + leapKnockback);
          expect(result.enemyNewPosition).toBe(expectedEnemyPosition);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: no knockback when leap strike does not activate", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    // Enemy out of range
    const leapStrikeGem: Gem = {
      id: "leap-strike-gem",
      name: "Leap Strike Stone",
      description: "Jump to enemy and knock back",
      skillType: "leap_strike",
      trigger: "movement",
      activationChance: 100,
      cooldown: 0,
      effectParams: { leapRange: 2, leapKnockback: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const cardGems: BattleCardGems = {
      cardId: "test-card",
      equippedGems: [{ gem: leapStrikeGem, currentCooldown: 0 }],
    };

    // Enemy at distance 4 (out of range)
    const result = skillSystem.processMovementSkills(
      cardGems,
      0, // Current position
      1, // Normal target
      4, // Enemy position (out of range)
    );

    // No knockback since leap strike didn't activate
    expect(result.enemyNewPosition).toBeUndefined();
    expect(result.skillsActivated.length).toBe(0);
  });
});

// ============================================
// Combat Skill Property Tests
// ============================================

// Helper to create a mock AttackResult
function createMockAttackResult(
  defenderNewHp: number,
  defenderMaxHp: number = 100,
): AttackResult {
  return {
    attacker: {
      id: "attacker-1",
      name: "Attacker",
      imageUrl: null,
      baseStats: {
        atk: 10,
        def: 5,
        spd: 5,
        critChance: 10,
        critDamage: 150,
        armorPen: 0,
        lifesteal: 0,
      },
      currentHp: 100,
      maxHp: 100,
      buffs: [],
      isDefeated: false,
      effectiveRange: 1,
    },
    defender: {
      id: "defender-1",
      name: "Defender",
      imageUrl: null,
      baseStats: {
        atk: 10,
        def: 5,
        spd: 5,
        critChance: 10,
        critDamage: 150,
        armorPen: 0,
        lifesteal: 0,
      },
      currentHp: defenderNewHp,
      maxHp: defenderMaxHp,
      buffs: [],
      isDefeated: defenderNewHp <= 0,
      effectiveRange: 1,
    },
    damage: 10,
    defenderNewHp,
    attackerNewHp: 100,
    isCritical: false,
    isKnockout: defenderNewHp <= 0,
    lifestealHeal: 0,
  };
}

/**
 * **Feature: gem-skill-system, Property 4: Knockback Position Change**
 * **Validates: Requirements 3.1, 3.2**
 *
 * For any attacker position A and defender position D where |A - D| = 1,
 * knockback should move defender to position D + sign(D - A), clamped to [0, 7].
 */
describe("Property 4: Knockback Position Change", () => {
  it("property: knockback pushes defender 1 cell away from attacker", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb,
        cellIndexArb,
        (attackerPosition, defenderPosition) => {
          // Skip if same position (can't attack self)
          if (attackerPosition === defenderPosition) {
            return;
          }

          const knockbackGem: Gem = {
            id: "knockback-gem",
            name: "Knockback Stone",
            description: "Push enemy back 1 cell",
            skillType: "knockback",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { knockbackDistance: 1 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: knockbackGem, currentCooldown: 0 }],
          };

          const defenderGems: BattleCardGems = {
            cardId: "defender-card",
            equippedGems: [],
          };

          const attackResult = createMockAttackResult(50);

          const result = skillSystem.processCombatSkills(
            attackerGems,
            defenderGems,
            attackerPosition,
            defenderPosition,
            attackResult,
          );

          // Calculate expected position
          const knockbackDirection = getDirectionSign(
            attackerPosition,
            defenderPosition,
          );
          const expectedPosition = clampPosition(
            defenderPosition + knockbackDirection * 1,
          );

          expect(result.defenderNewPosition).toBe(expectedPosition);
          expect(result.skillsActivated.length).toBe(1);
          expect(result.skillsActivated[0].skillType).toBe("knockback");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: knockback clamps to arena boundaries", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const knockbackGem: Gem = {
      id: "knockback-gem",
      name: "Knockback Stone",
      description: "Push enemy back 1 cell",
      skillType: "knockback",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: { knockbackDistance: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test right boundary: attacker at 6, defender at 7
    const attackerGemsRight: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: knockbackGem, currentCooldown: 0 }],
    };

    const resultRight = skillSystem.processCombatSkills(
      attackerGemsRight,
      { cardId: "defender", equippedGems: [] },
      6, // Attacker position
      7, // Defender position (at boundary)
      createMockAttackResult(50),
    );

    expect(resultRight.defenderNewPosition).toBe(7); // Clamped to boundary

    // Test left boundary: attacker at 1, defender at 0
    const attackerGemsLeft: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: knockbackGem, currentCooldown: 0 }],
    };

    const resultLeft = skillSystem.processCombatSkills(
      attackerGemsLeft,
      { cardId: "defender", equippedGems: [] },
      1, // Attacker position
      0, // Defender position (at boundary)
      createMockAttackResult(50),
    );

    expect(resultLeft.defenderNewPosition).toBe(0); // Clamped to boundary
  });

  it("property: knockback on cooldown does not change position", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb.filter((p) => p >= 1 && p <= 6),
        fc.constantFrom(-1, 1),
        fc.integer({ min: 1, max: 10 }),
        (attackerPosition, direction, cooldown) => {
          const defenderPosition = clampPosition(attackerPosition + direction);

          const knockbackGem: Gem = {
            id: "knockback-gem",
            name: "Knockback Stone",
            description: "Push enemy back 1 cell",
            skillType: "knockback",
            trigger: "combat",
            activationChance: 100,
            cooldown: 3,
            effectParams: { knockbackDistance: 1 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: knockbackGem, currentCooldown: cooldown }],
          };

          const result = skillSystem.processCombatSkills(
            attackerGems,
            { cardId: "defender", equippedGems: [] },
            attackerPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            defenderPosition,
            createMockAttackResult(50),
          );

          // Position should remain unchanged when on cooldown
          expect(result.defenderNewPosition).toBe(defenderPosition);
          expect(result.skillsActivated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: knockback respects custom knockback distance", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Custom knockback distance
        (knockbackDistance) => {
          const knockbackGem: Gem = {
            id: "knockback-gem",
            name: "Knockback Stone",
            description: `Push enemy back ${knockbackDistance} cells`,
            skillType: "knockback",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { knockbackDistance },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: knockbackGem, currentCooldown: 0 }],
          };

          // Attacker at 3, defender at 4 (defender to the right)
          const result = skillSystem.processCombatSkills(
            attackerGems,
            { cardId: "defender", equippedGems: [] },
            3, // Attacker position
            4, // Defender position
            createMockAttackResult(50),
          );

          // Defender should be pushed right by knockbackDistance
          const expectedPosition = clampPosition(4 + knockbackDistance);
          expect(result.defenderNewPosition).toBe(expectedPosition);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 5: Retreat Position Change**
 * **Validates: Requirements 4.1, 4.2**
 *
 * For any attacker position A and defender position D where |A - D| = 1,
 * retreat should move attacker to position A - sign(D - A), clamped to [0, 7].
 */
describe("Property 5: Retreat Position Change", () => {
  it("property: retreat moves attacker 1 cell backward (away from defender)", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb,
        cellIndexArb,
        (attackerPosition, defenderPosition) => {
          // Skip if same position (can't attack self)
          if (attackerPosition === defenderPosition) {
            return;
          }

          const retreatGem: Gem = {
            id: "retreat-gem",
            name: "Retreat Stone",
            description: "Move back 1 cell after attack",
            skillType: "retreat",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { knockbackDistance: 1 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: retreatGem, currentCooldown: 0 }],
          };

          const defenderGems: BattleCardGems = {
            cardId: "defender-card",
            equippedGems: [],
          };

          const attackResult = createMockAttackResult(50);

          const result = skillSystem.processCombatSkills(
            attackerGems,
            defenderGems,
            attackerPosition,
            defenderPosition,
            attackResult,
          );

          // Calculate expected position: attacker moves away from defender
          const retreatDirection = getDirectionSign(
            defenderPosition,
            attackerPosition,
          );
          const expectedPosition = clampPosition(
            attackerPosition + retreatDirection * 1,
          );

          expect(result.attackerNewPosition).toBe(expectedPosition);
          expect(result.skillsActivated.length).toBe(1);
          expect(result.skillsActivated[0].skillType).toBe("retreat");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: retreat clamps to arena boundaries", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const retreatGem: Gem = {
      id: "retreat-gem",
      name: "Retreat Stone",
      description: "Move back 1 cell after attack",
      skillType: "retreat",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: { knockbackDistance: 1 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Test left boundary: attacker at 0, defender at 1
    // Attacker should retreat left but clamp to 0
    const attackerGemsLeft: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: retreatGem, currentCooldown: 0 }],
    };

    const resultLeft = skillSystem.processCombatSkills(
      attackerGemsLeft,
      { cardId: "defender", equippedGems: [] },
      0, // Attacker position (at boundary)
      1, // Defender position
      createMockAttackResult(50),
    );

    expect(resultLeft.attackerNewPosition).toBe(0); // Clamped to boundary

    // Test right boundary: attacker at 7, defender at 6
    // Attacker should retreat right but clamp to 7
    const attackerGemsRight: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: retreatGem, currentCooldown: 0 }],
    };

    const resultRight = skillSystem.processCombatSkills(
      attackerGemsRight,
      { cardId: "defender", equippedGems: [] },
      7, // Attacker position (at boundary)
      6, // Defender position
      createMockAttackResult(50),
    );

    expect(resultRight.attackerNewPosition).toBe(7); // Clamped to boundary
  });

  it("property: retreat on cooldown does not change position", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        cellIndexArb.filter((p) => p >= 1 && p <= 6),
        fc.constantFrom(-1, 1),
        fc.integer({ min: 1, max: 10 }),
        (attackerPosition, direction, cooldown) => {
          const defenderPosition = clampPosition(attackerPosition + direction);

          const retreatGem: Gem = {
            id: "retreat-gem",
            name: "Retreat Stone",
            description: "Move back 1 cell after attack",
            skillType: "retreat",
            trigger: "combat",
            activationChance: 100,
            cooldown: 3,
            effectParams: { knockbackDistance: 1 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: retreatGem, currentCooldown: cooldown }],
          };

          const result = skillSystem.processCombatSkills(
            attackerGems,
            { cardId: "defender", equippedGems: [] },
            attackerPosition as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7,
            defenderPosition,
            createMockAttackResult(50),
          );

          // Position should remain unchanged when on cooldown
          expect(result.attackerNewPosition).toBe(attackerPosition);
          expect(result.skillsActivated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: retreat respects custom retreat distance", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 3 }), // Custom retreat distance
        (retreatDistance) => {
          const retreatGem: Gem = {
            id: "retreat-gem",
            name: "Retreat Stone",
            description: `Move back ${retreatDistance} cells after attack`,
            skillType: "retreat",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { knockbackDistance: retreatDistance },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: retreatGem, currentCooldown: 0 }],
          };

          // Attacker at 4, defender at 5 (defender to the right)
          // Attacker should retreat left
          const result = skillSystem.processCombatSkills(
            attackerGems,
            { cardId: "defender", equippedGems: [] },
            4, // Attacker position
            5, // Defender position
            createMockAttackResult(50),
          );

          // Attacker should retreat left by retreatDistance
          const expectedPosition = clampPosition(4 - retreatDistance);
          expect(result.attackerNewPosition).toBe(expectedPosition);
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-system, Property 7: Double Attack Count**
 * **Validates: Requirements 6.1, 6.2**
 *
 * For any attack where double attack activates and defender survives first attack,
 * exactly 2 attack results should be produced.
 */
describe("Property 7: Double Attack Count", () => {
  it("property: double attack produces exactly 1 additional attack when defender survives", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 20, max: 100 }), // Defender HP after first attack (survives)
        (defenderHpAfterFirstAttack) => {
          const doubleAttackGem: Gem = {
            id: "double-attack-gem",
            name: "Double Attack Stone",
            description: "Attack twice",
            skillType: "double_attack",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { attackCount: 2 },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: doubleAttackGem, currentCooldown: 0 }],
          };

          const defenderGems: BattleCardGems = {
            cardId: "defender-card",
            equippedGems: [],
          };

          const firstAttackResult = createMockAttackResult(
            defenderHpAfterFirstAttack,
          );

          // Mock performAttack callback
          const mockPerformAttack = (): AttackResult => {
            return createMockAttackResult(defenderHpAfterFirstAttack - 10);
          };

          const result = skillSystem.processCombatSkills(
            attackerGems,
            defenderGems,
            3, // Attacker position
            4, // Defender position
            firstAttackResult,
            mockPerformAttack,
          );

          // Should have exactly 1 additional attack
          expect(result.additionalAttacks.length).toBe(1);
          expect(result.skillsActivated.length).toBe(1);
          expect(result.skillsActivated[0].skillType).toBe("double_attack");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: double attack skips second attack when defender is defeated", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const doubleAttackGem: Gem = {
      id: "double-attack-gem",
      name: "Double Attack Stone",
      description: "Attack twice",
      skillType: "double_attack",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: { attackCount: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const attackerGems: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: doubleAttackGem, currentCooldown: 0 }],
    };

    const defenderGems: BattleCardGems = {
      cardId: "defender-card",
      equippedGems: [],
    };

    // Defender is defeated (HP = 0)
    const firstAttackResult = createMockAttackResult(0);

    // Mock performAttack callback (should not be called)
    let performAttackCalled = false;
    const mockPerformAttack = (): AttackResult => {
      performAttackCalled = true;
      return createMockAttackResult(0);
    };

    const result = skillSystem.processCombatSkills(
      attackerGems,
      defenderGems,
      3, // Attacker position
      4, // Defender position
      firstAttackResult,
      mockPerformAttack,
    );

    // Should have no additional attacks since defender is defeated
    expect(result.additionalAttacks.length).toBe(0);
    expect(performAttackCalled).toBe(false);
    // Skill still activates but doesn't perform second attack
    expect(result.skillsActivated.length).toBe(1);
    expect(result.skillsActivated[0].skillType).toBe("double_attack");
  });

  it("property: double attack on cooldown does not perform second attack", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (cooldown) => {
        const doubleAttackGem: Gem = {
          id: "double-attack-gem",
          name: "Double Attack Stone",
          description: "Attack twice",
          skillType: "double_attack",
          trigger: "combat",
          activationChance: 100,
          cooldown: 3,
          effectParams: { attackCount: 2 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const attackerGems: BattleCardGems = {
          cardId: "attacker-card",
          equippedGems: [{ gem: doubleAttackGem, currentCooldown: cooldown }],
        };

        const firstAttackResult = createMockAttackResult(50);

        // Mock performAttack callback (should not be called)
        let performAttackCalled = false;
        const mockPerformAttack = (): AttackResult => {
          performAttackCalled = true;
          return createMockAttackResult(40);
        };

        const result = skillSystem.processCombatSkills(
          attackerGems,
          { cardId: "defender", equippedGems: [] },
          3,
          4,
          firstAttackResult,
          mockPerformAttack,
        );

        // Should have no additional attacks when on cooldown
        expect(result.additionalAttacks.length).toBe(0);
        expect(performAttackCalled).toBe(false);
        expect(result.skillsActivated.length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: double attack without performAttack callback does not crash", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const doubleAttackGem: Gem = {
      id: "double-attack-gem",
      name: "Double Attack Stone",
      description: "Attack twice",
      skillType: "double_attack",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: { attackCount: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const attackerGems: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: doubleAttackGem, currentCooldown: 0 }],
    };

    const firstAttackResult = createMockAttackResult(50);

    // Call without performAttack callback
    const result = skillSystem.processCombatSkills(
      attackerGems,
      { cardId: "defender", equippedGems: [] },
      3,
      4,
      firstAttackResult,
      // No performAttack callback
    );

    // Should not crash, but no additional attacks
    expect(result.additionalAttacks.length).toBe(0);
    // Skill still activates
    expect(result.skillsActivated.length).toBe(1);
  });
});

/**
 * **Feature: gem-skill-system, Property 8: Execute Threshold**
 * **Validates: Requirements 7.1, 7.2**
 *
 * For any attack result where defender HP percentage is below threshold,
 * execute should set defender HP to 0.
 */
describe("Property 8: Execute Threshold", () => {
  it("property: execute kills defender when HP percentage is below threshold", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Execute threshold (1-50%)
        fc.integer({ min: 50, max: 200 }), // Defender max HP
        (executeThreshold, defenderMaxHp) => {
          // Calculate HP that is below threshold
          const hpBelowThreshold = Math.floor(
            (defenderMaxHp * (executeThreshold - 1)) / 100,
          );

          // Skip if HP would be 0 or negative
          if (hpBelowThreshold <= 0) {
            return;
          }

          const executeGem: Gem = {
            id: "execute-gem",
            name: "Execute Stone",
            description: `Kill if HP below ${executeThreshold}%`,
            skillType: "execute",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { executeThreshold },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: executeGem, currentCooldown: 0 }],
          };

          const attackResult = createMockAttackResult(
            hpBelowThreshold,
            defenderMaxHp,
          );

          const result = skillSystem.processCombatSkills(
            attackerGems,
            { cardId: "defender", equippedGems: [] },
            3,
            4,
            attackResult,
          );

          // Defender HP should be 0 (executed)
          expect(result.defenderNewHp).toBe(0);
          expect(result.skillsActivated.length).toBe(1);
          expect(result.skillsActivated[0].skillType).toBe("execute");
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: execute does not kill defender when HP percentage is above threshold", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // Execute threshold (1-50%)
        fc.integer({ min: 50, max: 200 }), // Defender max HP
        (executeThreshold, defenderMaxHp) => {
          // Calculate HP that is above threshold
          const hpAboveThreshold = Math.ceil(
            (defenderMaxHp * (executeThreshold + 1)) / 100,
          );

          const executeGem: Gem = {
            id: "execute-gem",
            name: "Execute Stone",
            description: `Kill if HP below ${executeThreshold}%`,
            skillType: "execute",
            trigger: "combat",
            activationChance: 100,
            cooldown: 0,
            effectParams: { executeThreshold },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          const attackerGems: BattleCardGems = {
            cardId: "attacker-card",
            equippedGems: [{ gem: executeGem, currentCooldown: 0 }],
          };

          const attackResult = createMockAttackResult(
            hpAboveThreshold,
            defenderMaxHp,
          );

          const result = skillSystem.processCombatSkills(
            attackerGems,
            { cardId: "defender", equippedGems: [] },
            3,
            4,
            attackResult,
          );

          // Defender HP should remain unchanged (not executed)
          expect(result.defenderNewHp).toBe(hpAboveThreshold);
          // Execute skill should not activate
          expect(result.skillsActivated.length).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: execute does not activate when defender is already defeated", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const executeGem: Gem = {
      id: "execute-gem",
      name: "Execute Stone",
      description: "Kill if HP below 15%",
      skillType: "execute",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: { executeThreshold: 15 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const attackerGems: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: executeGem, currentCooldown: 0 }],
    };

    // Defender is already defeated (HP = 0)
    const attackResult = createMockAttackResult(0, 100);

    const result = skillSystem.processCombatSkills(
      attackerGems,
      { cardId: "defender", equippedGems: [] },
      3,
      4,
      attackResult,
    );

    // Execute should not activate since defender is already defeated
    expect(result.defenderNewHp).toBe(0);
    expect(result.skillsActivated.length).toBe(0);
  });

  it("property: execute on cooldown does not kill defender", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    fc.assert(
      fc.property(fc.integer({ min: 1, max: 10 }), (cooldown) => {
        const executeGem: Gem = {
          id: "execute-gem",
          name: "Execute Stone",
          description: "Kill if HP below 15%",
          skillType: "execute",
          trigger: "combat",
          activationChance: 100,
          cooldown: 4,
          effectParams: { executeThreshold: 15 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const attackerGems: BattleCardGems = {
          cardId: "attacker-card",
          equippedGems: [{ gem: executeGem, currentCooldown: cooldown }],
        };

        // Defender HP is below threshold (10% of 100 = 10 HP)
        const attackResult = createMockAttackResult(10, 100);

        const result = skillSystem.processCombatSkills(
          attackerGems,
          { cardId: "defender", equippedGems: [] },
          3,
          4,
          attackResult,
        );

        // Defender HP should remain unchanged when on cooldown
        expect(result.defenderNewHp).toBe(10);
        expect(result.skillsActivated.length).toBe(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: execute uses default threshold of 15% when not specified", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const executeGem: Gem = {
      id: "execute-gem",
      name: "Execute Stone",
      description: "Kill if HP below threshold",
      skillType: "execute",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: {}, // No threshold specified
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const attackerGems: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: executeGem, currentCooldown: 0 }],
    };

    // Defender HP is 14% (below default 15% threshold)
    const attackResult = createMockAttackResult(14, 100);

    const result = skillSystem.processCombatSkills(
      attackerGems,
      { cardId: "defender", equippedGems: [] },
      3,
      4,
      attackResult,
    );

    // Defender should be executed
    expect(result.defenderNewHp).toBe(0);
    expect(result.skillsActivated.length).toBe(1);
    expect(result.skillsActivated[0].skillType).toBe("execute");
  });

  it("property: execute does not activate at exactly threshold percentage", () => {
    const alwaysSucceedRandom = () => 0.0;
    const skillSystem = createSkillSystem(alwaysSucceedRandom);

    const executeGem: Gem = {
      id: "execute-gem",
      name: "Execute Stone",
      description: "Kill if HP below 15%",
      skillType: "execute",
      trigger: "combat",
      activationChance: 100,
      cooldown: 0,
      effectParams: { executeThreshold: 15 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const attackerGems: BattleCardGems = {
      cardId: "attacker-card",
      equippedGems: [{ gem: executeGem, currentCooldown: 0 }],
    };

    // Defender HP is exactly 15% (at threshold, not below)
    const attackResult = createMockAttackResult(15, 100);

    const result = skillSystem.processCombatSkills(
      attackerGems,
      { cardId: "defender", equippedGems: [] },
      3,
      4,
      attackResult,
    );

    // Defender should NOT be executed (at threshold, not below)
    expect(result.defenderNewHp).toBe(15);
    expect(result.skillsActivated.length).toBe(0);
  });
});
