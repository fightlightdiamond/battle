/**
 * Property-based tests for Arena Battle Store
 * Using fast-check for property-based testing
 *
 * **Feature: arena-battle-mode**
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  useArenaBattleStore,
  getDistance,
  areAdjacent,
  getNextPosition,
  determinePhase,
  isInAttackRange,
  canCardMove,
} from "./arenaBattleStore";
import type { BattleCard } from "../types";
import type { CellIndex } from "../../arena1d/types/arena";
import {
  LEFT_BOUNDARY_INDEX,
  RIGHT_BOUNDARY_INDEX,
  PHASE_MOVING,
  PHASE_COMBAT,
  PHASE_FINISHED,
} from "../../arena1d/types/arena";

/**
 * Arbitrary generator for BattleCard
 * Updated to include effectiveRange for weapon attack range support
 */
const battleCardArb = fc
  .record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 50 }),
    imageUrl: fc.option(fc.webUrl(), { nil: null }),
    maxHp: fc.integer({ min: 100, max: 10000 }),
    currentHp: fc.integer({ min: 100, max: 10000 }),
    atk: fc.integer({ min: 1, max: 1000 }),
    def: fc.integer({ min: 0, max: 500 }),
    spd: fc.integer({ min: 1, max: 500 }),
    critChance: fc.integer({ min: 0, max: 100 }),
    critDamage: fc.integer({ min: 100, max: 300 }),
    armorPen: fc.integer({ min: 0, max: 100 }),
    lifesteal: fc.integer({ min: 0, max: 100 }),
    effectiveRange: fc.integer({ min: 1, max: 7 }), // Base (1) + weapon attackRange (0-6)
  })
  .map((card) => ({
    ...card,
    currentHp: Math.min(card.currentHp, card.maxHp), // Ensure currentHp <= maxHp
  })) as fc.Arbitrary<BattleCard>;

/**
 * Generate two different battle cards (with different IDs)
 */
const twoDistinctBattleCardsArb = fc
  .tuple(battleCardArb, battleCardArb)
  .filter(([card1, card2]) => card1.id !== card2.id);

/**
 * Generate two battle cards with limited effective range (< 7)
 * Used for tests that expect MOVING phase at initial positions (distance 7)
 * With effectiveRange < 7, neither card can attack from initial positions
 */
const twoDistinctBattleCardsWithLimitedRangeArb = fc
  .tuple(
    battleCardArb.map((card) => ({
      ...card,
      effectiveRange: Math.min(card.effectiveRange, 6), // Ensure effectiveRange < 7
    })),
    battleCardArb.map((card) => ({
      ...card,
      effectiveRange: Math.min(card.effectiveRange, 6), // Ensure effectiveRange < 7
    })),
  )
  .filter(([card1, card2]) => card1.id !== card2.id);

/**
 * Generate two battle cards with very limited effective range (1-2)
 * Used for tests that need multiple moves before combat
 * With effectiveRange <= 2, cards need to move several times before entering range
 */
const twoDistinctBattleCardsWithVeryLimitedRangeArb = fc
  .tuple(
    battleCardArb.map((card) => ({
      ...card,
      effectiveRange: 1, // Minimum effective range
    })),
    battleCardArb.map((card) => ({
      ...card,
      effectiveRange: 1, // Minimum effective range
    })),
  )
  .filter(([card1, card2]) => card1.id !== card2.id);

/**
 * Arbitrary generator for valid CellIndex (0-7)
 */
const cellIndexArb = fc.integer({ min: 0, max: 7 }) as fc.Arbitrary<CellIndex>;

/**
 * Generate two different cell positions
 */
const twoDistinctPositionsArb = fc
  .tuple(cellIndexArb, cellIndexArb)
  .filter(([pos1, pos2]) => pos1 !== pos2);

/**
 * Reset store before each test
 */
beforeEach(() => {
  useArenaBattleStore.getState().resetArena();
});

