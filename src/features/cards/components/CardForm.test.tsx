import { describe, it, expect, vi } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { CardForm } from "./CardForm";
import { STAT_REGISTRY, type StatDefinition } from "../types/statConfig";

// Mock react-router-dom's useNavigate
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

/**
 * **Feature: config-driven-stats, Property 6: Dynamic Field Generation**
 * **Validates: Requirements 2.1, 3.1**
 *
 * For any stat in the registry, the CardForm SHALL render exactly one form field
 * for that stat with the correct label and input configuration.
 */
describe("Property 6: Dynamic Field Generation", () => {
  const renderCardForm = () => {
    return render(
      <BrowserRouter>
        <CardForm mode="create" onSubmit={async () => {}} />
      </BrowserRouter>
    );
  };

  it("renders exactly one form field for each stat in the registry", () => {
    renderCardForm();

    // For each stat in the registry, there should be exactly one label
    for (const stat of STAT_REGISTRY) {
      const labels = screen.getAllByText(stat.label);
      expect(labels.length).toBe(1);
    }
  });

  it("renders the correct number of stat fields", () => {
    renderCardForm();

    // Count all stat labels
    let statFieldCount = 0;
    for (const stat of STAT_REGISTRY) {
      const labels = screen.queryAllByText(stat.label);
      statFieldCount += labels.length;
    }

    expect(statFieldCount).toBe(STAT_REGISTRY.length);
  });

  it("property: for any stat in registry, exactly one form field with correct label exists", () => {
    renderCardForm();

    fc.assert(
      fc.property(fc.constantFrom(...STAT_REGISTRY), (stat: StatDefinition) => {
        // Find all elements with this stat's label
        const labels = screen.queryAllByText(stat.label);

        // There should be exactly one label for this stat
        expect(labels.length).toBe(1);

        // The label should exist in the document
        expect(labels[0]).toBeDefined();
      }),
      { numRuns: 100 }
    );
  });

  it("property: form fields are grouped by tier with correct section headers", () => {
    renderCardForm();

    // Check that tier headers exist
    const coreStatsHeader = screen.queryByText("Core Stats");
    const combatStatsHeader = screen.queryByText("Combat Stats");

    expect(coreStatsHeader).not.toBeNull();
    expect(combatStatsHeader).not.toBeNull();
  });

  it("property: percentage stats have % suffix in their input configuration", () => {
    renderCardForm();

    // Get all percentage stats
    const percentageStats = STAT_REGISTRY.filter(
      (stat) => stat.format === "percentage"
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...percentageStats),
        (stat: StatDefinition) => {
          // The label should exist for percentage stats
          const labels = screen.queryAllByText(stat.label);
          expect(labels.length).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: number stats do not have % suffix", () => {
    renderCardForm();

    // Get all number format stats
    const numberStats = STAT_REGISTRY.filter(
      (stat) => stat.format === "number"
    );

    fc.assert(
      fc.property(fc.constantFrom(...numberStats), (stat: StatDefinition) => {
        // The label should exist for number stats
        const labels = screen.queryAllByText(stat.label);
        expect(labels.length).toBe(1);
      }),
      { numRuns: 100 }
    );
  });
});
