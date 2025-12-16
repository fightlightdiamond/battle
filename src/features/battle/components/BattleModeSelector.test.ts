/**
 * Property-based tests for BattleModeSelector
 * Using fast-check for property-based testing
 *
 * **Feature: arena-battle-mode, Property 1: Navigation routes to correct page based on mode**
 * **Validates: Requirements 1.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  getBattleModeRoute,
  BATTLE_MODE_ROUTES,
  type BattleMode,
} from "./BattleModeSelector";

/**
 * **Feature: arena-battle-mode, Property 1: Navigation routes to correct page based on mode**
 * **Validates: Requirements 1.4**
 *
 * For any selected battle mode (classic or arena), clicking Start Battle should
 * navigate to the corresponding arena page (/battle/arena for classic, /battle/arena-1d for arena).
 */
describe("Property 1: Navigation routes to correct page based on mode", () => {
  const allModes: BattleMode[] = ["classic", "arena"];

  it("classic mode routes to /battle/arena", () => {
    expect(getBattleModeRoute("classic")).toBe("/battle/arena");
  });

  it("arena mode routes to /battle/arena-1d", () => {
    expect(getBattleModeRoute("arena")).toBe("/battle/arena-1d");
  });

  it("BATTLE_MODE_ROUTES contains correct mappings", () => {
    expect(BATTLE_MODE_ROUTES.classic).toBe("/battle/arena");
    expect(BATTLE_MODE_ROUTES.arena).toBe("/battle/arena-1d");
  });

  it("property: for any valid BattleMode, getBattleModeRoute returns the correct route", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allModes), (mode: BattleMode) => {
        const route = getBattleModeRoute(mode);
        const expectedRoute =
          mode === "classic" ? "/battle/arena" : "/battle/arena-1d";
        expect(route).toBe(expectedRoute);
      }),
      { numRuns: 100 }
    );
  });

  it("property: for any valid BattleMode, route is a non-empty string starting with /battle/", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allModes), (mode: BattleMode) => {
        const route = getBattleModeRoute(mode);
        expect(typeof route).toBe("string");
        expect(route.length).toBeGreaterThan(0);
        expect(route.startsWith("/battle/")).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it("property: different modes produce different routes", () => {
    const classicRoute = getBattleModeRoute("classic");
    const arenaRoute = getBattleModeRoute("arena");
    expect(classicRoute).not.toBe(arenaRoute);
  });

  it("property: route mapping is deterministic - same mode always returns same route", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allModes), (mode: BattleMode) => {
        const route1 = getBattleModeRoute(mode);
        const route2 = getBattleModeRoute(mode);
        expect(route1).toBe(route2);
      }),
      { numRuns: 100 }
    );
  });
});
