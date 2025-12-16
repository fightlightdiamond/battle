/**
 * ArenaCard Component - Simple card image display for 1D arena cells
 * Requirements: 2.1, 2.4
 *
 * Arena only shows card positions with images.
 * Combat UI is handled by battle components when cards are adjacent.
 */

import { cn } from "@/lib/utils";
import type { ArenaCardData, CardSide } from "../types";
import { SIDE_LEFT } from "../types";

export interface ArenaCardProps {
  /** Card data to display */
  card: ArenaCardData;
  /** Side of the arena (left/right) */
  side: CardSide;
  /** Whether card is currently moving */
  isMoving?: boolean;
  /** Whether card is in combat (adjacent to opponent) */
  isInCombat?: boolean;
}

/**
 * ArenaCard Component
 * Displays a simple card image within an arena cell.
 * Shows card position on the arena - combat is handled by battle components.
 */
export function ArenaCard({
  card,
  side,
  isMoving = false,
  isInCombat = false,
}: ArenaCardProps) {
  return (
    <div
      data-testid={`arena-card-${side}`}
      data-side={side}
      data-moving={isMoving}
      data-combat={isInCombat}
      className={cn(
        // Base styling
        "flex flex-col items-center justify-center rounded-md overflow-hidden",
        "w-14 h-14 bg-white border-2 shadow-sm",
        // Side-specific border colors
        side === SIDE_LEFT ? "border-blue-400" : "border-red-400",
        // Movement animation
        isMoving && "arena-card-moving",
        // Combat state - highlight when adjacent
        isInCombat && "ring-2 ring-orange-500"
      )}
    >
      {/* Card Image or Placeholder */}
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={card.name}
          data-testid="arena-card-image"
          className="w-full h-full object-cover"
        />
      ) : (
        <div
          data-testid="arena-card-placeholder"
          className={cn(
            "w-full h-full flex items-center justify-center",
            "text-[10px] font-semibold text-center p-1",
            side === SIDE_LEFT
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          )}
        >
          {card.name.slice(0, 6)}
        </div>
      )}
    </div>
  );
}

export default ArenaCard;
