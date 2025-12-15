/**
 * StatusBar Property-Based Tests
 *
 * **Feature: ui-status-bar, Property 1: Gold balance display consistency**
 * **Validates: Requirements 1.2**
 *
 * **Feature: ui-status-bar, Property 2: Status bar visibility based on route**
 * **Validates: Requirements 1.5**
 *
 * Tests that StatusBar visibility is correctly determined based on route path.
 * Hidden during battle arena, bet battle arena, and replay modes.
 * Tests that gold balance is displayed consistently with formatGold function.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as fc from "fast-check";
import { StatusBar } from "./StatusBar";
import { shouldShowStatusBar } from "./statusBarUtils";
import { formatGold } from "@/features/betting/components/GoldBalanceDisplay";
import { useBettingStore } from "@/features/betting/store/bettingStore";

// Helper to render StatusBar with MemoryRouter at a specific route
const renderStatusBar = (pathname: string) => {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <StatusBar rightContent={<span>Test</span>} />
    </MemoryRouter>
  );
};

// Arbitrary for generating valid route paths that should show status bar
const visibleRouteArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant("/"),
  fc.constant("/cards"),
  fc.constant("/cards/new"),
  fc.constant("/battle/setup"),
  fc.constant("/history"),
  fc.constant("/matchups"),
  fc.constant("/matchup-bets"),
  fc.constant("/admin/matchups"),
  // Generate random paths that don't match hidden patterns
  fc
    .string({ minLength: 1, maxLength: 20 })
    .filter((s) => /^[a-z0-9-]+$/.test(s))
    .filter((s) => !s.includes("replay"))
    .filter((s) => s !== "battle" && s !== "bet-battle")
    .map((s) => `/${s}`)
);

// Arbitrary for generating routes that should hide status bar
const hiddenRouteArb: fc.Arbitrary<string> = fc.oneof(
  fc.constant("/battle/arena"),
  fc.constant("/bet-battle/arena"),
  // Any path containing /replay
  fc
    .string({ minLength: 1, maxLength: 10 })
    .filter((s) => /^[a-z0-9-]+$/.test(s))
    .map((s) => `/history/${s}/replay`),
  fc.constant("/battle/123/replay"),
  fc.constant("/some/path/replay/here")
);

describe("StatusBar", () => {
  describe("Property 2: Status bar visibility based on route", () => {
    /**
     * **Feature: ui-status-bar, Property 2: Status bar visibility based on route**
     * **Validates: Requirements 1.5**
     *
     * For any route path, the Status_Bar SHALL be visible if and only if
     * the path does not match `/battle/arena`, `/bet-battle/arena`, or contain `/replay`.
     */
    it("should be visible on routes that are not battle arena or replay", () => {
      fc.assert(
        fc.property(visibleRouteArb, (pathname: string) => {
          // Verify the utility function returns true
          expect(shouldShowStatusBar(pathname)).toBe(true);

          // Verify the component renders
          const { unmount } = renderStatusBar(pathname);
          const statusBar = screen.queryByTestId("status-bar");
          expect(statusBar).not.toBeNull();

          unmount();
        }),
        { numRuns: 100 }
      );
    });

    it("should be hidden on battle arena route", () => {
      fc.assert(
        fc.property(fc.constant("/battle/arena"), (pathname: string) => {
          // Verify the utility function returns false
          expect(shouldShowStatusBar(pathname)).toBe(false);

          // Verify the component does not render
          const { unmount } = renderStatusBar(pathname);
          const statusBar = screen.queryByTestId("status-bar");
          expect(statusBar).toBeNull();

          unmount();
        }),
        { numRuns: 10 }
      );
    });

    it("should be hidden on bet battle arena route", () => {
      fc.assert(
        fc.property(fc.constant("/bet-battle/arena"), (pathname: string) => {
          // Verify the utility function returns false
          expect(shouldShowStatusBar(pathname)).toBe(false);

          // Verify the component does not render
          const { unmount } = renderStatusBar(pathname);
          const statusBar = screen.queryByTestId("status-bar");
          expect(statusBar).toBeNull();

          unmount();
        }),
        { numRuns: 10 }
      );
    });

    it("should be hidden on any route containing /replay", () => {
      fc.assert(
        fc.property(hiddenRouteArb, (pathname: string) => {
          // Only test paths that contain /replay or are arena paths
          if (
            pathname.includes("/replay") ||
            pathname === "/battle/arena" ||
            pathname === "/bet-battle/arena"
          ) {
            // Verify the utility function returns false
            expect(shouldShowStatusBar(pathname)).toBe(false);

            // Verify the component does not render
            const { unmount } = renderStatusBar(pathname);
            const statusBar = screen.queryByTestId("status-bar");
            expect(statusBar).toBeNull();

            unmount();
          }
        }),
        { numRuns: 100 }
      );
    });
  });

  describe("Property 1: Gold balance display consistency", () => {
    /**
     * **Feature: ui-status-bar, Property 1: Gold balance display consistency**
     * **Validates: Requirements 1.2**
     *
     * For any gold balance value in the betting store, the Status_Bar SHALL
     * display the same formatted value as returned by the formatGold function.
     */

    // Reset store before each test
    beforeEach(() => {
      useBettingStore.setState({ goldBalance: 0 });
    });

    it("should display gold balance formatted consistently with formatGold", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10000000 }),
          (goldBalance: number) => {
            // Set the gold balance in the store
            useBettingStore.setState({ goldBalance });

            // Render the StatusBar
            const { unmount } = render(
              <MemoryRouter initialEntries={["/"]}>
                <StatusBar />
              </MemoryRouter>
            );

            // Get the expected formatted value
            const expectedFormatted = formatGold(goldBalance);

            // Find the gold balance display
            const goldDisplay = screen.getByTestId("gold-balance-display");
            expect(goldDisplay).not.toBeNull();

            // Verify the displayed value matches the formatted value
            expect(goldDisplay.textContent).toContain(expectedFormatted);

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });

    it("should update display when gold balance changes", () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000000 }),
          fc.integer({ min: 0, max: 1000000 }),
          (initialBalance: number, newBalance: number) => {
            // Set initial balance
            useBettingStore.setState({ goldBalance: initialBalance });

            const { rerender, unmount } = render(
              <MemoryRouter initialEntries={["/"]}>
                <StatusBar />
              </MemoryRouter>
            );

            // Verify initial display
            let goldDisplay = screen.getByTestId("gold-balance-display");
            expect(goldDisplay.textContent).toContain(
              formatGold(initialBalance)
            );

            // Update balance
            useBettingStore.setState({ goldBalance: newBalance });

            // Re-render to pick up state change
            rerender(
              <MemoryRouter initialEntries={["/"]}>
                <StatusBar />
              </MemoryRouter>
            );

            // Verify updated display
            goldDisplay = screen.getByTestId("gold-balance-display");
            expect(goldDisplay.textContent).toContain(formatGold(newBalance));

            unmount();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
