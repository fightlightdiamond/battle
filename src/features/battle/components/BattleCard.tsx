/**
 * BattleCard Component - Displays a card in the battle arena with visual states
 * Requirements: 2.1, 3.5, 8.1, 8.3
 */

import { cn } from "@/lib/utils";
import type { BattleCard as BattleCardType, CardPosition } from "../types";
import { CARD_POSITIONS } from "../types";
import { HPBar } from "./HPBar";

export interface BattleCardProps {
  card: BattleCardType;
  position: CardPosition;
  isAttacking?: boolean;
  isReceivingDamage?: boolean;
  isDanger?: boolean; // HP < 25%
  isWinner?: boolean;
  isLoser?: boolean;
}

/**
 * BattleCard Component
 * Displays card image, name, ATK stat with HPBar and various visual states
 * including attack animation, damage received animation, danger indicator,
 * and winner/loser visual states.
 */
export function BattleCard({
  card,
  position,
  isAttacking = false,
  isReceivingDamage = false,
  isDanger = false,
  isWinner = false,
  isLoser = false,
}: BattleCardProps) {
  // Determine animation classes based on state
  const getAnimationClasses = () => {
    const classes: string[] = [];

    // Attack animation - shake/lunge effect (400ms per design spec)
    if (isAttacking) {
      classes.push(
        position === CARD_POSITIONS.LEFT
          ? "animate-attack-lunge-right"
          : "animate-attack-lunge-left"
      );
    }

    // Damage received animation
    if (isReceivingDamage) {
      classes.push("animate-damage-shake");
    }

    // Danger indicator - pulsing red border when HP < 25%
    if (isDanger && !isWinner && !isLoser) {
      classes.push("animate-danger-pulse");
    }

    // Winner state - glow effect
    if (isWinner) {
      classes.push("animate-winner-glow ring-4 ring-yellow-400");
    }

    // Loser state - dimmed appearance
    if (isLoser) {
      classes.push("opacity-50 grayscale");
    }

    return classes.join(" ");
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center p-4 rounded-xl bg-card border-2 transition-all duration-300",
        "w-64 shadow-lg",
        // Base border color
        !isDanger && !isWinner && !isLoser && "border-border",
        // Danger state border
        isDanger && !isWinner && !isLoser && "border-red-500",
        // Winner state border
        isWinner && "border-yellow-400",
        // Loser state border
        isLoser && "border-gray-400",
        // Animation classes
        getAnimationClasses()
      )}
      data-testid={`battle-card-${position}`}
    >
      {/* Winner/Loser Badge */}
      {(isWinner || isLoser) && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider z-10",
            isWinner && "bg-yellow-400 text-yellow-900",
            isLoser && "bg-gray-500 text-white"
          )}
        >
          {isWinner ? "Victory" : "Defeated"}
        </div>
      )}

      {/* Card Image */}
      <div
        className={cn(
          "relative w-48 h-48 rounded-lg overflow-hidden bg-muted mb-3",
          isReceivingDamage && "ring-2 ring-red-500"
        )}
      >
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Attack visual effect overlay */}
        {isAttacking && (
          <div className="absolute inset-0 bg-orange-500/30 animate-pulse" />
        )}

        {/* Damage received flash overlay */}
        {isReceivingDamage && (
          <div className="absolute inset-0 bg-red-500/40 animate-ping" />
        )}
      </div>

      {/* Card Name */}
      <h3
        className={cn(
          "text-lg font-bold text-center mb-2 truncate w-full",
          isWinner && "text-yellow-600",
          isLoser && "text-gray-500"
        )}
      >
        {card.name}
      </h3>

      {/* ATK Stat */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-medium text-muted-foreground">ATK:</span>
        <span className="text-lg font-bold text-orange-500">{card.atk}</span>
      </div>

      {/* HP Bar */}
      <div className="w-full">
        <HPBar
          currentHp={card.currentHp}
          maxHp={card.maxHp}
          showFlash={isReceivingDamage}
        />
      </div>

      {/* Danger indicator icon */}
      {isDanger && !isWinner && !isLoser && (
        <div className="absolute top-2 right-2 text-red-500 animate-pulse">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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
    </div>
  );
}

export default BattleCard;
