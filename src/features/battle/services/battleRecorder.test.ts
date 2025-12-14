/**
 * Property-based tests for BattleRecorder Service
 * Using fast-check for property-based testing
 *
 * Tests validate that BattleRecorder correctly records battle data
 * with proper turn ordering, HP timeline consistency, and calculations.
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import {
  createBattleRecorder,
  type BattleRecorderInstance,
} from "./battleRecorder";
import type {
  Combatant,
  AttackResult,
  CombatantStats,
} from "../engine/core/types";

// ============================================================================
// TEST HELPERS
// ============================================================================

/**
 * Create a Combatant from arbitrary data
 */
function createTestCombatant(
  id: string,
  name: string,
  hp: number,
  stats: CombatantStats
): Combatant {
  return {
    id,
    name,
    imageUrl: null,
    baseStats: stats,
    currentHp: hp,
    maxHp: hp,
    buffs: [],
    isDefeated: false,
  };
}

/**
 * Create an AttackResult for testing
 */
function createTestAttackResult(
  attacker: Combatant,
  defender: Combatant,
  damage: number,
  isCrit: boolean,
  lifestealHeal: number,
  defenderNewHp: number,
  attackerNewHp: number
): AttackResult {
  const baseDamage = isCrit ? Math.floor(damage / 1.5) : damage;
  const critBonus = isCrit ? damage - baseDamage : 0;

  return {
    attacker: { ...attacker, currentHp: attackerNewHp },
    defender: {
      ...defender,
      currentHp: defenderNewHp,
      isDefeated: defenderNewHp <= 0,
    },
    damage,
    defenderNewHp,
    attackerNewHp,
    isCritical: isCrit,
    isKnockout: defenderNewHp <= 0,
    lifestealHeal,
    damageResult: {
      finalDamage: damage,
      baseDamage,
      isCrit,
      critBonus,
      lifestealAmount: lifestealHeal,
    },
  };
}

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for CombatantStats
 */
const combatantStatsArb: fc.Arbitrary<CombatantStats> = fc.record({
  atk: fc.integer({ min: 10, max: 500 }),
  def: fc.integer({ min: 0, max: 300 }),
  spd: fc.integer({ min: 50, max: 200 }),
  critChance: fc.integer({ min: 0, max: 100 }),
  critDamage: fc.integer({ min: 100, max: 300 }),
  armorPen: fc.integer({ min: 0, max: 100 }),
  lifesteal: fc.integer({ min: 0, max: 100 }),
});

/**
 * Generator for a pair of combatants (challenger and opponent)
 */
const combatantPairArb = fc
  .tuple(
    fc.uuid(),
    fc.uuid(),
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.integer({ min: 100, max: 1000 }),
    fc.integer({ min: 100, max: 1000 }),
    combatantStatsArb,
    combatantStatsArb
  )
  .map(([id1, id2, name1, name2, hp1, hp2, stats1, stats2]) => ({
    challenger: createTestCombatant(id1, name1, hp1, stats1),
    opponent: createTestCombatant(id2, name2, hp2, stats2),
  }));

/**
 * Generator for turn count (number of turns in a battle)
 */
