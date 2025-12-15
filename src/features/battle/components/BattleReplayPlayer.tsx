/**
 * BattleReplayPlayer Component
 *
 * Replays a battle from saved BattleRecord data with:
 * - Animated damage numbers and HP bar changes
 * - Crit indicators and lifesteal heals
 * - Playback controls (play/pause, speed, progress)
 *
 * Uses the same BattleCard component as BattleArenaPage for consistent UX.
 *
 * Requirements: 6.1, 6.2, 6.3
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { BattleRecord } from "../types/battleHistoryTypes";
import type { CardPosition, BattleCard as BattleCardType } from "../types";
import { useReplayState } from "../hooks/useReplayState";
import { ReplayControls } from "./ReplayControls";
import { BattleCard } from "./BattleCard";
import { cardApi } from "@/features/cards/api/cardApi";
import { getImageUrl } from "@/features/cards/services";

/**
 * Props for BattleReplayPlayer component
 */
export interface BattleReplayPlayerProps {
  /** Battle record to replay */
  battleRecord: BattleRecord;
  /** Callback when replay completes */
  onComplete?: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Convert CombatantSnapshot to BattleCard type for BattleCard component
 */
function combatantToBattleCard(
  combatant: BattleRecord["challenger"],
  currentHp: number,
  imageUrl?: string | null
): BattleCardType {
  return {
    id: combatant.id,
    name: combatant.name,
    imageUrl: imageUrl ?? combatant.imageUrl,
    maxHp: combatant.maxHp,
    currentHp: currentHp,
    atk: combatant.atk,
    def: combatant.def,
    spd: combatant.spd,
    critChance: combatant.critChance,
    critDamage: combatant.critDamage,
    armorPen: combatant.armorPen,
    lifesteal: combatant.lifesteal,
  };
}

/**
 * BattleReplayPlayer Component
 *
 * Main component that orchestrates battle replay with:
 * - Two combatant cards using BattleCard component (same as arena)
 * - Floating damage/heal numbers
 * - Playback controls
 *
 * Requirements: 6.1, 6.2, 6.3
 */
export function BattleReplayPlayer({
  battleRecord,
  onComplete,
  className,
}: BattleReplayPlayerProps) {
  const { state, controls, currentTurnRecord, totalTurns } = useReplayState(
    battleRecord,
    onComplete
  );

  // Track which turn's damage is currently being shown
  const [displayedTurn, setDisplayedTurn] = useState(0);

  // Fetch card images from OPFS storage (blob URLs expire after page refresh)
  const [challengerImageUrl, setChallengerImageUrl] = useState<
    string | null | undefined
  >(battleRecord.challenger.imageUrl);
  const [opponentImageUrl, setOpponentImageUrl] = useState<
    string | null | undefined
  >(battleRecord.opponent.imageUrl);

  // Fetch fresh image URLs from card data
  useEffect(() => {
    let cancelled = false;

    const fetchImages = async () => {
      try {
        // Fetch challenger card image
        const challengerCard = await cardApi.getById(
          battleRecord.challenger.id
        );
        if (!cancelled && challengerCard?.imagePath) {
          const url = await getImageUrl(challengerCard.imagePath);
          if (!cancelled && url) setChallengerImageUrl(url);
        }

        // Fetch opponent card image
        const opponentCard = await cardApi.getById(battleRecord.opponent.id);
        if (!cancelled && opponentCard?.imagePath) {
          const url = await getImageUrl(opponentCard.imagePath);
          if (!cancelled && url) setOpponentImageUrl(url);
        }
      } catch (error) {
        console.error("Failed to fetch card images:", error);
      }
    };

    fetchImages();

    return () => {
      cancelled = true;
    };
  }, [battleRecord.challenger.id, battleRecord.opponent.id]);

  // Show damage when turn changes
  const showDamage =
    currentTurnRecord !== null &&
    state.currentTurn > 0 &&
    displayedTurn === state.currentTurn;

  // When turn changes, start showing damage after a microtask to avoid sync setState
  useEffect(() => {
    if (currentTurnRecord && state.currentTurn > 0) {
      // Use setTimeout(0) to defer setState to next tick, avoiding sync setState in effect
      const setTurnTimer = setTimeout(() => {
        setDisplayedTurn(state.currentTurn);
      }, 0);

      // Auto-hide after animation (longer duration for better visibility)
      const hideTimer = setTimeout(() => {
        setDisplayedTurn(0);
      }, 2000);

      return () => {
        clearTimeout(setTurnTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [state.currentTurn, currentTurnRecord]);

  // Convert combatants to BattleCard format with current HP and fresh image URLs
  const challengerCard = useMemo(
    () =>
      combatantToBattleCard(
        battleRecord.challenger,
        state.challengerHp,
        challengerImageUrl
      ),
    [battleRecord.challenger, state.challengerHp, challengerImageUrl]
  );

  const opponentCard = useMemo(
    () =>
      combatantToBattleCard(
        battleRecord.opponent,
        state.opponentHp,
        opponentImageUrl
      ),
    [battleRecord.opponent, state.opponentHp, opponentImageUrl]
  );

  // Determine danger states (HP < 25%)
  const challengerInDanger =
    state.challengerHp > 0 &&
    state.challengerHp / battleRecord.challenger.maxHp < 0.25;
  const opponentInDanger =
    state.opponentHp > 0 &&
    state.opponentHp / battleRecord.opponent.maxHp < 0.25;

  // Handle damage animation end
  const handleDamageAnimationEnd = useCallback(() => {
    setDisplayedTurn(0);
  }, []);

  // Determine winner/loser states
  const isComplete = state.isComplete;
  const challengerIsWinner =
    isComplete && battleRecord.winnerId === battleRecord.challenger.id;
  const opponentIsWinner =
    isComplete && battleRecord.winnerId === battleRecord.opponent.id;

  // Determine which card receives damage based on current turn
  const isChallenger = currentTurnRecord
    ? currentTurnRecord.attackerId === battleRecord.challenger.id
    : false;
  const defenderPosition: CardPosition = isChallenger ? "right" : "left";
  const attackerPosition: CardPosition = isChallenger ? "left" : "right";

  // Prepare damage display - only show on defender card
  const challengerDamageDisplay =
    showDamage && currentTurnRecord && defenderPosition === "left"
      ? {
          damage: currentTurnRecord.damage.finalDamage,
          isCritical: currentTurnRecord.damage.isCrit,
        }
      : null;

  const opponentDamageDisplay =
    showDamage && currentTurnRecord && defenderPosition === "right"
      ? {
          damage: currentTurnRecord.damage.finalDamage,
          isCritical: currentTurnRecord.damage.isCrit,
        }
      : null;

  // Prepare heal display - only show on attacker card if lifesteal > 0
  const lifestealAmount = currentTurnRecord?.lifesteal.lifestealAmount ?? 0;

  const challengerHealDisplay =
    showDamage && lifestealAmount > 0 && attackerPosition === "left"
      ? { healAmount: lifestealAmount }
      : null;

  const opponentHealDisplay =
    showDamage && lifestealAmount > 0 && attackerPosition === "right"
      ? { healAmount: lifestealAmount }
      : null;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {/* Battle Arena */}
      <div className="flex items-center justify-center gap-4 md:gap-8 lg:gap-12 py-4">
        {/* Challenger Card (Left) */}
        <BattleCard
          card={challengerCard}
          position="left"
          isAttacking={showDamage && attackerPosition === "left"}
          isReceivingDamage={showDamage && defenderPosition === "left"}
          isDanger={challengerInDanger}
          isWinner={challengerIsWinner}
          isLoser={opponentIsWinner}
          damageDisplay={challengerDamageDisplay}
          healDisplay={challengerHealDisplay}
          animationKey={displayedTurn}
          onDamageAnimationEnd={handleDamageAnimationEnd}
        />

        {/* VS Indicator */}
        <div className="flex flex-col items-center">
          <div className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-yellow-400 to-orange-500 drop-shadow-lg">
            VS
          </div>
          {/* Turn Indicator */}
          {currentTurnRecord && !isComplete && (
            <div className="mt-4 text-sm text-white/70">
              {currentTurnRecord.attackerName}'s turn
            </div>
          )}
        </div>

        {/* Opponent Card (Right) */}
        <BattleCard
          card={opponentCard}
          position="right"
          isAttacking={showDamage && attackerPosition === "right"}
          isReceivingDamage={showDamage && defenderPosition === "right"}
          isDanger={opponentInDanger}
          isWinner={opponentIsWinner}
          isLoser={challengerIsWinner}
          damageDisplay={opponentDamageDisplay}
          healDisplay={opponentHealDisplay}
          animationKey={displayedTurn}
          onDamageAnimationEnd={handleDamageAnimationEnd}
        />
      </div>

      {/* Replay Controls */}
      <ReplayControls
        isPlaying={state.isPlaying}
        currentTurn={state.currentTurn}
        totalTurns={totalTurns}
        speed={state.speed}
        isComplete={state.isComplete}
        controls={controls}
        className="px-4"
      />
    </div>
  );
}

export default BattleReplayPlayer;
