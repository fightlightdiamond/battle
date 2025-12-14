/**
 * Property-based tests for Daily Bonus Service
 * Using fast-check for property-based testing
 *
 * Tests validate that daily bonus can only be claimed once per calendar day
 * as specified in the design document.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as fc from "fast-check";
import {
  canClaimToday,
  recordClaim,
  getLastClaim,
  getTodayDateString,
} from "./dailyBonusService";

// ============================================================================
// TEST SETUP
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
});

beforeEach(() => {
  localStorageMock.clear();
  vi.restoreAllMocks();
});

// ============================================================================
// ARBITRARIES (Generators for property-based testing)
// ============================================================================

/**
 * Generator for number of claim attempts (1 to 10)
 */
const claimAttemptsArb = fc.integer({ min: 1, max: 10 });

/**
 * Generator for valid date strings (YYYY-MM-DD format)
 */
const dateStringArb = fc.integer({ min: 2020, max: 2030 }).chain((year) =>
  fc.integer({ min: 1, max: 12 }).chain((month) =>
    fc.integer({ min: 1, max: 28 }).map((day) => {
      const monthStr = String(month).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      return `${year}-${monthStr}-${dayStr}`;
    })
  )
);

// ============================================================================
// PROPERTY-BASED TESTS
// ============================================================================

describe("Daily Bonus Service - Property Tests", () => {
  /**
   * **Feature: betting-system, Property 1: Daily Bonus Once Per Day**
   *
   * For any sequence of daily bonus claim attempts on the same calendar day,
   * only the first attempt SHALL succeed and credit 1000 gold;
   * subsequent attempts SHALL be rejected.
   *
   * **Validates: Requirements 1.1, 1.2**
   */
  it("Property 1: Only first claim attempt per day succeeds, subsequent attempts are rejected", () => {
    fc.assert(
      fc.property(claimAttemptsArb, (numAttempts: number) => {
        // Clear storage before each property run
        localStorageMock.clear();

        // Track results of each claim attempt
        const results: boolean[] = [];

        for (let i = 0; i < numAttempts; i++) {
          const canClaim = canClaimToday();
          results.push(canClaim);

          if (canClaim) {
            recordClaim();
          }
        }

        // First attempt should always succeed (storage is clear)
        expect(results[0]).toBe(true);

        // All subsequent attempts should fail
        for (let i = 1; i < results.length; i++) {
          expect(results[i]).toBe(false);
        }

        // Verify claim was recorded
        const lastClaim = getLastClaim();
        expect(lastClaim).not.toBeNull();
        expect(lastClaim?.lastClaimDate).toBe(getTodayDateString());
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Additional property: Claims on different days should both succeed
   * This validates that the day boundary check works correctly.
   *
   * **Validates: Requirements 1.1, 1.2**
   */
  it("Property 1b: Claims on different calendar days should both succeed", () => {
    fc.assert(
      fc.property(dateStringArb, (pastDate: string) => {
        // Clear storage
        localStorageMock.clear();

        // Simulate a claim from a past date
        const pastClaim = {
          lastClaimDate: pastDate,
          lastClaimTimestamp: Date.now() - 86400000, // 1 day ago
        };
        localStorageMock.setItem(
          "betting_daily_bonus",
          JSON.stringify(pastClaim)
        );

        // If the past date is different from today, we should be able to claim
        const todayDate = getTodayDateString();
        const canClaim = canClaimToday();

        if (pastDate !== todayDate) {
          expect(canClaim).toBe(true);
        } else {
          expect(canClaim).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ============================================================================
// UNIT TESTS
// ============================================================================

describe("Daily Bonus Service - Unit Tests", () => {
  it("should return true for canClaimToday when no previous claim exists", () => {
    expect(canClaimToday()).toBe(true);
  });

  it("should return null for getLastClaim when no claim exists", () => {
    expect(getLastClaim()).toBeNull();
  });

  it("should persist claim to localStorage when recordClaim is called", () => {
    recordClaim();

    const claim = getLastClaim();
    expect(claim).not.toBeNull();
    expect(claim?.lastClaimDate).toBe(getTodayDateString());
    expect(claim?.lastClaimTimestamp).toBeLessThanOrEqual(Date.now());
  });

  it("should return false for canClaimToday after claiming today", () => {
    recordClaim();
    expect(canClaimToday()).toBe(false);
  });

  it("should return today's date in YYYY-MM-DD format", () => {
    const dateString = getTodayDateString();
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
