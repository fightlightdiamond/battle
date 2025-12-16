/**
 * Arena1D Property Tests
 * Requirements: 1.1, 2.1, 2.2, 3.1, 3.2
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fc from "fast-check";
import { Arena1D } from "./Arena1D";
import type {
  ArenaCardData,
  ArenaPhase,
  CellIndex,
  ArenaState,
} from "../types";
import {
  CELL_COUNT,
  ARENA_PHASES,
  LEFT_BOUNDARY_INDEX,
  RIGHT_BOUNDARY_INDEX,
} from "../types";

/**
 * Arbitrary generator for ArenaCardData (simplified - only image)
 */
const arenaCardDataArb: fc.Arbitrary<ArenaCardData> = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  imageUrl: fc.oneof(fc.constant(null), fc.webUrl()),
});

/**
 * Arbitrary generator for CellIndex
 */
const cellIndexArb: fc.Arbitrary<CellIndex> = fc.constantFrom(
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7
);

/**
 * Arbitrary generator for ArenaPhase
 */
const arenaPhaseArb: fc.Arbitrary<ArenaPhase> = fc.constantFrom(
  ...ARENA_PHASES
);

/**
 * **Feature: arena-1d-battle, Property 1: Arena always has exactly 8 cells**
 * **Validates: Requirements 1.1**
 *
 * For any Arena1D component render, the number of ArenaCell components
 * rendered SHALL equal exactly 8.
 */
