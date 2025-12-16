/**
 * Arena1D Component - Main 1D arena battle visualization
 * Requirements: 1.1, 2.1, 2.2, 4.1, 4.2, 4.3
 *
 * Renders exactly 8 ArenaCell components with cards positioned
 * based on leftPosition and rightPosition props.
 * Handles movement animations and triggers onMoveComplete callback.
 */

import { cn } from "@/lib/utils";
import type {
  ArenaCardData,
  ArenaPhase,
  CellIndex,
  CellHighlight,
} from "../types";
import {
  CELL_COUNT,
  PHASE_COMBAT,
  HIGHLIGHT_NONE,
  HIGHLIGHT_COMBAT_ZONE,
  SIDE_LEFT,
  SIDE_RIGHT,
  arePositionsAdjacent,
} from "../types";
import { ArenaCell } from "./ArenaCell";
import { ArenaCard } from "./ArenaCard";

export interface Arena1DProps {
  /** Card at left side (starts at cell 0) */
  leftCard: ArenaCardData | null;
  /** Card at right side (starts at cell 7) */
  rightCard: ArenaCardData | null;
  /** Current position of left card (0-7) */
  leftPosition: CellIndex;
  /** Current position of right card (0-7) */
  rightPosition: CellIndex;
  /** Current arena phase */
  phase: ArenaPhase;
}

/**
 * Determine cell highlight based on phase and positions
 */
function getCellHighlight(
  cellIndex: CellIndex,
  leftPosition: CellIndex,
  rightPosition: CellIndex,
  phase: ArenaPhase
): CellHighlight {
  const isAdjacent = arePositionsAdjacent(leftPosition, rightPosition);

  // Combat zone highlight when cards are adjacent or in combat phase
  if (
    phase === PHASE_COMBAT ||
    (isAdjacent && (cellIndex === leftPosition || cellIndex === rightPosition))
  ) {
    if (cellIndex === leftPosition || cellIndex === rightPosition) {
      return HIGHLIGHT_COMBAT_ZONE;
    }
  }

  return HIGHLIGHT_NONE;
}

/**
 * Arena1D Component
 * Displays the complete 1D arena with 8 cells and positioned cards.
 * Handles movement animations and triggers onMoveComplete callback.
 */
export function Arena1D({
  leftCard,
  rightCard,
  leftPosition,
  rightPosition,
  phase,
}: Arena1DProps) {
  const isInCombat =
    phase === PHASE_COMBAT || arePositionsAdjacent(leftPosition, rightPosition);

  // Generate array of cell indices [0, 1, 2, 3, 4, 5, 6, 7]
  const cellIndices = Array.from(
    { length: CELL_COUNT },
    (_, i) => i as CellIndex
  );

  return (
    <div
      data-testid="arena-1d"
      data-phase={phase}
      className={cn(
        "flex flex-row gap-2 p-4 bg-slate-100 rounded-xl",
        "border-2 border-slate-300 shadow-inner",
        "w-full max-w-4xl" // Maximize width
      )}
    >
      {cellIndices.map((cellIndex) => {
        const hasLeftCard = leftCard && cellIndex === leftPosition;
        const hasRightCard = rightCard && cellIndex === rightPosition;
        const highlight = getCellHighlight(
          cellIndex,
          leftPosition,
          rightPosition,
          phase
        );
        const cellInCombat =
          isInCombat &&
          (!!hasLeftCard || !!hasRightCard) &&
          highlight === HIGHLIGHT_COMBAT_ZONE;

        return (
          <ArenaCell
            key={cellIndex}
            index={cellIndex}
            highlight={highlight}
            isInCombat={cellInCombat}
          >
            {hasLeftCard && (
              <ArenaCard
                card={leftCard}
                side={SIDE_LEFT}
                isInCombat={isInCombat}
              />
            )}
            {hasRightCard && (
              <ArenaCard
                card={rightCard}
                side={SIDE_RIGHT}
                isInCombat={isInCombat}
              />
            )}
          </ArenaCell>
        );
      })}
    </div>
  );
}

export default Arena1D;
