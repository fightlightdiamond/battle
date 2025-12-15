/**
 * FloatingMenu Unit Tests
 *
 * Tests for icon-only menu items with tooltips
 * Requirements: 2.1, 2.2, 3.1
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { FloatingMenu } from "./FloatingMenu";

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...props}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

// Helper to render FloatingMenu with MemoryRouter
const renderFloatingMenu = (pathname: string = "/") => {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <FloatingMenu />
    </MemoryRouter>
  );
};

describe("FloatingMenu", () => {
  describe("Icon-only buttons (Requirements 2.1, 2.5)", () => {
    it("should render menu items as icon-only buttons without text labels", async () => {
      renderFloatingMenu();

      // Open the menu by clicking the FAB
      const fabButton = screen.getByRole("button");
      fireEvent.click(fabButton);

      // Check that menu items exist and have aria-labels (for accessibility)
      const menuItems = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label") !== null);

      // Should have 7 menu items (based on menuItems array)
      expect(menuItems.length).toBe(7);

      // Verify buttons don't contain visible text labels
      menuItems.forEach((item) => {
        // The button should only contain the icon (SVG), not text
        const textContent = item.textContent?.trim();
        // Text content should be empty or minimal (just icon)
        expect(textContent).toBe("");
      });
    });

    it("should have consistent button sizing (44px)", async () => {
      renderFloatingMenu();

      // Open the menu
      const fabButton = screen.getByRole("button");
      fireEvent.click(fabButton);

      // Get menu item buttons
      const menuItems = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label") !== null);

      // Check that each button has the correct size classes
      menuItems.forEach((item) => {
        expect(item.className).toContain("w-11");
        expect(item.className).toContain("h-11");
      });
    });
  });

  describe("Tooltips (Requirements 2.2, 3.1)", () => {
    it("should have aria-labels for accessibility (tooltip content)", () => {
      renderFloatingMenu();

      // Open the menu
      const fabButton = screen.getByRole("button");
      fireEvent.click(fabButton);

      // Expected menu labels that should be available as aria-labels
      const expectedLabels = [
        "New Card",
        "Cards",
        "Practice Battle",
        "Battle History",
        "Bet on Matchups",
        "My Bets",
        "Admin: Matchups",
      ];

      // Verify each menu item has the correct aria-label
      expectedLabels.forEach((label) => {
        const button = screen.getByRole("button", { name: label });
        expect(button).toBeDefined();
        expect(button.getAttribute("aria-label")).toBe(label);
      });
    });

    it("should wrap menu items with tooltip trigger", () => {
      renderFloatingMenu();

      // Open the menu
      const fabButton = screen.getByRole("button");
      fireEvent.click(fabButton);

      // Get menu item buttons
      const menuItems = screen
        .getAllByRole("button")
        .filter((btn) => btn.getAttribute("aria-label") !== null);

      // Each menu item should have data-slot="tooltip-trigger" from Radix UI
      menuItems.forEach((item) => {
        expect(item.getAttribute("data-slot")).toBe("tooltip-trigger");
      });
    });
  });

  describe("Menu visibility", () => {
    it("should hide menu on battle arena route", () => {
      renderFloatingMenu("/battle/arena");

      // Menu should not be rendered
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("should hide menu on bet battle arena route", () => {
      renderFloatingMenu("/bet-battle/arena");

      // Menu should not be rendered
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("should hide menu on replay routes", () => {
      renderFloatingMenu("/history/123/replay");

      // Menu should not be rendered
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("should show menu on regular routes", () => {
      renderFloatingMenu("/cards");

      // FAB button should be rendered
      const fabButton = screen.getByRole("button");
      expect(fabButton).toBeDefined();
    });
  });
});