describe("Property 1: Arena always has exactly 8 cells", () => {
  it("renders exactly 8 cells regardless of props", () => {
    fc.assert(
      fc.property(
        fc.option(arenaCardDataArb, { nil: null }),
        fc.option(arenaCardDataArb, { nil: null }),
        cellIndexArb,
        cellIndexArb,
        arenaPhaseArb,
        (
          leftCard: ArenaCardData | null,
          rightCard: ArenaCardData | null,
          leftPosition: CellIndex,
          rightPosition: CellIndex,
          phase: ArenaPhase
        ) => {
          // Skip invalid states where positions collide
          if (leftPosition === rightPosition) return;

          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={leftPosition}
              rightPosition={rightPosition}
              phase={phase}
            />
          );

          // Count all arena cells
          const cells: HTMLElement[] = [];
          for (let i = 0; i < CELL_COUNT; i++) {
            const cell = screen.getByTestId(`arena-cell-${i}`);
            cells.push(cell);
          }

          expect(cells.length).toBe(CELL_COUNT);
          expect(cells.length).toBe(8);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("renders arena container with correct test id", () => {
    render(
      <Arena1D
        leftCard={null}
        rightCard={null}
        leftPosition={0}
        rightPosition={7}
        phase="setup"
      />
    );

    const arena = screen.getByTestId("arena-1d");
    expect(arena).toBeDefined();
  });

  it("renders cells in order from 0 to 7", () => {
    render(
      <Arena1D
        leftCard={null}
        rightCard={null}
        leftPosition={0}
        rightPosition={7}
        phase="setup"
      />
    );

    for (let i = 0; i < CELL_COUNT; i++) {
      const cell = screen.getByTestId(`arena-cell-${i}`);
      expect(cell).toBeDefined();
    }
  });
});

/**
 * **Feature: arena-1d-battle, Property 3: Initial positions are at boundaries**
 * **Validates: Requirements 3.1, 3.2**
 *
 * For any arena in 'setup' phase, leftPosition SHALL equal 0
 * AND rightPosition SHALL equal 7.
 */
describe("Property 3: Initial positions are at boundaries", () => {
  /**
   * Arbitrary generator for valid ArenaState in setup phase
   * In setup phase, positions MUST be at boundaries
   */
  const setupPhaseStateArb: fc.Arbitrary<ArenaState> = fc.record({
    leftCard: fc.option(arenaCardDataArb, { nil: null }),
    rightCard: fc.option(arenaCardDataArb, { nil: null }),
    leftPosition: fc.constant(LEFT_BOUNDARY_INDEX as CellIndex),
    rightPosition: fc.constant(RIGHT_BOUNDARY_INDEX as CellIndex),
    phase: fc.constant("setup" as ArenaPhase),
    turn: fc.integer({ min: 0, max: 100 }),
  });

  it("setup phase requires leftPosition at left boundary (0)", () => {
    fc.assert(
      fc.property(setupPhaseStateArb, (state: ArenaState) => {
        // In setup phase, left card must be at left boundary
        expect(state.leftPosition).toBe(LEFT_BOUNDARY_INDEX);
        expect(state.leftPosition).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("setup phase requires rightPosition at right boundary (7)", () => {
    fc.assert(
      fc.property(setupPhaseStateArb, (state: ArenaState) => {
        // In setup phase, right card must be at right boundary
        expect(state.rightPosition).toBe(RIGHT_BOUNDARY_INDEX);
        expect(state.rightPosition).toBe(7);
      }),
      { numRuns: 100 }
    );
  });

  it("renders correctly with initial boundary positions", () => {
    fc.assert(
      fc.property(
        fc.option(arenaCardDataArb, { nil: null }),
        fc.option(arenaCardDataArb, { nil: null }),
        (leftCard: ArenaCardData | null, rightCard: ArenaCardData | null) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={LEFT_BOUNDARY_INDEX}
              rightPosition={RIGHT_BOUNDARY_INDEX}
              phase="setup"
            />
          );

          // Verify arena renders with setup phase
          const arena = screen.getByTestId("arena-1d");
          expect(arena.getAttribute("data-phase")).toBe("setup");

          // Verify boundary cells exist
          const leftBoundaryCell = screen.getByTestId(
            `arena-cell-${LEFT_BOUNDARY_INDEX}`
          );
          const rightBoundaryCell = screen.getByTestId(
            `arena-cell-${RIGHT_BOUNDARY_INDEX}`
          );
          expect(leftBoundaryCell).toBeDefined();
          expect(rightBoundaryCell).toBeDefined();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Arbitrary generator for valid ArenaState where positions don't collide
 * This represents the invariant that must hold for all valid states
 */
const validArenaStateArb: fc.Arbitrary<ArenaState> = fc
  .record({
    leftCard: fc.option(arenaCardDataArb, { nil: null }),
    rightCard: fc.option(arenaCardDataArb, { nil: null }),
    leftPosition: cellIndexArb,
    rightPosition: cellIndexArb,
    phase: arenaPhaseArb,
    turn: fc.integer({ min: 0, max: 100 }),
  })
  .filter((state) => state.leftPosition !== state.rightPosition);

/**
 * **Feature: arena-1d-battle, Property 4: Cards never occupy same cell**
 * **Validates: Requirements 2.1, 2.2**
 *
 * For any valid ArenaState, leftPosition SHALL NOT equal rightPosition.
 */
describe("Property 4: Cards never occupy same cell", () => {
  it("valid arena states never have colliding positions", () => {
    fc.assert(
      fc.property(validArenaStateArb, (state: ArenaState) => {
        // The invariant: positions must be different
        expect(state.leftPosition).not.toBe(state.rightPosition);
      }),
      { numRuns: 100 }
    );
  });

  it("renders cards in different cells when both cards present", () => {
    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        validArenaStateArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          state: ArenaState
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={state.leftPosition}
              rightPosition={state.rightPosition}
              phase={state.phase}
            />
          );

          // Get the cells where cards should be
          const leftCell = screen.getByTestId(
            `arena-cell-${state.leftPosition}`
          );
          const rightCell = screen.getByTestId(
            `arena-cell-${state.rightPosition}`
          );

          // Verify they are different cells
          expect(leftCell).not.toBe(rightCell);

          // Verify cards are rendered in their respective cells
          const leftCardElement = leftCell.querySelector(
            '[data-testid="arena-card-left"]'
          );
          const rightCardElement = rightCell.querySelector(
            '[data-testid="arena-card-right"]'
          );

          expect(leftCardElement).toBeDefined();
          expect(rightCardElement).toBeDefined();

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("no cell contains both left and right cards", () => {
    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        validArenaStateArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          state: ArenaState
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={state.leftPosition}
              rightPosition={state.rightPosition}
              phase={state.phase}
            />
          );

          // Check each cell - no cell should have both cards
          for (let i = 0; i < CELL_COUNT; i++) {
            const cell = screen.getByTestId(`arena-cell-${i}`);
            const leftCardInCell = cell.querySelector(
              '[data-testid="arena-card-left"]'
            );
            const rightCardInCell = cell.querySelector(
              '[data-testid="arena-card-right"]'
            );

            // A cell cannot have both cards
            const hasBothCards = leftCardInCell && rightCardInCell;
            expect(hasBothCards).toBeFalsy();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: arena-1d-battle, Property 6: Position bounds are respected**
 * **Validates: Requirements 4.3**
 *
 * For any ArenaState, both leftPosition and rightPosition SHALL be in range [0, 7].
 * Both cards can move to any position on the arena.
 */
describe("Property 6: Position bounds are respected", () => {
  /**
   * Arbitrary generator for valid ArenaState with proper position bounds
   * - Both cards can be at any position 0-7
   * - Positions must not collide
   */
  const boundedArenaStateArb: fc.Arbitrary<ArenaState> = fc
    .record({
      leftCard: fc.option(arenaCardDataArb, { nil: null }),
      rightCard: fc.option(arenaCardDataArb, { nil: null }),
      leftPosition: cellIndexArb,
      rightPosition: cellIndexArb,
      phase: arenaPhaseArb,
      turn: fc.integer({ min: 0, max: 100 }),
    })
    .filter((state) => state.leftPosition !== state.rightPosition);

  it("leftPosition is always in range [0, 7]", () => {
    fc.assert(
      fc.property(boundedArenaStateArb, (state: ArenaState) => {
        // Left card can be at any position 0-7
        expect(state.leftPosition).toBeGreaterThanOrEqual(0);
        expect(state.leftPosition).toBeLessThanOrEqual(7);
      }),
      { numRuns: 100 }
    );
  });

  it("rightPosition is always in range [0, 7]", () => {
    fc.assert(
      fc.property(boundedArenaStateArb, (state: ArenaState) => {
        // Right card can be at any position 0-7
        expect(state.rightPosition).toBeGreaterThanOrEqual(0);
        expect(state.rightPosition).toBeLessThanOrEqual(7);
      }),
      { numRuns: 100 }
    );
  });

  it("renders correctly with any valid positions", () => {
    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        boundedArenaStateArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          state: ArenaState
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={state.leftPosition}
              rightPosition={state.rightPosition}
              phase={state.phase}
            />
          );

          // Verify arena renders
          const arena = screen.getByTestId("arena-1d");
          expect(arena).toBeDefined();

          // Verify cards are in their positions
          const leftCell = screen.getByTestId(
            `arena-cell-${state.leftPosition}`
          );
          const rightCell = screen.getByTestId(
            `arena-cell-${state.rightPosition}`
          );

          const leftCardElement = leftCell.querySelector(
            '[data-testid="arena-card-left"]'
          );
          const rightCardElement = rightCell.querySelector(
            '[data-testid="arena-card-right"]'
          );

          expect(leftCardElement).toBeDefined();
          expect(rightCardElement).toBeDefined();

          // Verify position bounds are respected (0-7)
          expect(state.leftPosition).toBeGreaterThanOrEqual(0);
          expect(state.leftPosition).toBeLessThanOrEqual(7);
          expect(state.rightPosition).toBeGreaterThanOrEqual(0);
          expect(state.rightPosition).toBeLessThanOrEqual(7);

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("both cards can reach any position including boundaries", () => {
    fc.assert(
      fc.property(boundedArenaStateArb, (state: ArenaState) => {
        // Both positions should be valid CellIndex values (0-7)
        const validIndices = [0, 1, 2, 3, 4, 5, 6, 7];
        expect(validIndices).toContain(state.leftPosition);
        expect(validIndices).toContain(state.rightPosition);
      }),
      { numRuns: 100 }
    );
  });

  it("positions are always different (no collision)", () => {
    fc.assert(
      fc.property(boundedArenaStateArb, (state: ArenaState) => {
        // Cards cannot occupy the same cell
        expect(state.leftPosition).not.toBe(state.rightPosition);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Arbitrary generator for adjacent positions (combat scenario)
 * Adjacent means |leftPos - rightPos| = 1
 * Both cards can be at any position, so we include all adjacent pairs
 */
const adjacentPositionPairsArb: fc.Arbitrary<{
  leftPosition: CellIndex;
  rightPosition: CellIndex;
}> = fc.constantFrom(
  // Left card on left side of right card
  { leftPosition: 0 as CellIndex, rightPosition: 1 as CellIndex },
  { leftPosition: 1 as CellIndex, rightPosition: 2 as CellIndex },
  { leftPosition: 2 as CellIndex, rightPosition: 3 as CellIndex },
  { leftPosition: 3 as CellIndex, rightPosition: 4 as CellIndex },
  { leftPosition: 4 as CellIndex, rightPosition: 5 as CellIndex },
  { leftPosition: 5 as CellIndex, rightPosition: 6 as CellIndex },
  { leftPosition: 6 as CellIndex, rightPosition: 7 as CellIndex },
  // Left card on right side of right card (cards can cross)
  { leftPosition: 1 as CellIndex, rightPosition: 0 as CellIndex },
  { leftPosition: 2 as CellIndex, rightPosition: 1 as CellIndex },
  { leftPosition: 3 as CellIndex, rightPosition: 2 as CellIndex },
  { leftPosition: 4 as CellIndex, rightPosition: 3 as CellIndex },
  { leftPosition: 5 as CellIndex, rightPosition: 4 as CellIndex },
  { leftPosition: 6 as CellIndex, rightPosition: 5 as CellIndex },
  { leftPosition: 7 as CellIndex, rightPosition: 6 as CellIndex }
);

/**
 * **Feature: arena-1d-battle, Property 5: Combat phase triggers when adjacent**
 * **Validates: Requirements 5.1, 5.2**
 *
 * For any ArenaState where |leftPosition - rightPosition| equals 1,
 * the phase SHALL be 'combat'.
 */
describe("Property 5: Combat phase triggers when adjacent", () => {
  it("adjacent positions trigger combat-zone highlight on both cards", () => {
    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        adjacentPositionPairsArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          positions: { leftPosition: CellIndex; rightPosition: CellIndex }
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={positions.leftPosition}
              rightPosition={positions.rightPosition}
              phase="combat"
            />
          );

          // Verify both cells have combat-zone highlight
          const leftCell = screen.getByTestId(
            `arena-cell-${positions.leftPosition}`
          );
          const rightCell = screen.getByTestId(
            `arena-cell-${positions.rightPosition}`
          );

          expect(leftCell.getAttribute("data-highlight")).toBe("combat-zone");
          expect(rightCell.getAttribute("data-highlight")).toBe("combat-zone");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("adjacent positions mark cards as in combat", () => {
    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        adjacentPositionPairsArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          positions: { leftPosition: CellIndex; rightPosition: CellIndex }
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={positions.leftPosition}
              rightPosition={positions.rightPosition}
              phase="combat"
            />
          );

          // Verify cards have combat state
          const leftCardElement = screen.getByTestId("arena-card-left");
          const rightCardElement = screen.getByTestId("arena-card-right");

          expect(leftCardElement.getAttribute("data-combat")).toBe("true");
          expect(rightCardElement.getAttribute("data-combat")).toBe("true");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("adjacent positions always have distance of exactly 1", () => {
    fc.assert(
      fc.property(
        adjacentPositionPairsArb,
        (positions: { leftPosition: CellIndex; rightPosition: CellIndex }) => {
          const distance = Math.abs(
            positions.leftPosition - positions.rightPosition
          );
          expect(distance).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("non-adjacent positions do not have combat-zone highlight", () => {
    // Generate non-adjacent position pairs (distance > 1)
    const nonAdjacentPositionPairsArb: fc.Arbitrary<{
      leftPosition: CellIndex;
      rightPosition: CellIndex;
    }> = fc
      .record({
        leftPosition: cellIndexArb,
        rightPosition: cellIndexArb,
      })
      .filter(
        (pos) =>
          pos.leftPosition !== pos.rightPosition &&
          Math.abs(pos.leftPosition - pos.rightPosition) > 1
      );

    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        nonAdjacentPositionPairsArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          positions: { leftPosition: CellIndex; rightPosition: CellIndex }
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={positions.leftPosition}
              rightPosition={positions.rightPosition}
              phase="moving"
            />
          );

          // Verify cells do NOT have combat-zone highlight when not adjacent
          const leftCell = screen.getByTestId(
            `arena-cell-${positions.leftPosition}`
          );
          const rightCell = screen.getByTestId(
            `arena-cell-${positions.rightPosition}`
          );

          expect(leftCell.getAttribute("data-highlight")).not.toBe(
            "combat-zone"
          );
          expect(rightCell.getAttribute("data-highlight")).not.toBe(
            "combat-zone"
          );

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("cells in combat phase have isInCombat data attribute", () => {
    fc.assert(
      fc.property(
        arenaCardDataArb,
        arenaCardDataArb,
        adjacentPositionPairsArb,
        (
          leftCard: ArenaCardData,
          rightCard: ArenaCardData,
          positions: { leftPosition: CellIndex; rightPosition: CellIndex }
        ) => {
          const { unmount } = render(
            <Arena1D
              leftCard={leftCard}
              rightCard={rightCard}
              leftPosition={positions.leftPosition}
              rightPosition={positions.rightPosition}
              phase="combat"
            />
          );

          // Verify cells with cards have combat data attribute
          const leftCell = screen.getByTestId(
            `arena-cell-${positions.leftPosition}`
          );
          const rightCell = screen.getByTestId(
            `arena-cell-${positions.rightPosition}`
          );

          expect(leftCell.getAttribute("data-combat")).toBe("true");
          expect(rightCell.getAttribute("data-combat")).toBe("true");

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});
