import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  isDangerState,
  getHpBarPercentage,
  DANGER_THRESHOLD,
} from "./arenaCardUtils";

/**
 * **Feature: arena-battle-mode, Property 9: HP bar reflects current HP**
 * **Validates: Requirements 6.2**
 *
 * For any damage taken, the HP bar value should equal currentHp / maxHp.
 */
describe("Property 9: HP bar reflects current HP", () => {
  it("HP bar percentage equals currentHp / maxHp * 100", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // currentHp
        fc.integer({ min: 1, max: 1000 }), // maxHp (must be > 0)
        (currentHp, maxHp) => {
          const percentage = getHpBarPercentage(currentHp, maxHp);
          const expected = Math.min(
            100,
            Math.max(0, (currentHp / maxHp) * 100)
          );

          expect(percentage).toBeCloseTo(expected, 5);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("HP bar percentage is clamped between 0 and 100", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 2000 }), // currentHp (can be negative or over max)
        fc.integer({ min: 1, max: 1000 }), // maxHp
        (currentHp, maxHp) => {
          const percentage = getHpBarPercentage(currentHp, maxHp);

          expect(percentage).toBeGreaterThanOrEqual(0);
          expect(percentage).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("full HP shows 100%", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // maxHp
        (maxHp) => {
          const percentage = getHpBarPercentage(maxHp, maxHp);
          expect(percentage).toBe(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("zero HP shows 0%", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // maxHp
        (maxHp) => {
          const percentage = getHpBarPercentage(0, maxHp);
          expect(percentage).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("half HP shows 50%", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 1000 }).filter((n) => n % 2 === 0), // even maxHp
        (maxHp) => {
          const percentage = getHpBarPercentage(maxHp / 2, maxHp);
          expect(percentage).toBe(50);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * **Feature: arena-battle-mode, Property 10: Danger state triggers below 25% HP**
 * **Validates: Requirements 6.3**
 *
 * For any card with currentHp / maxHp < 0.25, the danger state should be true.
 */
describe("Property 10: Danger state triggers below 25% HP", () => {
  it("danger threshold is 25%", () => {
    expect(DANGER_THRESHOLD).toBe(25);
  });

  it("HP below 25% triggers danger state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // maxHp (use larger values for precision)
        (maxHp) => {
          // Calculate HP that is just below 25% (e.g., 24.9%)
          const hpBelow25 = Math.floor(maxHp * 0.249);

          if (hpBelow25 >= 0) {
            const isDanger = isDangerState(hpBelow25, maxHp);
            expect(isDanger).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it("HP at or above 25% does NOT trigger danger state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // maxHp
        (maxHp) => {
          // Calculate HP that is exactly 25%
          const hpAt25 = Math.ceil(maxHp * 0.25);

          const isDanger = isDangerState(hpAt25, maxHp);
          expect(isDanger).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("HP above 25% does NOT trigger danger state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 100, max: 1000 }), // maxHp
        fc.float({
          min: Math.fround(0.26),
          max: Math.fround(1.0),
          noNaN: true,
        }), // percentage above 25%
        (maxHp, percentage) => {
          const currentHp = Math.ceil(maxHp * percentage);

          const isDanger = isDangerState(currentHp, maxHp);
          expect(isDanger).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("zero HP triggers danger state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // maxHp
        (maxHp) => {
          const isDanger = isDangerState(0, maxHp);
          expect(isDanger).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("full HP does NOT trigger danger state", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 1000 }), // maxHp
        (maxHp) => {
          const isDanger = isDangerState(maxHp, maxHp);
          expect(isDanger).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("invalid maxHp (0 or negative) returns false", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }), // currentHp
        fc.integer({ min: -100, max: 0 }), // invalid maxHp
        (currentHp, maxHp) => {
          const isDanger = isDangerState(currentHp, maxHp);
          expect(isDanger).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("property: danger state is consistent with percentage threshold", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 1000 }), // currentHp
        fc.integer({ min: 1, max: 1000 }), // maxHp
        (currentHp, maxHp) => {
          const percentage = (currentHp / maxHp) * 100;
          const isDanger = isDangerState(currentHp, maxHp);

          if (percentage < DANGER_THRESHOLD) {
            expect(isDanger).toBe(true);
          } else {
            expect(isDanger).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
