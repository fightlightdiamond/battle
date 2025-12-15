/**
 * AppLayout Integration Tests
 *
 * Tests that StatusBar integrates correctly with AppLayout
 * **Validates: Requirements 4.2**
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppLayout } from "./AppLayout";

// Helper to render AppLayout with MemoryRouter at a specific route
const renderAppLayout = (pathname: string, variant?: "game" | "menu") => {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <AppLayout variant={variant}>
        <div data-testid="content">Content</div>
      </AppLayout>
    </MemoryRouter>
  );
};

describe("AppLayout Integration", () => {
  describe("StatusBar integration", () => {
    /**
     * Test StatusBar renders in AppLayout
     * **Validates: Requirements 4.2**
     */
    it("should render StatusBar on standard routes", () => {
      renderAppLayout("/cards");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).not.toBeNull();
    });

    it("should render StatusBar on menu variant", () => {
      renderAppLayout("/history", "menu");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).not.toBeNull();
    });

    it("should render StatusBar on game variant for non-arena routes", () => {
      renderAppLayout("/battle/setup", "game");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).not.toBeNull();
    });

    /**
     * Test StatusBar hidden during battle/replay
     * **Validates: Requirements 4.2**
     */
    it("should hide StatusBar on battle arena route", () => {
      renderAppLayout("/battle/arena", "game");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).toBeNull();
    });

    it("should hide StatusBar on bet battle arena route", () => {
      renderAppLayout("/bet-battle/arena", "game");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).toBeNull();
    });

    it("should hide StatusBar on replay routes", () => {
      renderAppLayout("/history/123/replay", "game");

      const statusBar = screen.queryByTestId("status-bar");
      expect(statusBar).toBeNull();
    });

    it("should render content alongside StatusBar", () => {
      renderAppLayout("/cards");

      const statusBar = screen.queryByTestId("status-bar");
      const content = screen.queryByTestId("content");

      expect(statusBar).not.toBeNull();
      expect(content).not.toBeNull();
    });
  });
});
