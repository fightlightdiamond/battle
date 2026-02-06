// ============================================================================
// POSITION UTILITIES
// ============================================================================

import type { CellIndex } from "@/features/arena1d/types/arena";

export const MIN_POSITION = 0;
export const MAX_POSITION = 7;

/**
 * Clamp a position to valid arena bounds [0, 7]
 */
export function clampPosition(position: number): CellIndex {
  return Math.max(MIN_POSITION, Math.min(MAX_POSITION, position)) as CellIndex;
}

/**
 * Get the direction sign from one position to another
 * @returns 1 if target is to the right, -1 if to the left, 0 if same position
 */
export function getDirectionSign(from: number, to: number): number {
  if (to > from) return 1;
  if (to < from) return -1;
  return 0;
}

/**
 * Check if a position is at the arena edge
 */
export function isAtEdge(position: number): boolean {
  return position === MIN_POSITION || position === MAX_POSITION;
}
