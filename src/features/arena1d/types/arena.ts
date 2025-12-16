/**
 * Arena 1D Battle System Types
 * Defines types for the 1D arena battle visualization
 */

// Cell Constants
export const CELL_COUNT = 8;
export const LEFT_BOUNDARY_INDEX = 0;
export const RIGHT_BOUNDARY_INDEX = 7;

/**
 * Type for cell index (0-7)
 */
export type CellIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * Arena battle phases
 */
export const PHASE_SETUP = "setup" as const;
export const PHASE_MOVING = "moving" as const;
export const PHASE_COMBAT = "combat" as const;
export const PHASE_FINISHED = "finished" as const;
export const ARENA_PHASES = [
  PHASE_SETUP,
  PHASE_MOVING,
  PHASE_COMBAT,
  PHASE_FINISHED,
] as const;
export type ArenaPhase = (typeof ARENA_PHASES)[number];

/**
 * Cell highlight states
 */
export const HIGHLIGHT_NONE = "none" as const;
export const HIGHLIGHT_VALID_MOVE = "valid-move" as const;
export const HIGHLIGHT_COMBAT_ZONE = "combat-zone" as const;
export const CELL_HIGHLIGHTS = [
  HIGHLIGHT_NONE,
  HIGHLIGHT_VALID_MOVE,
  HIGHLIGHT_COMBAT_ZONE,
] as const;
export type CellHighlight = (typeof CELL_HIGHLIGHTS)[number];

/**
 * Card side in arena (left or right)
 */
export const SIDE_LEFT = "left" as const;
export const SIDE_RIGHT = "right" as const;
export const CARD_SIDES = [SIDE_LEFT, SIDE_RIGHT] as const;
export type CardSide = (typeof CARD_SIDES)[number];

/**
 * Move direction for card animation
 */
export const DIRECTION_LEFT = "left" as const;
export const DIRECTION_RIGHT = "right" as const;
export const MOVE_DIRECTIONS = [DIRECTION_LEFT, DIRECTION_RIGHT] as const;
export type MoveDirection = (typeof MOVE_DIRECTIONS)[number];

/**
 * Adjacent distance for combat detection
 */
export const ADJACENT_DISTANCE = 1;

/**
 * Card data needed for arena display (simplified - only image)
 */
export interface ArenaCardData {
  id: string;
  name: string;
  imageUrl: string | null;
}

/**
 * Complete arena state
 */
export interface ArenaState {
  leftCard: ArenaCardData | null;
  rightCard: ArenaCardData | null;
  leftPosition: CellIndex;
  rightPosition: CellIndex;
  phase: ArenaPhase;
  turn: number;
}

/**
 * Check if a cell index is a boundary cell
 */
export function isBoundaryCell(index: CellIndex): boolean {
  return index === LEFT_BOUNDARY_INDEX || index === RIGHT_BOUNDARY_INDEX;
}

/**
 * Validate if a number is a valid CellIndex
 */
export function isValidCellIndex(value: number): value is CellIndex {
  return Number.isInteger(value) && value >= 0 && value <= 7;
}

/**
 * Check if two positions are adjacent (distance of 1)
 */
export function arePositionsAdjacent(
  pos1: CellIndex,
  pos2: CellIndex
): boolean {
  return Math.abs(pos1 - pos2) === ADJACENT_DISTANCE;
}
