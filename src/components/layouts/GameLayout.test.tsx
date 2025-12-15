/**
 * GameLayout Property-Based Tests
 *
 * **Feature: layout-standardization, Property 1: GameLayout header consistency**
 * **Validates: Requirements 1.4**
 *
 * Tests that GameLayout consistently renders header elements (back button and title)
 * for any valid combination of props.
 *
 * **Feature: ui-status-bar, StatusBar integration**
 * **Validates: Requirements 4.2**
 *
 * Tests that StatusBar integrates correctly with GameLayout.
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as fc from "fast-check";
import { GameLayout } from "./GameLayout";

// Arbitrary for generating valid route paths (e.g., /battle/setup, /history)
const routePathArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => /^[a-z0-9-]+$/.test(s) && s.length > 0)
  .map((s) => `/${s}`);

// Arbitrary for generating non-empty title strings
const titleArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => s.trim().length > 0 && /^[a-zA-Z0-9 ]+$/.test(s));

// Arbitrary for generating back button labels
const backLabelArb: fc.Arbitrary<string> = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length > 0 && /^[a-zA-Z ]+$/.test(s));

// Helper to render GameLayout with MemoryRouter
const renderGameLayout = (props: {
  title?: string;
  backTo?: string;
  backLabel?: string;
}) => {
  return render(
    <MemoryRouter>
      <GameLayout {...props}>
        <div data-testid="content">Content</div>
      </GameLayout>
    </MemoryRouter>
  );
};

describe("GameLayout", () => {
  describe("Property 1: GameLayout header consistency", () => {
    /**
     * **Feature: layout-standardization, Property 1: GameLayout header consistency**
     * **Validates: Requirements 1.4**
     *
     * For any page using GameLayout with backTo and title props provided,
     * the rendered output should contain a header with back button linking
     * to backTo and displaying the title text.
     */
    it("renders header with back link and title for any valid props", () => {
      fc.assert(
        fc.property(
          titleArb,
          routePathArb,
          backLabelArb,
          (title: string, backTo: string, backLabel: string) => {
            const { unmount } = renderGameLayout({ title, backTo, backLabel });

            // Assert title is rendered
            const titleElement = screen.getByRole("heading", { level: 1 });
            expect(titleElement).toBeDefined();
            expect(titleElement.textContent).toBe(title);

            // Assert back link is rendered with correct href
            const backLink = screen.getByRole("link");
            expect(backLink).toBeDefined();
            expect(backLink.getAttribute("href")).toBe(backTo);

            // Assert back label is rendered
            expect(backLink.textContent).toContain(backLabel);

            // Cleanup for next iteration
            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("renders title without back button when only title is provided", () => {
      fc.assert(
        fc.property(titleArb, (title: string) => {
          const { unmount } = renderGameLayout({ title });

          // Assert title is rendered
          const titleElement = screen.getByRole("heading", { level: 1 });
          expect(titleElement).toBeDefined();
          expect(titleElement.textContent).toBe(title);

          // Assert no back link is rendered
          const backLinks = screen.queryAllByRole("link");
          expect(backLinks.length).toBe(0);

          // Cleanup for next iteration
          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it("renders back button with default label when backLabel is not provided", () => {
      fc.assert(
        fc.property(routePathArb, (backTo: string) => {
          const { unmount } = renderGameLayout({ backTo });

          // Assert back link is rendered with correct href
          const backLink = screen.getByRole("link");
          expect(backLink).toBeDefined();
          expect(backLink.getAttribute("href")).toBe(backTo);

          // Assert default back label "Back" is used
          expect(backLink.textContent).toContain("Back");

          // Cleanup for next iteration
          unmount();
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * StatusBar Integration Tests
   * **Feature: ui-status-bar, StatusBar integration**
   * **Validates: Requirements 4.2**
   */
  describe("StatusBar integration", () => {
    // Helper to render GameLayout at a specific route
    const renderGameLayoutAtRoute = (pathname: string) => {
      return render(
        <MemoryRouter initialEntries={[pathname]}>
          <GameLayout>
            <div data-testid="content">Content</div>
          </GameLayout>
        </MemoryRouter>
      );
    };

    it("should render StatusBar on non-arena routes", () => {
      const { unmount } = renderGameLayoutAtRoute("/battle/setup");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).not.toBeNull();

      unmount();
    });

    it("should hide StatusBar on battle arena route", () => {
      const { unmount } = renderGameLayoutAtRoute("/battle/arena");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).toBeNull();

      unmount();
    });

    it("should hide StatusBar on bet battle arena route", () => {
      const { unmount } = renderGameLayoutAtRoute("/bet-battle/arena");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).toBeNull();

      unmount();
    });

    it("should hide StatusBar on replay routes", () => {
      const { unmount } = renderGameLayoutAtRoute("/history/123/replay");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).toBeNull();

      unmount();
    });

    it("should render content alongside StatusBar", () => {
      const { unmount } = renderGameLayoutAtRoute("/battle/setup");

      const statusBar = screen.queryByTestId("status-bar");
      const content = screen.queryByTestId("content");

      expect(statusBar).not.toBeNull();
      expect(content).not.toBeNull();

      unmount();
    });
  });
});
