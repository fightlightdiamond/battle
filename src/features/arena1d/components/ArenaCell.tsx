/**
 * ArenaCell Component - Individual cell in the 1D arena
 * Requirements: 1.2, 1.3, 2.3
 */

import { cn } from "@/lib/utils";
import type {
  CellIndex,
  CellHighlight,
  ArenaCardData,
  CardSide,
} from "../types";
import { isBoundaryCell } from "../types";

export interface ArenaCellProps {
  /** Index of the cell (0-7) */
  index: CellIndex;
  /** Card occupying this cell (if any) */
  card?: ArenaCardData | null;
  /** Card side if card is present */
  cardSide?: CardSide;
  /** Highlight state */
  highlight?: CellHighlight;
  /** Whether cell is in combat zone */
  isInCombat?: boolean;
  /** Children to render inside the cell (e.g., ArenaCard) */
  children?: React.ReactNode;
}

/**
 * Get highlight styling based on highlight state
 */
function getHighlightClass(highlight: CellHighlight): string {
  switch (highlight) {
    case "valid-move":
      return "ring-2 ring-blue-400 bg-blue-50";
    case "combat-zone":
      return "ring-2 ring-red-400 bg-red-50";
    case "none":
    default:
      return "";
  }
}

/**
 * ArenaCell Component
 * Displays a single cell in the 1D arena with support for:
 * - Boundary cell styling (index 0 and 7)
 * - Highlight states (none, valid-move, combat-zone)
 * - Cell index display
 */
export function ArenaCell({
  index,
  card = null,
  highlight = "none",
  isInCombat = false,
  children,
}: ArenaCellProps) {
  const isBoundary = isBoundaryCell(index);
  const highlightClass = getHighlightClass(highlight);
  const hasCard = card !== null || children !== undefined;

  return (
    <div
      data-testid={`arena-cell-${index}`}
      data-boundary={isBoundary}
      data-highlight={highlight}
      data-combat={isInCombat}
      className={cn(
        // Base cell styling
        "relative flex flex-col items-center justify-center",
        "flex-1 min-w-[60px] h-24 border-2 rounded-lg transition-all duration-200",
        // Default border and background
        "border-gray-300 bg-gray-50",
        // Boundary cell styling - more prominent
        isBoundary && "border-amber-500 bg-amber-50",
        // Highlight states
        highlightClass,
        // Combat state
        isInCombat && "ring-2 ring-red-500 bg-red-100",
        // Empty vs occupied styling
        !hasCard && "opacity-80"
      )}
    >
      {/* Cell index number */}
      <span
        data-testid={`cell-index-${index}`}
        className={cn(
          "absolute top-1 left-1 text-xs font-mono",
          isBoundary ? "text-amber-700 font-bold" : "text-gray-400"
        )}
      >
        {index}
      </span>

      {/* Card content area */}
      <div className="flex-1 flex items-center justify-center w-full">
        {children}
      </div>
    </div>
  );
}

export default ArenaCell;