const turnCountArb = fc.integer({ min: 1, max: 50 });

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("BattleRecorder - Property Tests", () => {
  let recorder: BattleRecorderInstance;

  beforeEach(() => {
    recorder = createBattleRecorder();
  });

  /**
   * **Feature: battle-history, Property 3: Turn Order Preservation**
   *
   * For any BattleRecord with n turns, the turnNumber values SHALL be
   * sequential from 1 to n with no gaps or duplicates.
   *
   * **Validates: Requirements 2.6**
   */
  it("Property 3: Turn numbers are sequential from 1 to n with no gaps or duplicates", () => {
    fc.assert(
      fc.property(
        combatantPairArb,
        turnCountArb,
        ({ challenger, opponent }, turnCount) => {
          recorder.startRecording(challenger, opponent);

          let currentChallenger = { ...challenger };
          let currentOpponent = { ...opponent };

          for (let i = 1; i <= turnCount; i++) {
            const isChallegerAttacking = i % 2 === 1;
            const attacker = isChallegerAttacking
              ? currentChallenger
              : currentOpponent;
            const defender = isChallegerAttacking
              ? currentOpponent
              : currentChallenger;

            const damage = Math.min(50, defender.currentHp);
            const defenderNewHp = Math.max(0, defender.currentHp - damage);
            const lifestealHeal = Math.floor(
              (damage * attacker.baseStats.lifesteal) / 100
            );
            const attackerNewHp = Math.min(
              attacker.maxHp,
              attacker.currentHp + lifestealHeal
            );

            const attackResult = createTestAttackResult(
              attacker,
              defender,
              damage,
              false,
              lifestealHeal,
              defenderNewHp,
              attackerNewHp
            );

            recorder.recordTurn(
              i,
              attacker,
              defender,
              attackResult,
              defender.currentHp,
              attacker.currentHp
            );

            if (isChallegerAttacking) {
              currentChallenger = {
                ...currentChallenger,
                currentHp: attackerNewHp,
              };
              currentOpponent = {
                ...currentOpponent,
                currentHp: defenderNewHp,
              };
            } else {
              currentOpponent = {
                ...currentOpponent,
                currentHp: attackerNewHp,
              };
              currentChallenger = {
                ...currentChallenger,
                currentHp: defenderNewHp,
              };
            }

            if (defenderNewHp <= 0) break;
          }

          const record = recorder.finishRecording(
            challenger.id,
            challenger.name
          );

          const turnNumbers = record.turns.map((t) => t.turnNumber);
          const uniqueTurnNumbers = new Set(turnNumbers);
          expect(uniqueTurnNumbers.size).toBe(turnNumbers.length);

          for (let i = 0; i < turnNumbers.length; i++) {
            expect(turnNumbers[i]).toBe(i + 1);
          }

          expect(turnNumbers.length).toBe(record.totalTurns);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-history, Property 4: HP Timeline Consistency**
   *
   * For any BattleRecord, hpTimeline SHALL have exactly (totalTurns + 1) entries,
   * starting with turn 0 (initial state). Each entry's HP values SHALL match
   * the corresponding turn's HP changes.
   *
   * **Validates: Requirements 5.1, 5.2, 5.6**
   */
  it("Property 4: HP Timeline has correct length and matches turn HP changes", () => {
    fc.assert(
      fc.property(
        combatantPairArb,
        turnCountArb,
        ({ challenger, opponent }, turnCount) => {
          recorder.startRecording(challenger, opponent);

          let challengerHp = challenger.currentHp;
          let opponentHp = opponent.currentHp;
          const expectedTimeline: Array<{
            challengerHp: number;
            opponentHp: number;
          }> = [{ challengerHp, opponentHp }];

          let currentChallenger = { ...challenger };
          let currentOpponent = { ...opponent };

          for (let i = 1; i <= turnCount; i++) {
            const isChallegerAttacking = i % 2 === 1;
            const attacker = isChallegerAttacking
              ? currentChallenger
              : currentOpponent;
            const defender = isChallegerAttacking
              ? currentOpponent
              : currentChallenger;

            const damage = Math.min(50, defender.currentHp);
            const defenderNewHp = Math.max(0, defender.currentHp - damage);
            const lifestealHeal = Math.floor(
              (damage * attacker.baseStats.lifesteal) / 100
            );
            const attackerNewHp = Math.min(
              attacker.maxHp,
              attacker.currentHp + lifestealHeal
            );

            const attackResult = createTestAttackResult(
              attacker,
              defender,
              damage,
              false,
              lifestealHeal,
              defenderNewHp,
              attackerNewHp
            );

            recorder.recordTurn(
              i,
              attacker,
              defender,
              attackResult,
              defender.currentHp,
              attacker.currentHp
            );

            if (isChallegerAttacking) {
              challengerHp = attackerNewHp;
              opponentHp = defenderNewHp;
              currentChallenger = {
                ...currentChallenger,
                currentHp: attackerNewHp,
              };
              currentOpponent = {
                ...currentOpponent,
                currentHp: defenderNewHp,
              };
            } else {
              opponentHp = attackerNewHp;
              challengerHp = defenderNewHp;
              currentOpponent = {
                ...currentOpponent,
                currentHp: attackerNewHp,
              };
              currentChallenger = {
                ...currentChallenger,
                currentHp: defenderNewHp,
              };
            }

            expectedTimeline.push({ challengerHp, opponentHp });

            if (defenderNewHp <= 0) break;
          }

          const record = recorder.finishRecording(
            challenger.id,
            challenger.name
          );

          expect(record.hpTimeline.length).toBe(record.totalTurns + 1);
          expect(record.hpTimeline[0].turnNumber).toBe(0);

          for (let i = 0; i < record.hpTimeline.length; i++) {
            expect(record.hpTimeline[i].turnNumber).toBe(i);
          }

          for (let i = 0; i < expectedTimeline.length; i++) {
            expect(record.hpTimeline[i].challengerHp).toBe(
              expectedTimeline[i].challengerHp
            );
            expect(record.hpTimeline[i].opponentHp).toBe(
              expectedTimeline[i].opponentHp
            );
          }

          for (const entry of record.hpTimeline) {
            expect(entry.challengerMaxHp).toBe(challenger.maxHp);
            expect(entry.opponentMaxHp).toBe(opponent.maxHp);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-history, Property 5: Defender HP Calculation**
   *
   * For any TurnRecord, defenderHpAfter SHALL equal max(0, defenderHpBefore - finalDamage),
   * and isKnockout SHALL be true if and only if defenderHpAfter equals 0.
   *
   * **Validates: Requirements 2.4**
   */
  it("Property 5: Defender HP is correctly calculated after damage", () => {
    fc.assert(
      fc.property(
        combatantPairArb,
        fc.integer({ min: 1, max: 500 }), // damage amount
        fc.boolean(), // isCrit
        ({ challenger, opponent }, damageAmount, isCrit) => {
          recorder.startRecording(challenger, opponent);

          const attacker = challenger;
          const defender = opponent;
          const defenderHpBefore = defender.currentHp;

          // Calculate expected values
          const expectedDefenderHpAfter = Math.max(
            0,
            defenderHpBefore - damageAmount
          );
          const expectedIsKnockout = expectedDefenderHpAfter === 0;

          const lifestealHeal = Math.floor(
            (damageAmount * attacker.baseStats.lifesteal) / 100
          );
          const attackerNewHp = Math.min(
            attacker.maxHp,
            attacker.currentHp + lifestealHeal
          );

          const attackResult = createTestAttackResult(
            attacker,
            defender,
            damageAmount,
            isCrit,
            lifestealHeal,
            expectedDefenderHpAfter,
            attackerNewHp
          );

          recorder.recordTurn(
            1,
            attacker,
            defender,
            attackResult,
            defenderHpBefore,
            attacker.currentHp
          );

          const record = recorder.finishRecording(
            challenger.id,
            challenger.name
          );
          const turn = record.turns[0];

          // Verify defender HP calculation
          expect(turn.defenderHp.defenderHpBefore).toBe(defenderHpBefore);
          expect(turn.defenderHp.defenderHpAfter).toBe(expectedDefenderHpAfter);
          expect(turn.defenderHp.defenderHpAfter).toBe(
            Math.max(
              0,
              turn.defenderHp.defenderHpBefore - turn.damage.finalDamage
            )
          );

          // Verify isKnockout is true iff defenderHpAfter === 0
          expect(turn.defenderHp.isKnockout).toBe(expectedIsKnockout);
          expect(turn.defenderHp.isKnockout).toBe(
            turn.defenderHp.defenderHpAfter === 0
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: battle-history, Property 6: Lifesteal Calculation**
   *
   * For any TurnRecord where attackerLifestealPercent > 0, lifestealAmount SHALL equal
   * floor(finalDamage * attackerLifestealPercent / 100), and attackerHpAfter SHALL equal
   * min(attackerHpBefore + lifestealAmount, attackerMaxHp).
   *
   * **Validates: Requirements 2.3**
   */
  it("Property 6: Lifesteal is correctly calculated", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 1000 }), // challenger HP
        fc.integer({ min: 100, max: 1000 }), // opponent HP
        fc.integer({ min: 1, max: 100 }), // lifesteal percent (> 0)
        fc.integer({ min: 10, max: 500 }), // damage amount
        (
          id1,
          id2,
          name1,
          name2,
          challengerHp,
          opponentHp,
          lifestealPercent,
          damageAmount
        ) => {
          const challengerStats: CombatantStats = {
            atk: 100,
            def: 50,
            spd: 100,
            critChance: 0,
            critDamage: 150,
            armorPen: 0,
            lifesteal: lifestealPercent,
          };

          const opponentStats: CombatantStats = {
            atk: 100,
            def: 50,
            spd: 100,
            critChance: 0,
            critDamage: 150,
            armorPen: 0,
            lifesteal: 0,
          };

          const challenger = createTestCombatant(
            id1,
            name1,
            challengerHp,
            challengerStats
          );
          const opponent = createTestCombatant(
            id2,
            name2,
            opponentHp,
            opponentStats
          );

          recorder.startRecording(challenger, opponent);

          const attackerHpBefore = challenger.currentHp;
          const defenderHpBefore = opponent.currentHp;

          // Calculate expected lifesteal values
          const expectedLifestealAmount = Math.floor(
            (damageAmount * lifestealPercent) / 100
          );
          const expectedAttackerHpAfter = Math.min(
            attackerHpBefore + expectedLifestealAmount,
            challenger.maxHp
          );
          const defenderNewHp = Math.max(0, defenderHpBefore - damageAmount);

          const attackResult = createTestAttackResult(
            challenger,
            opponent,
            damageAmount,
            false,
            expectedLifestealAmount,
            defenderNewHp,
            expectedAttackerHpAfter
          );

          recorder.recordTurn(
            1,
            challenger,
            opponent,
            attackResult,
            defenderHpBefore,
            attackerHpBefore
          );

          const record = recorder.finishRecording(
            challenger.id,
            challenger.name
          );
          const turn = record.turns[0];

          // Verify lifesteal calculation
          expect(turn.lifesteal.attackerLifestealPercent).toBe(
            lifestealPercent
          );
          expect(turn.lifesteal.lifestealAmount).toBe(expectedLifestealAmount);
          expect(turn.lifesteal.lifestealAmount).toBe(
            Math.floor(
              (turn.damage.finalDamage *
                turn.lifesteal.attackerLifestealPercent) /
                100
            )
          );

          // Verify attacker HP after lifesteal
          expect(turn.lifesteal.attackerHpBefore).toBe(attackerHpBefore);
          expect(turn.lifesteal.attackerHpAfter).toBe(expectedAttackerHpAfter);
          expect(turn.lifesteal.attackerHpAfter).toBe(
            Math.min(
              turn.lifesteal.attackerHpBefore + turn.lifesteal.lifestealAmount,
              turn.lifesteal.attackerMaxHp
            )
          );

          // Verify HP is capped at maxHp
          expect(turn.lifesteal.attackerHpAfter).toBeLessThanOrEqual(
            turn.lifesteal.attackerMaxHp
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
