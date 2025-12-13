import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  formatStatValue,
  formatStatFromDefinition,
  getStatIcon,
  getStatIconFromDefinition,
} from "./statDisplay";
import { STAT_REGISTRY } from "./statConfig";
import { HelpCircle } from "lucide-react";

/**
 * **Feature: config-driven-stats, Property 4: Format Application Correctness**
 * **Validates: Requirements 2.2, 3.3**
 *
 * For any stat with format 'percentage', the formatted output SHALL include '%' suffix.
 * For any stat, the formatted output SHALL respect the decimalPlaces configuration.
 */
describe("Property 4: Format Application Correctness", () => {
  // Arbitrary for valid stat values (reasonable range for testing)
  const statValueArb = fc.double({
    min: 0,
    max: 10000,
    noNaN: true,
    noDefaultInfinity: true,
  });

  // Arbitrary for decimal places (0-4 is reasonable)
  const decimalPlacesArb = fc.integer({ min: 0, max: 4 });

  it("percentage format always includes % suffix", () => {
    fc.assert(
      fc.property(statValueArb, decimalPlacesArb, (value, decimalPlaces) => {
        const result = formatStatValue(value, "percentage", decimalPlaces);
        expect(result.endsWith("%")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("number format never includes % suffix", () => {
    fc.assert(
      fc.property(statValueArb, decimalPlacesArb, (value, decimalPlaces) => {
        const result = formatStatValue(value, "number", decimalPlaces);
        expect(result.endsWith("%")).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it("formatted output respects decimalPlaces for percentage format", () => {
    fc.assert(
      fc.property(statValueArb, decimalPlacesArb, (value, decimalPlaces) => {
        const result = formatStatValue(value, "percentage", decimalPlaces);
        // Remove the % suffix and check decimal places
        const numericPart = result.slice(0, -1);
        const parts = numericPart.split(".");

        if (decimalPlaces === 0) {
          // Should have no decimal point or empty decimal part
          expect(parts.length === 1 || parts[1] === "").toBe(true);
        } else {
          // Should have exactly decimalPlaces digits after decimal
          expect(parts.length).toBe(2);
          expect(parts[1].length).toBe(decimalPlaces);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("all registry stats format correctly according to their config", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STAT_REGISTRY),
        statValueArb,
        (stat, value) => {
          const result = formatStatFromDefinition(stat, value);

          // Check percentage suffix
          if (stat.format === "percentage") {
            expect(result.endsWith("%")).toBe(true);
          } else {
            expect(result.endsWith("%")).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("formatStatValue and formatStatFromDefinition produce consistent results", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...STAT_REGISTRY),
        statValueArb,
        (stat, value) => {
          const direct = formatStatValue(
            value,
            stat.format,
            stat.decimalPlaces
          );
          const fromDef = formatStatFromDefinition(stat, value);
          expect(direct).toBe(fromDef);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Unit tests for stat display utilities
 */
describe("Stat Display Utilities", () => {
  describe("formatStatValue", () => {
    it("formats percentage with correct suffix", () => {
      expect(formatStatValue(50, "percentage", 0)).toBe("50%");
      expect(formatStatValue(5.5, "percentage", 1)).toBe("5.5%");
      expect(formatStatValue(12.34, "percentage", 2)).toBe("12.34%");
    });

    it("formats number without suffix", () => {
      expect(formatStatValue(1000, "number", 0)).toBe("1,000");
      expect(formatStatValue(100, "number", 0)).toBe("100");
    });

    it("handles zero correctly", () => {
      expect(formatStatValue(0, "number", 0)).toBe("0");
      expect(formatStatValue(0, "percentage", 0)).toBe("0%");
      expect(formatStatValue(0, "percentage", 1)).toBe("0.0%");
    });

    it("handles decimal places correctly", () => {
      expect(formatStatValue(5.56, "percentage", 1)).toBe("5.6%");
      expect(formatStatValue(5.52, "percentage", 1)).toBe("5.5%");
    });
  });

  describe("getStatIcon", () => {
    it("returns correct icon for known icon names", () => {
      const icon = getStatIcon("Heart");
      expect(icon).toBeDefined();
      expect(icon).not.toBe(HelpCircle);
    });

    it("returns default icon for unknown icon names", () => {
      const icon = getStatIcon("UnknownIcon");
      expect(icon).toBe(HelpCircle);
    });

    it("returns icons for all registry stat icons", () => {
      for (const stat of STAT_REGISTRY) {
        const icon = getStatIcon(stat.icon);
        expect(icon).toBeDefined();
        expect(icon).not.toBe(HelpCircle);
      }
    });
  });

  describe("getStatIconFromDefinition", () => {
    it("returns correct icon for stat definition", () => {
      for (const stat of STAT_REGISTRY) {
        const icon = getStatIconFromDefinition(stat);
        expect(icon).toBeDefined();
        expect(icon).not.toBe(HelpCircle);
      }
    });
  });
});