describe("arenaBattleStore", () => {
  /**
   * **Feature: arena-battle-mode, Property 2: Initial positions are at boundaries**
   * **Validates: Requirements 2.2, 2.3**
   *
   * For any arena battle start, the challenger card should be at position 0 (left boundary)
   * and the opponent card should be at position 7 (right boundary).
   */
  describe("Property 2: Initial positions are at boundaries", () => {
    it("challenger is placed at position 0 (left boundary) on initArena", () => {
      fc.assert(
        fc.property(twoDistinctBattleCardsArb, ([challenger, opponent]) => {
          useArenaBattleStore.getState().resetArena();
          useArenaBattleStore.getState().initArena(challenger, opponent);

          const state = useArenaBattleStore.getState();
          expect(state.leftPosition).toBe(LEFT_BOUNDARY_INDEX);
        }),
        { numRuns: 100 },
      );
    });

    it("opponent is placed at position 7 (right boundary) on initArena", () => {
      fc.assert(
        fc.property(twoDistinctBattleCardsArb, ([challenger, opponent]) => {
          useArenaBattleStore.getState().resetArena();
          useArenaBattleStore.getState().initArena(challenger, opponent);

          const state = useArenaBattleStore.getState();
          expect(state.rightPosition).toBe(RIGHT_BOUNDARY_INDEX);
        }),
        { numRuns: 100 },
      );
    });

    it("both cards are stored correctly on initArena", () => {
      fc.assert(
        fc.property(twoDistinctBattleCardsArb, ([challenger, opponent]) => {
          useArenaBattleStore.getState().resetArena();
          useArenaBattleStore.getState().initArena(challenger, opponent);

          const state = useArenaBattleStore.getState();
          expect(state.challenger?.id).toBe(challenger.id);
          expect(state.opponent?.id).toBe(opponent.id);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: arena-battle-mode, Property 3: Phase determination by distance**
   * **Validates: Requirements 3.1, 4.1**
   *
   * For any two card positions, if distance > 1 then phase should be 'moving',
   * if distance = 1 then phase should be 'combat'.
   */
  describe("Property 3: Phase determination by distance", () => {
    it("phase is 'moving' when distance > 1", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb.filter(
            ([pos1, pos2]) => Math.abs(pos1 - pos2) > 1,
          ),
          ([leftPos, rightPos]) => {
            const phase = determinePhase(leftPos, rightPos);
            expect(phase).toBe(PHASE_MOVING);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("phase is 'combat' when distance = 1", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb.filter(
            ([pos1, pos2]) => Math.abs(pos1 - pos2) === 1,
          ),
          ([leftPos, rightPos]) => {
            const phase = determinePhase(leftPos, rightPos);
            expect(phase).toBe(PHASE_COMBAT);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("initial arena phase is 'moving' when both cards have effectiveRange < 7", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            const state = useArenaBattleStore.getState();
            // Initial distance is 7 (positions 0 and 7)
            // With effectiveRange < 7 for both cards, phase should be 'moving'
            expect(state.arenaPhase).toBe(PHASE_MOVING);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("initial arena phase is 'combat' when either card has effectiveRange >= 7", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.filter(
            ([c1, c2]) => c1.effectiveRange >= 7 || c2.effectiveRange >= 7,
          ),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            const state = useArenaBattleStore.getState();
            // Initial distance is 7 (positions 0 and 7)
            // With effectiveRange >= 7 for either card, phase should be 'combat'
            expect(state.arenaPhase).toBe(PHASE_COMBAT);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("getDistance returns correct absolute difference", () => {
      fc.assert(
        fc.property(twoDistinctPositionsArb, ([pos1, pos2]) => {
          const distance = getDistance(pos1, pos2);
          expect(distance).toBe(Math.abs(pos1 - pos2));
          expect(distance).toBeGreaterThan(0);
        }),
        { numRuns: 100 },
      );
    });

    it("areAdjacent returns true only when distance is 1", () => {
      fc.assert(
        fc.property(twoDistinctPositionsArb, ([pos1, pos2]) => {
          const adjacent = areAdjacent(pos1, pos2);
          const distance = Math.abs(pos1 - pos2);
          expect(adjacent).toBe(distance === 1);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: arena-battle-mode, Property 4: Movement is exactly 1 cell toward opponent**
   * **Validates: Requirements 3.2**
   *
   * For any movement action, the moving card's new position should be exactly 1 cell
   * closer to the opponent's position.
   */
  describe("Property 4: Movement is exactly 1 cell toward opponent", () => {
    it("getNextPosition moves exactly 1 cell toward target", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb.filter(
            ([pos1, pos2]) => Math.abs(pos1 - pos2) > 1,
          ),
          ([currentPos, targetPos]) => {
            const newPos = getNextPosition(currentPos, targetPos);

            // New position should be exactly 1 cell closer
            const oldDistance = Math.abs(currentPos - targetPos);
            const newDistance = Math.abs(newPos - targetPos);
            expect(newDistance).toBe(oldDistance - 1);

            // Movement should be exactly 1 cell
            expect(Math.abs(newPos - currentPos)).toBe(1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("getNextPosition moves right when target is to the right", () => {
      fc.assert(
        fc.property(
          fc
            .tuple(
              fc.integer({ min: 0, max: 5 }) as fc.Arbitrary<CellIndex>,
              fc.integer({ min: 2, max: 7 }) as fc.Arbitrary<CellIndex>,
            )
            .filter(([current, target]) => current < target),
          ([currentPos, targetPos]) => {
            const newPos = getNextPosition(currentPos, targetPos);
            expect(newPos).toBe(currentPos + 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("getNextPosition moves left when target is to the left", () => {
      fc.assert(
        fc.property(
          fc
            .tuple(
              fc.integer({ min: 2, max: 7 }) as fc.Arbitrary<CellIndex>,
              fc.integer({ min: 0, max: 5 }) as fc.Arbitrary<CellIndex>,
            )
            .filter(([current, target]) => current > target),
          ([currentPos, targetPos]) => {
            const newPos = getNextPosition(currentPos, targetPos);
            expect(newPos).toBe(currentPos - 1);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("executeMove moves challenger 1 cell toward opponent when it is challenger turn and not in range", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            const stateBefore = useArenaBattleStore.getState();
            const leftPosBefore = stateBefore.leftPosition;
            const rightPosBefore = stateBefore.rightPosition;

            // First turn is challenger (left card)
            expect(stateBefore.currentTurn).toBe("challenger");
            // Should be in moving phase (effectiveRange < 7)
            expect(stateBefore.arenaPhase).toBe(PHASE_MOVING);

            useArenaBattleStore.getState().executeMove();

            const stateAfter = useArenaBattleStore.getState();

            // Left position should have moved 1 cell toward right
            expect(stateAfter.leftPosition).toBe(leftPosBefore + 1);
            // Right position should be unchanged
            expect(stateAfter.rightPosition).toBe(rightPosBefore);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("executeMove moves opponent 1 cell toward challenger when it is opponent turn and not in range", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithVeryLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Execute first move (challenger)
            useArenaBattleStore.getState().executeMove();

            const stateBefore = useArenaBattleStore.getState();
            const leftPosBefore = stateBefore.leftPosition;
            const rightPosBefore = stateBefore.rightPosition;

            // Second turn is opponent (right card)
            expect(stateBefore.currentTurn).toBe("opponent");
            // Should still be in moving phase (effectiveRange = 1, distance = 6)
            expect(stateBefore.arenaPhase).toBe(PHASE_MOVING);

            useArenaBattleStore.getState().executeMove();

            const stateAfter = useArenaBattleStore.getState();

            // Right position should have moved 1 cell toward left
            expect(stateAfter.rightPosition).toBe(rightPosBefore - 1);
            // Left position should be unchanged
            expect(stateAfter.leftPosition).toBe(leftPosBefore);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: arena-battle-mode, Property 5: Turn alternates after movement**
   * **Validates: Requirements 3.4**
   *
   * For any completed movement, the current turn should switch to the other card.
   */
  describe("Property 5: Turn alternates after movement", () => {
    it("turn switches from challenger to opponent after move when not in range", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Initial turn is challenger
            expect(useArenaBattleStore.getState().currentTurn).toBe(
              "challenger",
            );

            useArenaBattleStore.getState().executeMove();

            // After move, turn should be opponent
            expect(useArenaBattleStore.getState().currentTurn).toBe("opponent");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("turn switches from opponent to challenger after move when not in range", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithVeryLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Execute first move (challenger -> opponent)
            useArenaBattleStore.getState().executeMove();
            expect(useArenaBattleStore.getState().currentTurn).toBe("opponent");

            // Execute second move (opponent -> challenger)
            useArenaBattleStore.getState().executeMove();
            expect(useArenaBattleStore.getState().currentTurn).toBe(
              "challenger",
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("turn alternates correctly through multiple moves", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithLimitedRangeArb,
          fc.integer({ min: 2, max: 6 }),
          ([challenger, opponent], numMoves) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            const turns: string[] = [];

            for (let i = 0; i < numMoves; i++) {
              const state = useArenaBattleStore.getState();
              // Only move if still in moving phase
              if (state.arenaPhase !== PHASE_MOVING) break;

              turns.push(state.currentTurn);
              useArenaBattleStore.getState().executeMove();
            }

            // Verify alternation
            for (let i = 1; i < turns.length; i++) {
              expect(turns[i]).not.toBe(turns[i - 1]);
            }

            // First turn should be challenger
            if (turns.length > 0) {
              expect(turns[0]).toBe("challenger");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("turn alternates correctly in combat phase", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 100000,
                currentHp: 100000,
                effectiveRange: sharedRange,
              }, // High HP to prevent early end
              {
                ...c2,
                maxHp: 100000,
                currentHp: 100000,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move until combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_COMBAT,
            );

            // Track turns during combat
            const turns: string[] = [];
            for (let i = 0; i < 4; i++) {
              const state = useArenaBattleStore.getState();
              if (state.arenaPhase !== PHASE_COMBAT) break;

              turns.push(state.currentTurn);
              useArenaBattleStore.getState().executeAttack();
            }

            // Verify alternation in combat
            for (let i = 1; i < turns.length; i++) {
              expect(turns[i]).not.toBe(turns[i - 1]);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: arena-battle-mode, Property 6: Combat executes attacks correctly**
   * **Validates: Requirements 4.2**
   *
   * For any attack in combat phase, the damage calculation should use the existing
   * battle engine and update defender HP accordingly.
   */
  describe("Property 6: Combat executes attacks correctly", () => {
    /**
     * Helper to move cards to combat phase (adjacent positions)
     */
    const moveToAdjacentPositions = () => {
      while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
        useArenaBattleStore.getState().executeMove();
      }
    };

    it("executeAttack returns valid attack result with damage and updates state", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              // Use critChance: 0 to eliminate randomness in damage calculation
              {
                ...c1,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                critChance: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                critChance: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            moveToAdjacentPositions();
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_COMBAT,
            );

            const stateBefore = useArenaBattleStore.getState();
            const defenderHpBefore =
              stateBefore.currentTurn === "challenger"
                ? stateBefore.opponent!.currentHp
                : stateBefore.challenger!.currentHp;

            // Execute attack
            const attackResult = useArenaBattleStore.getState().executeAttack();

            // Verify attack result is valid
            expect(attackResult).not.toBeNull();
            expect(attackResult!.damage).toBeGreaterThanOrEqual(0);

            // Verify defender HP is reduced by the damage amount
            expect(attackResult!.defenderNewHp).toBe(
              Math.max(0, defenderHpBefore - attackResult!.damage),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("defender HP is updated correctly after attack", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            moveToAdjacentPositions();

            const stateBefore = useArenaBattleStore.getState();
            const isChallenger = stateBefore.currentTurn === "challenger";
            const defenderHpBefore = isChallenger
              ? stateBefore.opponent!.currentHp
              : stateBefore.challenger!.currentHp;

            const attackResult = useArenaBattleStore.getState().executeAttack();

            const stateAfter = useArenaBattleStore.getState();
            const defenderHpAfter = isChallenger
              ? stateAfter.opponent!.currentHp
              : stateAfter.challenger!.currentHp;

            // Defender HP should be reduced by damage
            expect(defenderHpAfter).toBe(
              Math.max(0, defenderHpBefore - attackResult!.damage),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("attacker HP is updated correctly with lifesteal", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            {
              ...c1,
              maxHp: 10000,
              currentHp: 5000, // Start with reduced HP
              lifesteal: fc.sample(fc.integer({ min: 10, max: 50 }), 1)[0], // Random lifesteal
              effectiveRange: 1, // Use minimum range to ensure predictable combat entry
            },
            {
              ...c2,
              maxHp: 10000,
              currentHp: 10000,
              lifesteal: 0,
              effectiveRange: 1, // Use minimum range to ensure predictable combat entry
            },
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            moveToAdjacentPositions();

            const stateBefore = useArenaBattleStore.getState();
            const attackerHpBefore = stateBefore.challenger!.currentHp;

            // Execute attack (challenger attacks first)
            const attackResult = useArenaBattleStore.getState().executeAttack();

            const stateAfter = useArenaBattleStore.getState();
            // After attack, turn switches, so check opponent (which was defender)
            // and challenger (which was attacker)
            const attackerHpAfter = stateAfter.challenger!.currentHp;

            // Attacker HP should increase by lifesteal amount (capped at maxHp)
            const expectedHp = Math.min(
              stateBefore.challenger!.maxHp,
              attackerHpBefore + (attackResult?.lifestealHeal ?? 0),
            );
            expect(attackerHpAfter).toBe(expectedHp);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("attack does not execute when not in combat phase", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithVeryLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Don't move to combat phase - stay in moving phase
            // With effectiveRange = 1 and distance = 7, phase should be MOVING
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_MOVING,
            );

            const attackResult = useArenaBattleStore.getState().executeAttack();

            // Attack should return null when not in combat phase
            expect(attackResult).toBeNull();

            // HP should remain unchanged
            expect(useArenaBattleStore.getState().challenger!.currentHp).toBe(
              challenger.currentHp,
            );
            expect(useArenaBattleStore.getState().opponent!.currentHp).toBe(
              opponent.currentHp,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("damage is always non-negative", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 10000,
                currentHp: 10000,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 10000,
                currentHp: 10000,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            moveToAdjacentPositions();

            const attackResult = useArenaBattleStore.getState().executeAttack();

            expect(attackResult).not.toBeNull();
            expect(attackResult!.damage).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: arena-battle-mode, Property 7: Battle ends when HP reaches 0**
   * **Validates: Requirements 4.4**
   *
   * For any card with HP <= 0, the battle should transition to 'finished' phase.
   */
  describe("Property 7: Battle ends when HP reaches 0", () => {
    it("battle transitions to finished when defender HP reaches 0", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            {
              ...c1,
              maxHp: 10000,
              currentHp: 10000,
              atk: 5000,
              effectiveRange: 1,
            }, // High ATK, min range
            {
              ...c2,
              maxHp: 100,
              currentHp: 100,
              def: 0,
              effectiveRange: 1,
            }, // Low HP, no DEF, min range
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Execute attack - should knock out opponent
            useArenaBattleStore.getState().executeAttack();

            const state = useArenaBattleStore.getState();

            // Battle should be finished
            expect(state.arenaPhase).toBe(PHASE_FINISHED);
            // Opponent HP should be 0
            expect(state.opponent!.currentHp).toBe(0);
            // Result should indicate challenger wins
            expect(state.result).toBe("challenger_wins");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("battle continues when both cards have HP > 0", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            { ...c1, maxHp: 100000, currentHp: 100000, atk: 10 }, // Low ATK
            { ...c2, maxHp: 100000, currentHp: 100000, def: 1000 }, // High HP and DEF
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Execute one attack
            useArenaBattleStore.getState().executeAttack();

            const state = useArenaBattleStore.getState();

            // Both cards should still have HP > 0
            expect(state.challenger!.currentHp).toBeGreaterThan(0);
            expect(state.opponent!.currentHp).toBeGreaterThan(0);

            // Battle should still be in combat phase
            expect(state.arenaPhase).toBe(PHASE_COMBAT);
            expect(state.result).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("result is challenger_wins when opponent HP reaches 0", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            {
              ...c1,
              maxHp: 10000,
              currentHp: 10000,
              atk: 10000,
              effectiveRange: 1,
            },
            { ...c2, maxHp: 50, currentHp: 50, def: 0, effectiveRange: 1 },
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Challenger attacks first
            useArenaBattleStore.getState().executeAttack();

            const state = useArenaBattleStore.getState();
            expect(state.result).toBe("challenger_wins");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("result is opponent_wins when challenger HP reaches 0", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 50,
                currentHp: 50,
                def: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 10000,
                currentHp: 10000,
                atk: 10000,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Challenger attacks first (won't knock out opponent)
            useArenaBattleStore.getState().executeAttack();

            // If battle not finished, opponent attacks
            if (useArenaBattleStore.getState().arenaPhase === PHASE_COMBAT) {
              useArenaBattleStore.getState().executeAttack();
            }

            const state = useArenaBattleStore.getState();
            expect(state.result).toBe("opponent_wins");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("HP never goes below 0", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            { ...c1, maxHp: 10000, currentHp: 10000, atk: 50000 }, // Very high ATK
            { ...c2, maxHp: 100, currentHp: 100, def: 0 },
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Execute attack
            useArenaBattleStore.getState().executeAttack();

            const state = useArenaBattleStore.getState();

            // HP should be clamped to 0, never negative
            expect(state.challenger!.currentHp).toBeGreaterThanOrEqual(0);
            expect(state.opponent!.currentHp).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("auto-battle is disabled when battle ends", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            {
              ...c1,
              maxHp: 10000,
              currentHp: 10000,
              atk: 10000,
              effectiveRange: 1,
            },
            { ...c2, maxHp: 50, currentHp: 50, def: 0, effectiveRange: 1 },
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Enable auto-battle
            useArenaBattleStore.getState().toggleAutoBattle();
            expect(useArenaBattleStore.getState().isAutoBattle).toBe(true);

            // Execute attack that ends battle
            useArenaBattleStore.getState().executeAttack();

            const state = useArenaBattleStore.getState();
            expect(state.arenaPhase).toBe(PHASE_FINISHED);
            // Auto-battle should be disabled when battle ends
            expect(state.isAutoBattle).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: arena-battle-mode, Property 8: Auto-battle executes correct action for phase**
   * **Validates: Requirements 5.3**
   *
   * For any auto-battle tick, if in 'moving' phase execute move, if in 'combat' phase execute attack.
   */
  describe("Property 8: Auto-battle executes correct action for phase", () => {
    /**
     * Simulates what auto-battle would do based on current phase
     * This tests the logic that determines which action to execute
     */
    it("in moving phase, auto-battle should execute move (position changes)", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsWithVeryLimitedRangeArb,
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Verify we're in moving phase (effectiveRange = 1, distance = 7)
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_MOVING,
            );

            const stateBefore = useArenaBattleStore.getState();
            const leftPosBefore = stateBefore.leftPosition;
            const rightPosBefore = stateBefore.rightPosition;

            // Simulate auto-battle action: in moving phase, execute move
            if (stateBefore.arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            const stateAfter = useArenaBattleStore.getState();

            // Position should have changed (one card moved)
            const positionChanged =
              stateAfter.leftPosition !== leftPosBefore ||
              stateAfter.rightPosition !== rightPosBefore;
            expect(positionChanged).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("in combat phase, auto-battle should execute attack (HP changes)", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 100000,
                currentHp: 100000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 100000,
                currentHp: 100000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Verify we're in combat phase
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_COMBAT,
            );

            const stateBefore = useArenaBattleStore.getState();
            const challengerHpBefore = stateBefore.challenger!.currentHp;
            const opponentHpBefore = stateBefore.opponent!.currentHp;

            // Simulate auto-battle action: in combat phase, execute attack
            // Both cards have the same effective range, so both can attack
            if (stateBefore.arenaPhase === PHASE_COMBAT) {
              useArenaBattleStore.getState().executeAttack();
            }

            const stateAfter = useArenaBattleStore.getState();

            // HP should have changed (one card took damage)
            const hpChanged =
              stateAfter.challenger!.currentHp !== challengerHpBefore ||
              stateAfter.opponent!.currentHp !== opponentHpBefore;
            expect(hpChanged).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("auto-battle toggle works correctly", () => {
      fc.assert(
        fc.property(twoDistinctBattleCardsArb, ([challenger, opponent]) => {
          useArenaBattleStore.getState().resetArena();
          useArenaBattleStore.getState().initArena(challenger, opponent);

          // Initially auto-battle is off
          expect(useArenaBattleStore.getState().isAutoBattle).toBe(false);

          // Toggle on
          useArenaBattleStore.getState().toggleAutoBattle();
          expect(useArenaBattleStore.getState().isAutoBattle).toBe(true);

          // Toggle off
          useArenaBattleStore.getState().toggleAutoBattle();
          expect(useArenaBattleStore.getState().isAutoBattle).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("auto-battle cannot be toggled in setup phase", () => {
      // Reset to initial state (setup phase)
      useArenaBattleStore.getState().resetArena();

      // Try to toggle auto-battle
      useArenaBattleStore.getState().toggleAutoBattle();

      // Should still be false (cannot toggle in setup phase)
      expect(useArenaBattleStore.getState().isAutoBattle).toBe(false);
    });

    it("auto-battle cannot be toggled in finished phase", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            {
              ...c1,
              maxHp: 10000,
              currentHp: 10000,
              atk: 10000,
              effectiveRange: 1,
            },
            { ...c2, maxHp: 50, currentHp: 50, def: 0, effectiveRange: 1 },
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Execute attack that ends battle
            useArenaBattleStore.getState().executeAttack();

            // Verify battle is finished
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_FINISHED,
            );

            // Try to toggle auto-battle
            useArenaBattleStore.getState().toggleAutoBattle();

            // Should still be false (cannot toggle in finished phase)
            expect(useArenaBattleStore.getState().isAutoBattle).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("correct action is determined by phase for any battle state", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 100000,
                currentHp: 100000,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 100000,
                currentHp: 100000,
                effectiveRange: sharedRange,
              },
            ];
          }),
          fc.integer({ min: 0, max: 10 }),
          ([challenger, opponent], numActions) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            for (let i = 0; i < numActions; i++) {
              const state = useArenaBattleStore.getState();

              if (state.arenaPhase === PHASE_FINISHED) break;

              // Simulate auto-battle logic: determine action based on phase
              if (state.arenaPhase === PHASE_MOVING) {
                const posBefore = {
                  left: state.leftPosition,
                  right: state.rightPosition,
                };
                useArenaBattleStore.getState().executeMove();
                const posAfter = useArenaBattleStore.getState();

                // Verify move was executed (position changed)
                expect(
                  posAfter.leftPosition !== posBefore.left ||
                    posAfter.rightPosition !== posBefore.right,
                ).toBe(true);
              } else if (state.arenaPhase === PHASE_COMBAT) {
                const hpBefore = {
                  challenger: state.challenger!.currentHp,
                  opponent: state.opponent!.currentHp,
                };
                useArenaBattleStore.getState().executeAttack();
                const hpAfter = useArenaBattleStore.getState();

                // Verify attack was executed (HP changed)
                // Both cards have the same effective range, so both can attack
                expect(
                  hpAfter.challenger!.currentHp !== hpBefore.challenger ||
                    hpAfter.opponent!.currentHp !== hpBefore.opponent,
                ).toBe(true);
              }
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: weapon-attack-range, Property 6: In-range determination using absolute distance**
   * **Validates: Requirements 3.1, 3.3**
   *
   * For any two card positions pos1 and pos2, and effective range R,
   * the target is in-range if and only if |pos1 - pos2| <= R.
   */
  describe("Property 6: In-range determination using absolute distance", () => {
    it("isInAttackRange returns true when distance <= effectiveRange", () => {
      fc.assert(
        fc.property(
          cellIndexArb,
          cellIndexArb,
          fc.integer({ min: 0, max: 7 }),
          (attackerPos, targetPos, effectiveRange) => {
            const distance = Math.abs(attackerPos - targetPos);
            const inRange = isInAttackRange(
              attackerPos,
              targetPos,
              effectiveRange,
            );

            if (distance <= effectiveRange) {
              expect(inRange).toBe(true);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("isInAttackRange returns false when distance > effectiveRange", () => {
      fc.assert(
        fc.property(
          cellIndexArb,
          cellIndexArb,
          fc.integer({ min: 0, max: 7 }),
          (attackerPos, targetPos, effectiveRange) => {
            const distance = Math.abs(attackerPos - targetPos);
            const inRange = isInAttackRange(
              attackerPos,
              targetPos,
              effectiveRange,
            );

            if (distance > effectiveRange) {
              expect(inRange).toBe(false);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("isInAttackRange is symmetric for same range", () => {
      fc.assert(
        fc.property(
          cellIndexArb,
          cellIndexArb,
          fc.integer({ min: 0, max: 7 }),
          (pos1, pos2, effectiveRange) => {
            // If A can hit B at range R, then B can hit A at range R
            const aCanHitB = isInAttackRange(pos1, pos2, effectiveRange);
            const bCanHitA = isInAttackRange(pos2, pos1, effectiveRange);
            expect(aCanHitB).toBe(bCanHitA);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("isInAttackRange with range 0 only returns true for same position", () => {
      fc.assert(
        fc.property(cellIndexArb, cellIndexArb, (attackerPos, targetPos) => {
          const inRange = isInAttackRange(attackerPos, targetPos, 0);
          expect(inRange).toBe(attackerPos === targetPos);
        }),
        { numRuns: 100 },
      );
    });

    it("isInAttackRange with range 7 always returns true for valid arena positions", () => {
      fc.assert(
        fc.property(cellIndexArb, cellIndexArb, (attackerPos, targetPos) => {
          // Max distance in arena is 7 (positions 0 to 7)
          const inRange = isInAttackRange(attackerPos, targetPos, 7);
          expect(inRange).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: weapon-attack-range, Property 7: Movement blocked when enemy in range**
   * **Validates: Requirements 4.1**
   *
   * For any card position and enemy position where distance <= card's effective range,
   * the card SHALL NOT be allowed to move.
   */
  describe("Property 7: Movement blocked when enemy in range", () => {
    it("canCardMove returns false when enemy is within effective range", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb,
          fc.integer({ min: 1, max: 7 }),
          ([cardPos, enemyPos], effectiveRange) => {
            const distance = Math.abs(cardPos - enemyPos);

            // Only test cases where enemy is in range
            fc.pre(distance <= effectiveRange);

            const canMove = canCardMove(cardPos, enemyPos, effectiveRange);
            expect(canMove).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("canCardMove is inverse of isInAttackRange", () => {
      fc.assert(
        fc.property(
          cellIndexArb,
          cellIndexArb,
          fc.integer({ min: 0, max: 7 }),
          (cardPos, enemyPos, effectiveRange) => {
            const inRange = isInAttackRange(cardPos, enemyPos, effectiveRange);
            const canMove = canCardMove(cardPos, enemyPos, effectiveRange);
            expect(canMove).toBe(!inRange);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: weapon-attack-range, Property 8: Movement allowed when enemy out of range**
   * **Validates: Requirements 4.2**
   *
   * For any card position and enemy position where distance > card's effective range,
   * the card SHALL be allowed to move.
   */
  describe("Property 8: Movement allowed when enemy out of range", () => {
    it("canCardMove returns true when enemy is outside effective range", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb,
          fc.integer({ min: 0, max: 6 }),
          ([cardPos, enemyPos], effectiveRange) => {
            const distance = Math.abs(cardPos - enemyPos);

            // Only test cases where enemy is out of range
            fc.pre(distance > effectiveRange);

            const canMove = canCardMove(cardPos, enemyPos, effectiveRange);
            expect(canMove).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("canCardMove with range 0 allows movement when positions differ", () => {
      fc.assert(
        fc.property(twoDistinctPositionsArb, ([cardPos, enemyPos]) => {
          // With range 0, only same position blocks movement
          // Since positions are distinct, movement should be allowed
          const canMove = canCardMove(cardPos, enemyPos, 0);
          expect(canMove).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("canCardMove with default range 1 allows movement when distance > 1", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb.filter(([p1, p2]) => Math.abs(p1 - p2) > 1),
          ([cardPos, enemyPos]) => {
            // Default effective range is 1
            const canMove = canCardMove(cardPos, enemyPos, 1);
            expect(canMove).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("canCardMove with default range 1 blocks movement when adjacent", () => {
      fc.assert(
        fc.property(
          twoDistinctPositionsArb.filter(([p1, p2]) => Math.abs(p1 - p2) === 1),
          ([cardPos, enemyPos]) => {
            // Default effective range is 1, adjacent means distance = 1
            const canMove = canCardMove(cardPos, enemyPos, 1);
            expect(canMove).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: weapon-attack-range, Property 9: Attack execution within effective range**
   * **Validates: Requirements 3.2, 5.1**
   *
   * For any attacker and target where distance <= attacker's effective range,
   * the Combat_System SHALL allow the attack to execute.
   */
  describe("Property 9: Attack execution within effective range", () => {
    it("executeAttack succeeds when attacker is within effective range of target", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards to ensure mutual combat
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Verify we're in combat phase
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_COMBAT,
            );

            const state = useArenaBattleStore.getState();
            const attackerPos =
              state.currentTurn === "challenger"
                ? state.leftPosition
                : state.rightPosition;
            const defenderPos =
              state.currentTurn === "challenger"
                ? state.rightPosition
                : state.leftPosition;
            const attacker =
              state.currentTurn === "challenger"
                ? state.challenger!
                : state.opponent!;

            // Verify attacker is in range
            const distance = Math.abs(attackerPos - defenderPos);
            expect(distance).toBeLessThanOrEqual(attacker.effectiveRange);

            // Execute attack - should succeed
            const attackResult = useArenaBattleStore.getState().executeAttack();

            // Attack should execute successfully
            expect(attackResult).not.toBeNull();
            expect(attackResult!.damage).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("executeAttack returns null when attacker is outside effective range of target", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => [
            // Challenger has very long range (can reach opponent from start)
            {
              ...c1,
              maxHp: 10000,
              currentHp: 10000,
              lifesteal: 0,
              effectiveRange: 7, // Can attack from initial position
            },
            // Opponent has very short range (cannot reach challenger)
            {
              ...c2,
              maxHp: 10000,
              currentHp: 10000,
              lifesteal: 0,
              effectiveRange: 1, // Cannot attack from distance 7
            },
          ]),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Initial distance is 7, challenger can attack (range 7), opponent cannot (range 1)
            // Phase should be COMBAT because challenger is in range
            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_COMBAT,
            );

            // First turn is challenger - should succeed
            const challengerAttack = useArenaBattleStore
              .getState()
              .executeAttack();
            expect(challengerAttack).not.toBeNull();

            // Now it's opponent's turn - should fail (out of range)
            const state = useArenaBattleStore.getState();
            expect(state.currentTurn).toBe("opponent");

            // Opponent tries to attack but is out of range (distance 7, range 1)
            const opponentAttack = useArenaBattleStore
              .getState()
              .executeAttack();
            expect(opponentAttack).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("attack damage is applied correctly when within range", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                critChance: 0, // No crit for predictable damage
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 10000,
                currentHp: 10000,
                lifesteal: 0,
                critChance: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            const stateBefore = useArenaBattleStore.getState();
            const defenderHpBefore =
              stateBefore.currentTurn === "challenger"
                ? stateBefore.opponent!.currentHp
                : stateBefore.challenger!.currentHp;

            const attackResult = useArenaBattleStore.getState().executeAttack();

            // Verify damage was applied
            expect(attackResult).not.toBeNull();
            expect(attackResult!.defenderNewHp).toBe(
              Math.max(0, defenderHpBefore - attackResult!.damage),
            );
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  /**
   * **Feature: weapon-attack-range, Property 10: Mutual combat when both in range**
   * **Validates: Requirements 5.3**
   *
   * For any two cards where each is within the other's effective range,
   * both cards SHALL be able to attack based on turn order.
   */
  describe("Property 10: Mutual combat when both in range", () => {
    it("both cards can attack when they have the same effective range", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 100000,
                currentHp: 100000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 100000,
                currentHp: 100000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            expect(useArenaBattleStore.getState().arenaPhase).toBe(
              PHASE_COMBAT,
            );

            // Get current turn (may be challenger or opponent depending on who entered range first)
            const firstTurn = useArenaBattleStore.getState().currentTurn;
            const secondTurn =
              firstTurn === "challenger" ? "opponent" : "challenger";

            // First attack
            const attack1 = useArenaBattleStore.getState().executeAttack();
            expect(attack1).not.toBeNull();

            // Second attack (should be the other card's turn)
            expect(useArenaBattleStore.getState().currentTurn).toBe(secondTurn);
            const attack2 = useArenaBattleStore.getState().executeAttack();
            expect(attack2).not.toBeNull();

            // Both attacks should have executed successfully
            expect(attack1!.damage).toBeGreaterThanOrEqual(0);
            expect(attack2!.damage).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("turn order alternates in mutual combat", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 100000,
                currentHp: 100000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 100000,
                currentHp: 100000,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Track turn order during combat
            const turns: string[] = [];
            for (let i = 0; i < 4; i++) {
              const state = useArenaBattleStore.getState();
              if (state.arenaPhase !== PHASE_COMBAT) break;

              turns.push(state.currentTurn);
              useArenaBattleStore.getState().executeAttack();
            }

            // Verify turn alternation (turns should alternate between challenger and opponent)
            for (let i = 1; i < turns.length; i++) {
              expect(turns[i]).not.toBe(turns[i - 1]);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("mutual combat continues until one card is defeated", () => {
      fc.assert(
        fc.property(
          twoDistinctBattleCardsArb.map(([c1, c2]) => {
            // Use the same effective range for both cards
            const sharedRange = Math.max(c1.effectiveRange, c2.effectiveRange);
            return [
              {
                ...c1,
                maxHp: 500,
                currentHp: 500,
                atk: 100,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
              {
                ...c2,
                maxHp: 500,
                currentHp: 500,
                atk: 100,
                lifesteal: 0,
                effectiveRange: sharedRange,
              },
            ];
          }),
          ([challenger, opponent]) => {
            useArenaBattleStore.getState().resetArena();
            useArenaBattleStore.getState().initArena(challenger, opponent);

            // Move to combat phase
            while (useArenaBattleStore.getState().arenaPhase === PHASE_MOVING) {
              useArenaBattleStore.getState().executeMove();
            }

            // Execute attacks until battle ends
            let attackCount = 0;
            const maxAttacks = 100; // Safety limit
            while (
              useArenaBattleStore.getState().arenaPhase === PHASE_COMBAT &&
              attackCount < maxAttacks
            ) {
              useArenaBattleStore.getState().executeAttack();
              attackCount++;
            }

            // Battle should have ended
            const finalState = useArenaBattleStore.getState();
            expect(finalState.arenaPhase).toBe(PHASE_FINISHED);
            expect(finalState.result).not.toBeNull();

            // One card should have 0 HP
            const challengerHp = finalState.challenger!.currentHp;
            const opponentHp = finalState.opponent!.currentHp;
            expect(challengerHp === 0 || opponentHp === 0).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
