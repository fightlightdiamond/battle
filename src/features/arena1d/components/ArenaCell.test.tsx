/**
 * ArenaCell Unit Tests
 * Requirements: 1.2, 1.3
 *
 * Tests for:
 * - Boundary cell styling (index 0 and 7)
 * - Highlight states (none, valid-move, combat-zone)
 * - Cell index display
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ArenaCell } from "./ArenaCell";
import type { CellIndex, CellHighlight } from "../types";

describe("ArenaCell", () => {
  describe("Cell index display", () => {
    it("displays the cell index number", () => {
      const testIndices: CellIndex[] = [0, 1, 2, 3, 4, 5, 6, 7];

      for (const index of testIndices) {
        const { unmount } = render(<ArenaCell index={index} />);

        const indexElement = screen.getByTestId(`cell-index-${index}`);
        expect(indexElement).toBeDefined();
        expect(indexElement.textContent).toBe(String(index));

        unmount();
      }
    });

    it("renders cell with correct test id", () => {
      render(<ArenaCell index={3} />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell).toBeDefined();
    });
  });

  describe("Boundary cell styling", () => {
    it("marks boundary cells (0 and 7) with data-boundary=true", () => {
      const boundaryIndices: CellIndex[] = [0, 7];

      for (const index of boundaryIndices) {
        const { unmount } = render(<ArenaCell index={index} />);

        const cell = screen.getByTestId(`arena-cell-${index}`);
        expect(cell.getAttribute("data-boundary")).toBe("true");

        unmount();
      }
    });

    it("marks middle cells (1-6) with data-boundary=false", () => {
      const middleIndices: CellIndex[] = [1, 2, 3, 4, 5, 6];

      for (const index of middleIndices) {
        const { unmount } = render(<ArenaCell index={index} />);

        const cell = screen.getByTestId(`arena-cell-${index}`);
        expect(cell.getAttribute("data-boundary")).toBe("false");

        unmount();
      }
    });

    it("applies amber styling to boundary cells", () => {
      render(<ArenaCell index={0} />);

      const cell = screen.getByTestId("arena-cell-0");
      expect(cell.className).toContain("border-amber");
      expect(cell.className).toContain("bg-amber");
    });

    it("applies gray styling to middle cells", () => {
      render(<ArenaCell index={3} />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.className).toContain("border-gray");
      expect(cell.className).toContain("bg-gray");
    });
  });

  describe("Highlight states", () => {
    const highlightStates: CellHighlight[] = [
      "none",
      "valid-move",
      "combat-zone",
    ];

    it("sets data-highlight attribute correctly for each state", () => {
      for (const highlight of highlightStates) {
        const { unmount } = render(
          <ArenaCell index={3} highlight={highlight} />
        );

        const cell = screen.getByTestId("arena-cell-3");
        expect(cell.getAttribute("data-highlight")).toBe(highlight);

        unmount();
      }
    });

    it("applies blue styling for valid-move highlight", () => {
      render(<ArenaCell index={3} highlight="valid-move" />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.className).toContain("ring-blue");
      expect(cell.className).toContain("bg-blue");
    });

    it("applies red styling for combat-zone highlight", () => {
      render(<ArenaCell index={3} highlight="combat-zone" />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.className).toContain("ring-red");
      expect(cell.className).toContain("bg-red");
    });

    it("defaults to no highlight when not specified", () => {
      render(<ArenaCell index={3} />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.getAttribute("data-highlight")).toBe("none");
    });
  });

  describe("Combat state", () => {
    it("sets data-combat attribute when in combat", () => {
      render(<ArenaCell index={3} isInCombat={true} />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.getAttribute("data-combat")).toBe("true");
    });

    it("applies combat styling when isInCombat is true", () => {
      render(<ArenaCell index={3} isInCombat={true} />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.className).toContain("ring-red-500");
      expect(cell.className).toContain("bg-red-100");
    });

    it("defaults to not in combat when not specified", () => {
      render(<ArenaCell index={3} />);

      const cell = screen.getByTestId("arena-cell-3");
      expect(cell.getAttribute("data-combat")).toBe("false");
    });
  });

  describe("Children rendering", () => {
    it("renders children inside the cell", () => {
      render(
        <ArenaCell index={3}>
          <span data-testid="child-content">Card Content</span>
        </ArenaCell>
      );

      const childContent = screen.getByTestId("child-content");
      expect(childContent).toBeDefined();
      expect(childContent.textContent).toBe("Card Content");
    });
  });
});
