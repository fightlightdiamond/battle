/**
 * ArenaCardWithStats Component - Card display with HP bar and stats overlay
 * Requirements: 6.1, 6.2, 6.3, 6.4
 *
 * Wraps ArenaCard with HP bar, ATK/DEF stats, and damage/heal display.
 * Used in Arena Battle Mode to show card state during combat.
 */

import { cn } from "@/lib/utils";
import type { ArenaCardData, CardSide, MoveDirection } from "../types";
import { SIDE_LEFT } from "../types";
import { ArenaCard } from "./ArenaCard";
import { DamageNumber } from "@/features/battle/components/DamageNumber";
import { HealNumber } from "@/features/battle/components/HealNumber";
import { getHpBarColor } from "@/features/battle/services/battleService";
import { isDangerState, getHpBarPercentage } from "./arenaCardUtils";

export interface ArenaCardWithStatsProps {
  /** Card data with combat stats */
  card: ArenaCardData & {
    currentHp: number;
    maxHp: number;
    atk: number;
    def: number;
  };
  /** Side of the arena (left/right) */
  side: CardSide;
  /** Whether card is currently moving */
  isMoving?: boolean;
  /** Whether card is in combat (adjacent to opponent) */
  isInCombat?: boolean;
  /** Direction of movement animation (reserved for future use) */
  moveDirection?: MoveDirection;
  /** Whether movement animation just completed (reserved for future use) */
  moveComplete?: boolean;
  /** Damage to display on this card */
  damageDisplay?: { damage: number; isCritical: boolean } | null;
  /** Heal to display on this card (lifesteal) */
  healDisplay?: { healAmount: number } | null;
  /** Key to force re-mount damage/heal animations */
  animationKey?: number;
  /** Callback when damage animation ends */
  onDamageAnimationEnd?: () => void;
  /** Callback when heal animation ends */
  onHealAnimationEnd?: () => void;
}

/**
 * Get Tailwind CSS class for HP bar color
 */
function getColorClass(color: "green" | "yellow" | "red"): string {
  switch (color) {
    case "green":
      return "bg-green-500";
    case "yellow":
      return "bg-yellow-500";
    case "red":
      return "bg-red-500";
  }
}

/**
 * ArenaCardWithStats Component
 * Displays ArenaCard with HP bar overlay, ATK/DEF stats, and damage/heal numbers.
 */
export function ArenaCardWithStats({
  card,
  side,
  isMoving = false,
  isInCombat = false,
  // moveDirection and moveComplete are kept in props for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moveDirection: _moveDirection,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  moveComplete: _moveComplete = false,
  damageDisplay = null,
  healDisplay = null,
  animationKey = 0,
  onDamageAnimationEnd,
  onHealAnimationEnd,
}: ArenaCardWithStatsProps) {
  const hpPercentage = getHpBarPercentage(card.currentHp, card.maxHp);
  const isDanger = isDangerState(card.currentHp, card.maxHp);
  const hpColor = getHpBarColor(hpPercentage);
  const colorClass = getColorClass(hpColor);

  return (
    <div
      data-testid={`arena-card-with-stats-${side}`}
      data-danger={isDanger}
      className={cn(
        "relative flex flex-col items-center",
        // Danger state visual - pulsing border
        isDanger && "animate-pulse",
      )}
    >
      {/* Card with ArenaCard component */}
      <div className="relative">
        <ArenaCard
          card={card}
          side={side}
          isMoving={isMoving}
          isInCombat={isInCombat}
        />

        {/* Danger indicator icon */}
        {isDanger && (
          <div
            data-testid="danger-indicator"
            className="absolute -top-1 -right-1 text-red-500 animate-pulse"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        )}

        {/* Damage Number - Centered on card */}
        {damageDisplay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <DamageNumber
              key={`damage-${animationKey}`}
              damage={damageDisplay.damage}
              isCritical={damageDisplay.isCritical}
              position={side === SIDE_LEFT ? "left" : "right"}
              onAnimationEnd={onDamageAnimationEnd}
              centered
            />
          </div>
        )}

        {/* Heal Number - Centered on card */}
        {healDisplay && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <HealNumber
              key={`heal-${animationKey}`}
              healAmount={healDisplay.healAmount}
              position={side === SIDE_LEFT ? "left" : "right"}
              onAnimationEnd={onHealAnimationEnd}
              centered
            />
          </div>
        )}
      </div>

      {/* HP Bar - Below card */}
      <div className="w-14 mt-1">
        <div
          data-testid="hp-bar-container"
          className={cn(
            "h-1.5 w-full overflow-hidden rounded-full bg-gray-300",
            isDanger && "ring-1 ring-red-500",
          )}
        >
          <div
            data-testid="hp-bar-fill"
            data-percentage={hpPercentage}
            className={cn(
              "h-full rounded-full transition-all duration-300",
              colorClass,
            )}
            style={{ width: `${hpPercentage}%` }}
          />
        </div>
        {/* HP Text - Small display */}
        <div className="text-[8px] text-center text-gray-600 mt-0.5">
          {card.currentHp}/{card.maxHp}
        </div>
      </div>

      {/* Stats Display - ATK/DEF below HP bar */}
      <div
        data-testid="stats-display"
        className={cn(
          "flex gap-1 text-[8px] font-medium mt-0.5",
          side === SIDE_LEFT ? "text-blue-600" : "text-red-600",
        )}
      >
        <span data-testid="atk-stat">ATK:{card.atk}</span>
        <span data-testid="def-stat">DEF:{card.def}</span>
      </div>
    </div>
  );
}

export default ArenaCardWithStats;
