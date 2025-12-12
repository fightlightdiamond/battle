/**
 * Property-based tests for Battle Store
 * Using fast-check for property-based testing
 */

import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { useBattleStore } from "./battleStore";
import { BATTLE_PARTICIPANTS, BATTLE_PHASES } from "../types";
import type { Card } from "../../cards/types";

/**
 * Arbitrary generator for Card (from cards feature)
 */
const cardArb = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  atk: fc.integer({ min: 1, max: 1000 }),
  hp: fc.integer({ min: 1, max: 1000 }),
  imagePath: fc.option(fc.string(), { nil: null }),
  imageUrl: fc.option(fc.webUrl(), { nil: null }),
  createdAt: fc.integer({ min: 0 }),
  updatedAt: fc.integer({ min: 0 }),
}) as fc.Arbitrary<Card>;

/**
 * Generate two different cards (with different IDs)
 */
const twoDistinctCardsArb = fc
  .tuple(cardArb, cardArb)
  .filter(([card1, card2]) => card1.id !== card2.id);

/**
 * Reset store before each test
 */
beforeEach(() => {
  useBattleStore.getState().resetBattle();
});

describe("battleStore", () => {
  /**
   * **Feature: card-battle-system, Property 1: Card Selection Prevents Duplicates**
   * **Validates: Requirements 1.4**
   *
   * For any card in the system, if that card is already selected as challenger,
   * attempting to select it as opponent SHALL be rejected and the selection state
   * SHALL remain unchanged.
   */
  describe("Property 1: Card Selection Prevents Duplicates", () => {
    it("selecting the same card as opponent when already challenger returns false and state unchanged", () => {
      fc.assert(
        fc.property(cardArb, (card) => {
          useBattleStore.getState().resetBattle();

          // Select card as challenger
          const result1 = useBattleStore.getState().selectChallenger(card);
          expect(result1).toBe(true);

          // Try to select same card as opponent
          const result2 = useBattleStore.getState().selectOpponent(card);
          expect(result2).toBe(false);

          // Verify opponent is still null
          const state = useBattleStore.getState();
          expect(state.opponent).toBeNull();
          expect(state.challenger?.id).toBe(card.id);
        }),
        { numRuns: 100 }
      );
    });

    it("selecting the same card as challenger when already opponent returns false and state unchanged", () => {
      fc.assert(
        fc.property(cardArb, (card) => {
          useBattleStore.getState().resetBattle();

          // Select card as opponent
          const result1 = useBattleStore.getState().selectOpponent(card);
          expect(result1).toBe(true);

          // Try to select same card as challenger
          const result2 = useBattleStore.getState().selectChallenger(card);
          expect(result2).toBe(false);

          // Verify challenger is still null
          const state = useBattleStore.getState();
          expect(state.challenger).toBeNull();
          expect(state.opponent?.id).toBe(card.id);
        }),
        { numRuns: 100 }
      );
    });

    it("selecting different cards succeeds", () => {
      fc.assert(
        fc.property(twoDistinctCardsArb, ([challengerCard, opponentCard]) => {
          useBattleStore.getState().resetBattle();

          // Select different cards
          const result1 = useBattleStore
            .getState()
            .selectChallenger(challengerCard);
          const result2 = useBattleStore
            .getState()
            .selectOpponent(opponentCard);

          expect(result1).toBe(true);
          expect(result2).toBe(true);

          const state = useBattleStore.getState();
          expect(state.challenger?.id).toBe(challengerCard.id);
          expect(state.opponent?.id).toBe(opponentCard.id);
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 2: Battle Phase Transitions**
   * **Validates: Requirements 1.2, 1.3, 1.5**
   *
   * For any battle state, the phase SHALL be:
   * - 'setup' when no cards or only one card is selected
   * - 'ready' when both challenger and opponent are selected and different
   * - 'fighting' after startBattle() is called from 'ready' phase
   * - 'finished' when either card's HP reaches zero or below
   */
  describe("Property 2: Battle Phase Transitions", () => {
    it("phase is 'setup' initially", () => {
      useBattleStore.getState().resetBattle();
      expect(useBattleStore.getState().phase).toBe(BATTLE_PHASES.SETUP);
    });

    it("phase is 'setup' when only challenger is selected", () => {
      fc.assert(
        fc.property(cardArb, (card) => {
          useBattleStore.getState().resetBattle();
          useBattleStore.getState().selectChallenger(card);
          expect(useBattleStore.getState().phase).toBe(BATTLE_PHASES.SETUP);
        }),
        { numRuns: 100 }
      );
    });

    it("phase is 'setup' when only opponent is selected", () => {
      fc.assert(
        fc.property(cardArb, (card) => {
          useBattleStore.getState().resetBattle();
          useBattleStore.getState().selectOpponent(card);
          expect(useBattleStore.getState().phase).toBe(BATTLE_PHASES.SETUP);
        }),
        { numRuns: 100 }
      );
    });

    it("phase is 'ready' when both cards are selected", () => {
      fc.assert(
        fc.property(twoDistinctCardsArb, ([challengerCard, opponentCard]) => {
          useBattleStore.getState().resetBattle();
          useBattleStore.getState().selectChallenger(challengerCard);
          useBattleStore.getState().selectOpponent(opponentCard);
          expect(useBattleStore.getState().phase).toBe(BATTLE_PHASES.READY);
        }),
        { numRuns: 100 }
      );
    });

    it("phase transitions to 'fighting' after startBattle()", () => {
      fc.assert(
        fc.property(twoDistinctCardsArb, ([challengerCard, opponentCard]) => {
          useBattleStore.getState().resetBattle();
          useBattleStore.getState().selectChallenger(challengerCard);
          useBattleStore.getState().selectOpponent(opponentCard);
          useBattleStore.getState().startBattle();
          expect(useBattleStore.getState().phase).toBe(BATTLE_PHASES.FIGHTING);
        }),
        { numRuns: 100 }
      );
    });

    it("phase transitions to 'finished' when a card's HP reaches zero", () => {
      fc.assert(
        fc.property(
          twoDistinctCardsArb.filter(
            ([c1, c2]) => c1.atk >= c2.hp || c2.atk >= c1.hp
          ),
          ([challengerCard, opponentCard]) => {
            useBattleStore.getState().resetBattle();
            useBattleStore.getState().selectChallenger(challengerCard);
            useBattleStore.getState().selectOpponent(opponentCard);
            useBattleStore.getState().startBattle();

            // Execute attacks until battle ends
            let maxIterations = 100;
            while (
              useBattleStore.getState().phase === BATTLE_PHASES.FIGHTING &&
              maxIterations > 0
            ) {
              useBattleStore.getState().executeAttack();
              maxIterations--;
            }

            expect(useBattleStore.getState().phase).toBe(
              BATTLE_PHASES.FINISHED
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 4: Turn Alternation**
   * **Validates: Requirements 3.3**
   *
   * For any sequence of N attacks in a battle, the attacker SHALL alternate
   * between challenger and opponent. If attack N is by challenger, attack N+1
   * SHALL be by opponent, and vice versa.
   */
  describe("Property 4: Turn Alternation", () => {
    it("attacker alternates between challenger and opponent after each attack", () => {
      fc.assert(
        fc.property(
          twoDistinctCardsArb.chain(([c1, c2]) =>
            fc.tuple(
              fc.constant(c1),
              fc.constant(c2),
              fc.integer({ min: 2, max: 10 })
            )
          ),
          ([challengerCard, opponentCard, numAttacks]) => {
            useBattleStore.getState().resetBattle();

            // Use high HP cards to ensure battle doesn't end early
            const highHpChallenger = { ...challengerCard, hp: 10000 };
            const highHpOpponent = { ...opponentCard, hp: 10000 };

            useBattleStore.getState().selectChallenger(highHpChallenger);
            useBattleStore.getState().selectOpponent(highHpOpponent);
            useBattleStore.getState().startBattle();

            // Track attackers
            const attackers: string[] = [];

            for (let i = 0; i < numAttacks; i++) {
              const currentAttacker = useBattleStore.getState().currentAttacker;
              attackers.push(currentAttacker);
              useBattleStore.getState().executeAttack();
            }

            // Verify alternation
            for (let i = 1; i < attackers.length; i++) {
              expect(attackers[i]).not.toBe(attackers[i - 1]);
            }

            // First attacker should be challenger
            expect(attackers[0]).toBe(BATTLE_PARTICIPANTS.CHALLENGER);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 8: Battle End Disables Attacks**
   * **Validates: Requirements 5.4**
   *
   * For any battle in 'finished' phase, calling executeAttack() SHALL have no effect
   * on the battle state (HP values, turn order, and log remain unchanged).
   */
  describe("Property 8: Battle End Disables Attacks", () => {
    it("executeAttack returns null and state unchanged when phase is 'finished'", () => {
      fc.assert(
        fc.property(
          twoDistinctCardsArb.map(([c1, c2]) => [
            { ...c1, hp: 1, atk: 100 }, // challenger will be knocked out quickly
            { ...c2, hp: 1000, atk: 100 },
          ]),
          ([challengerCard, opponentCard]) => {
            useBattleStore.getState().resetBattle();
            useBattleStore.getState().selectChallenger(challengerCard);
            useBattleStore.getState().selectOpponent(opponentCard);
            useBattleStore.getState().startBattle();

            // Execute attacks until battle ends
            while (useBattleStore.getState().phase === BATTLE_PHASES.FIGHTING) {
              useBattleStore.getState().executeAttack();
            }

            expect(useBattleStore.getState().phase).toBe(
              BATTLE_PHASES.FINISHED
            );

            // Capture state before attempting attack
            const stateBefore = useBattleStore.getState();
            const challengerHpBefore = stateBefore.challenger?.currentHp;
            const opponentHpBefore = stateBefore.opponent?.currentHp;
            const logLengthBefore = stateBefore.battleLog.length;
            const currentAttackerBefore = stateBefore.currentAttacker;

            // Try to execute attack
            const result = useBattleStore.getState().executeAttack();

            // Verify no changes
            expect(result).toBeNull();
            const stateAfter = useBattleStore.getState();
            expect(stateAfter.challenger?.currentHp).toBe(challengerHpBefore);
            expect(stateAfter.opponent?.currentHp).toBe(opponentHpBefore);
            expect(stateAfter.battleLog.length).toBe(logLengthBefore);
            expect(stateAfter.currentAttacker).toBe(currentAttackerBefore);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("executeAttack returns null when phase is 'setup'", () => {
      useBattleStore.getState().resetBattle();
      const result = useBattleStore.getState().executeAttack();
      expect(result).toBeNull();
    });

    it("executeAttack returns null when phase is 'ready'", () => {
      fc.assert(
        fc.property(twoDistinctCardsArb, ([challengerCard, opponentCard]) => {
          useBattleStore.getState().resetBattle();
          useBattleStore.getState().selectChallenger(challengerCard);
          useBattleStore.getState().selectOpponent(opponentCard);

          expect(useBattleStore.getState().phase).toBe(BATTLE_PHASES.READY);
          const result = useBattleStore.getState().executeAttack();
          expect(result).toBeNull();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: card-battle-system, Property 10: Auto-Battle Stops on Victory**
   * **Validates: Requirements 7.4**
   *
   * For any battle in auto-battle mode, when the phase transitions to 'finished',
   * the isAutoBattle flag SHALL be set to false.
   */
  describe("Property 10: Auto-Battle Stops on Victory", () => {
    it("isAutoBattle is set to false when battle ends", () => {
      fc.assert(
        fc.property(
          twoDistinctCardsArb.map(([c1, c2]) => [
            { ...c1, hp: 50, atk: 100 }, // Low HP for quick battle
            { ...c2, hp: 50, atk: 100 },
          ]),
          ([challengerCard, opponentCard]) => {
            useBattleStore.getState().resetBattle();
            useBattleStore.getState().selectChallenger(challengerCard);
            useBattleStore.getState().selectOpponent(opponentCard);
            useBattleStore.getState().startBattle();

            // Enable auto-battle
            useBattleStore.getState().toggleAutoBattle();
            expect(useBattleStore.getState().isAutoBattle).toBe(true);

            // Execute attacks until battle ends
            while (useBattleStore.getState().phase === BATTLE_PHASES.FIGHTING) {
              useBattleStore.getState().executeAttack();
            }

            // Verify auto-battle is disabled
            expect(useBattleStore.getState().phase).toBe(
              BATTLE_PHASES.FINISHED
            );
            expect(useBattleStore.getState().isAutoBattle).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });

    it("toggleAutoBattle only works during fighting phase", () => {
      fc.assert(
        fc.property(twoDistinctCardsArb, ([challengerCard, opponentCard]) => {
          useBattleStore.getState().resetBattle();

          // Try toggle in setup phase
          useBattleStore.getState().toggleAutoBattle();
          expect(useBattleStore.getState().isAutoBattle).toBe(false);

          // Select cards
          useBattleStore.getState().selectChallenger(challengerCard);
          useBattleStore.getState().selectOpponent(opponentCard);

          // Try toggle in ready phase
          useBattleStore.getState().toggleAutoBattle();
          expect(useBattleStore.getState().isAutoBattle).toBe(false);

          // Start battle
          useBattleStore.getState().startBattle();

          // Toggle should work in fighting phase
          useBattleStore.getState().toggleAutoBattle();
          expect(useBattleStore.getState().isAutoBattle).toBe(true);

          // Toggle again
          useBattleStore.getState().toggleAutoBattle();
          expect(useBattleStore.getState().isAutoBattle).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
