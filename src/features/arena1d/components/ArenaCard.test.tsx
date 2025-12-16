/**
 * ArenaCard Property Tests
 * **Feature: arena-1d-battle, Property: Card display shows image**
 * **Validates: Requirements 2.4**
 *
 * For any ArenaCardData, rendered output shows card image or placeholder
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fc from "fast-check";
import { ArenaCard } from "./ArenaCard";
import type { ArenaCardData, CardSide } from "../types";

/**
 * Arbitrary generator for ArenaCardData (simplified - only image)
 */
const arenaCardDataArb = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  imageUrl: fc.oneof(fc.constant(null), fc.webUrl()),
});

/**
 * Arbitrary generator for CardSide
 */
const cardSideArb: fc.Arbitrary<CardSide> = fc.constantFrom("left", "right");

describe("ArenaCard Property Tests", () => {
  /**
   * **Feature: arena-1d-battle, Property: Card display shows image**
   * **Validates: Requirements 2.4**
   */
  describe("Property: Card display shows image or placeholder", () => {
    it("for any ArenaCardData with imageUrl, rendered output shows image", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            imageUrl: fc.webUrl(),
          }),
          cardSideArb,
          (card: ArenaCardData, side: CardSide) => {
            const { unmount } = render(<ArenaCard card={card} side={side} />);

            // Verify image is displayed
            const imageElement = screen.getByTestId("arena-card-image");
            expect(imageElement).toBeDefined();
            expect(imageElement.getAttribute("src")).toBe(card.imageUrl);
            expect(imageElement.getAttribute("alt")).toBe(card.name);

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("for any ArenaCardData without imageUrl, rendered output shows placeholder with name", () => {
      fc.assert(
        fc.property(
          fc.record({
            id: fc.uuid(),
            name: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            imageUrl: fc.constant(null),
          }),
          cardSideArb,
          (card: ArenaCardData, side: CardSide) => {
            const { unmount } = render(<ArenaCard card={card} side={side} />);

            // Verify placeholder is displayed with truncated name
            const placeholderElement = screen.getByTestId(
              "arena-card-placeholder"
            );
            expect(placeholderElement).toBeDefined();
            expect(placeholderElement.textContent).toBe(card.name.slice(0, 6));

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe("Side styling", () => {
    it("for any ArenaCardData, left side has blue styling", () => {
      fc.assert(
        fc.property(arenaCardDataArb, (card: ArenaCardData) => {
          const { unmount } = render(<ArenaCard card={card} side="left" />);

          const cardElement = screen.getByTestId("arena-card-left");
          expect(cardElement.getAttribute("data-side")).toBe("left");
          expect(cardElement.className).toContain("border-blue");

          unmount();
        }),
        { numRuns: 50 }
      );
    });

    it("for any ArenaCardData, right side has red styling", () => {
      fc.assert(
        fc.property(arenaCardDataArb, (card: ArenaCardData) => {
          const { unmount } = render(<ArenaCard card={card} side="right" />);

          const cardElement = screen.getByTestId("arena-card-right");
          expect(cardElement.getAttribute("data-side")).toBe("right");
          expect(cardElement.className).toContain("border-red");

          unmount();
        }),
        { numRuns: 50 }
      );
    });
  });

  describe("State styling", () => {
    it("for any ArenaCardData, moving state applies movement animation class", () => {
      fc.assert(
        fc.property(
          arenaCardDataArb,
          cardSideArb,
          (card: ArenaCardData, side: CardSide) => {
            const { unmount } = render(
              <ArenaCard card={card} side={side} isMoving={true} />
            );

            const cardElement = screen.getByTestId(`arena-card-${side}`);
            expect(cardElement.getAttribute("data-moving")).toBe("true");
            expect(cardElement.className).toContain("arena-card-moving");

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it("for any ArenaCardData, non-moving state does NOT apply movement animation class", () => {
      fc.assert(
        fc.property(
          arenaCardDataArb,
          cardSideArb,
          (card: ArenaCardData, side: CardSide) => {
            const { unmount } = render(
              <ArenaCard card={card} side={side} isMoving={false} />
            );

            const cardElement = screen.getByTestId(`arena-card-${side}`);
            expect(cardElement.getAttribute("data-moving")).toBe("false");
            expect(cardElement.className).not.toContain("arena-card-moving");

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });

    it("for any ArenaCardData, combat state applies combat styling", () => {
      fc.assert(
        fc.property(
          arenaCardDataArb,
          cardSideArb,
          (card: ArenaCardData, side: CardSide) => {
            const { unmount } = render(
              <ArenaCard card={card} side={side} isInCombat={true} />
            );

            const cardElement = screen.getByTestId(`arena-card-${side}`);
            expect(cardElement.getAttribute("data-combat")).toBe("true");
            expect(cardElement.className).toContain("ring-2");
            expect(cardElement.className).toContain("ring-orange");

            unmount();
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
