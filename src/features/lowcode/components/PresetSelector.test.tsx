/**
 * PresetSelector Component Tests
 * Requirements: 1.1, 1.2
 *
 * Tests for:
 * - Renders the preset selector with label
 * - Shows currently selected preset
 * - Store integration works correctly
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PresetSelector } from "./PresetSelector";
import { useEntityStore } from "../store/entityStore";

describe("PresetSelector", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useEntityStore.setState({
      currentEntity: {
        id: "test-id",
        name: "",
        fields: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      currentPreset: "none",
      savedEntities: [],
      isLoading: false,
      error: null,
    });
  });

  describe("Rendering", () => {
    it("renders the preset selector with label", () => {
      render(<PresetSelector />);

      expect(screen.getByText("Use Preset")).toBeDefined();
    });

    it("renders the select trigger with combobox role", () => {
      render(<PresetSelector />);

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeDefined();
    });

    it("shows 'None' as default selected option", () => {
      render(<PresetSelector />);

      expect(screen.getByText("None")).toBeDefined();
      expect(screen.getByText("Start with empty fields")).toBeDefined();
    });

    it("has correct id for accessibility", () => {
      render(<PresetSelector />);

      const trigger = screen.getByRole("combobox");
      expect(trigger.id).toBe("preset-selector");
    });
  });

  describe("Current preset display", () => {
    it("displays Card-like when card preset is selected", () => {
      useEntityStore.setState({ currentPreset: "card" });

      render(<PresetSelector />);

      expect(screen.getByText("Card-like")).toBeDefined();
      expect(
        screen.getByText(
          "Combat entity with HP, ATK, DEF, SPD and offensive stats",
        ),
      ).toBeDefined();
    });

    it("displays Gem-like when gem preset is selected", () => {
      useEntityStore.setState({ currentPreset: "gem" });

      render(<PresetSelector />);

      expect(screen.getByText("Gem-like")).toBeDefined();
      expect(
        screen.getByText(
          "Skill-based entity with trigger, cooldown and activation chance",
        ),
      ).toBeDefined();
    });

    it("displays Weapon-like when weapon preset is selected", () => {
      useEntityStore.setState({ currentPreset: "weapon" });

      render(<PresetSelector />);

      expect(screen.getByText("Weapon-like")).toBeDefined();
      expect(
        screen.getByText(
          "Equipment entity with offensive stats and attack range",
        ),
      ).toBeDefined();
    });
  });

  describe("Store integration", () => {
    it("reads currentPreset from store", () => {
      useEntityStore.setState({ currentPreset: "card" });

      render(<PresetSelector />);

      // Verify the component reflects the store state
      expect(screen.getByText("Card-like")).toBeDefined();
    });

    it("updates display when store changes", () => {
      const { rerender } = render(<PresetSelector />);

      // Initially shows None
      expect(screen.getByText("None")).toBeDefined();

      // Update store wrapped in act
      act(() => {
        useEntityStore.setState({ currentPreset: "gem" });
      });

      // Re-render to pick up store changes
      rerender(<PresetSelector />);

      // Now shows Gem-like
      expect(screen.getByText("Gem-like")).toBeDefined();
    });
  });
});
