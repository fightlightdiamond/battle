import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  CELL_COUNT,
  LEFT_BOUNDARY_INDEX,
  RIGHT_BOUNDARY_INDEX,
  isBoundaryCell,
  isValidCellIndex,
  type CellIndex,
} from "./arena";

/**
 * **Feature: arena-1d-battle, Property 2: Boundary cells are correctly identified**
 * **Validates: Requirements 1.2**
 *
 * For any CellIndex value, cells at index 0 and 7 SHALL be marked as boundary cells,
 * and cells at index 1-6 SHALL NOT be marked as boundary cells.
 */
describe("Property 2: Boundary cells are correctly identified", () => {
  // All valid cell indices
  const allCellIndices: CellIndex[] = [0, 1, 2, 3, 4, 5, 6, 7];
  const boundaryIndices: CellIndex[] = [0, 7];
  const middleIndices: CellIndex[] = [1, 2, 3, 4, 5, 6];

  it("constants are correctly defined", () => {
    expect(CELL_COUNT).toBe(8);
    expect(LEFT_BOUNDARY_INDEX).toBe(0);
    expect(RIGHT_BOUNDARY_INDEX).toBe(7);
  });

  it("boundary cells (0 and 7) are identified as boundary", () => {
    for (const index of boundaryIndices) {
      expect(isBoundaryCell(index)).toBe(true);
    }
  });

  it("middle cells (1-6) are NOT identified as boundary", () => {
    for (const index of middleIndices) {
      expect(isBoundaryCell(index)).toBe(false);
    }
  });

  it("property: for any valid CellIndex, boundary identification is correct", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allCellIndices), (index: CellIndex) => {
        const isBoundary = isBoundaryCell(index);
        const shouldBeBoundary =
          index === LEFT_BOUNDARY_INDEX || index === RIGHT_BOUNDARY_INDEX;

        expect(isBoundary).toBe(shouldBeBoundary);
      }),
      { numRuns: 100 }
    );
  });

  it("property: exactly 2 cells are boundary cells out of 8", () => {
    const boundaryCount = allCellIndices.filter((i) =>
      isBoundaryCell(i)
    ).length;
    expect(boundaryCount).toBe(2);
  });

  it("property: boundary cells are at opposite ends of the arena", () => {
    // Left boundary is at index 0 (minimum)
    expect(LEFT_BOUNDARY_INDEX).toBe(0);
    // Right boundary is at index 7 (maximum = CELL_COUNT - 1)
    expect(RIGHT_BOUNDARY_INDEX).toBe(CELL_COUNT - 1);
    // They are at opposite ends
    expect(RIGHT_BOUNDARY_INDEX - LEFT_BOUNDARY_INDEX).toBe(CELL_COUNT - 1);
  });
});

/**
 * CellIndex validation tests
 */
describe("CellIndex validation", () => {
  it("valid indices (0-7) pass validation", () => {
    for (let i = 0; i <= 7; i++) {
      expect(isValidCellIndex(i)).toBe(true);
    }
  });

  it("invalid indices fail validation", () => {
    expect(isValidCellIndex(-1)).toBe(false);
    expect(isValidCellIndex(8)).toBe(false);
    expect(isValidCellIndex(100)).toBe(false);
    expect(isValidCellIndex(-100)).toBe(false);
  });

  it("non-integer values fail validation", () => {
    expect(isValidCellIndex(0.5)).toBe(false);
    expect(isValidCellIndex(3.14)).toBe(false);
    expect(isValidCellIndex(NaN)).toBe(false);
    expect(isValidCellIndex(Infinity)).toBe(false);
  });

  it("property: for any integer in range [0,7], isValidCellIndex returns true", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 7 }), (value: number) => {
        expect(isValidCellIndex(value)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("property: for any integer outside range [0,7], isValidCellIndex returns false", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.integer({ min: -1000, max: -1 }),
          fc.integer({ min: 8, max: 1000 })
        ),
        (value: number) => {
          expect(isValidCellIndex(value)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
