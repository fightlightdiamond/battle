/**
 * Arena 1D Battle System Types
 * Defines types for the 1D arena battle visualization
 */

// Constants
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
export const ARENA_PHASES = ["setup", "moving", "combat", "finished"] as const;
export type ArenaPhase = (typeof ARENA_PHASES)[number];

/**
 * Cell highlight states
 */
export const CELL_HIGHLIGHTS = ["none", "valid-move", "combat-zone"] as const;
export type CellHighlight = (typeof CELL_HIGHLIGHTS)[number];

/**
 * Card data needed for arena display
 */
export interface ArenaCardData {
  id: string;
  name: string;
  imageUrl: string | null;
  currentHp: number;
  maxHp: number;
  atk: number;
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
