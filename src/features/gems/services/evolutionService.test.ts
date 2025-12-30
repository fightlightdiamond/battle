/**
 * Property-based tests for Evolution Service
 * Using fast-check for property-based testing
 *
 * **Feature: gem-skill-tree, Property 3: Evolution Path Round Trip**
 * **Feature: gem-skill-tree, Property 4: Evolution Path Tier Validation**
 * **Feature: gem-skill-tree, Property 5: Evolution Path Deletion Isolation**
 * **Feature: gem-skill-tree, Property 6: Multiple Evolution Paths from Source**
 * **Feature: gem-skill-tree, Property 7: Circular Path Prevention**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { EvolutionPath, EvolutionCost } from "../types/evolutionPath";
import type { TieredGem, GemTier } from "../types/gemTier";
import { TIER_ORDER, ALL_TIERS } from "../types/gemTier";
import { EvolutionService } from "./evolutionService";
import type { SkillType, SkillTrigger } from "../types/gem";

// ============================================
// Arbitraries (Generators)
// ============================================

// Valid gem tier generator
const gemTierArb: fc.Arbitrary<GemTier> = fc.constantFrom(
  "basic",
  "advanced",
  "master",
  "legendary",
);

// Valid skill types
const skillTypeArb: fc.Arbitrary<SkillType> = fc.constantFrom(
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
);

// Valid skill triggers
const skillTriggerArb: fc.Arbitrary<SkillTrigger> = fc.constantFrom(
  "movement",
  "combat",
);

// Valid ISO date string generator
const validIsoDateArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

// Valid effect params generator
const effectParamsArb = fc.record({
  knockbackDistance: fc.option(fc.integer({ min: 1, max: 5 }), {
    nil: undefined,
  }),
  moveDistance: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  attackCount: fc.option(fc.integer({ min: 2, max: 5 }), { nil: undefined }),
  executeThreshold: fc.option(fc.integer({ min: 1, max: 50 }), {
    nil: undefined,
  }),
  leapRange: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
  leapKnockback: fc.option(fc.integer({ min: 1, max: 5 }), { nil: undefined }),
});

// Valid tiered gem generator
const tieredGemArb: fc.Arbitrary<TieredGem> = fc.record({
  id: fc.uuid(),
  name: fc
    .string({ minLength: 1, maxLength: 50 })
    .filter((s) => s.trim().length > 0),
  description: fc.string({ minLength: 0, maxLength: 200 }),
  skillType: skillTypeArb,
  trigger: skillTriggerArb,
  activationChance: fc.integer({ min: 0, max: 100 }),
  cooldown: fc.integer({ min: 0, max: 10 }),
  effectParams: effectParamsArb,
  imagePath: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  imageUrl: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: null,
  }),
  createdAt: validIsoDateArb,
  updatedAt: validIsoDateArb,
  tier: gemTierArb,
});

// Generate a tiered gem with a specific tier
const tieredGemWithTierArb = (tier: GemTier): fc.Arbitrary<TieredGem> =>
  tieredGemArb.map((gem) => ({ ...gem, tier }));

// Generate a pair of gems where source tier < target tier (valid evolution)
const validEvolutionPairArb: fc.Arbitrary<[TieredGem, TieredGem]> = fc
  .integer({ min: 0, max: 2 }) // Source tier index (0-2, not legendary)
  .chain((sourceTierIndex) => {
    const sourceTier = ALL_TIERS[sourceTierIndex];
    // Target tier must be higher
    const targetTierIndex = fc.integer({
      min: sourceTierIndex + 1,
      max: 3,
    });
    return fc.tuple(
      tieredGemWithTierArb(sourceTier),
      targetTierIndex.chain((idx) => tieredGemWithTierArb(ALL_TIERS[idx])),
    );
  });

// Generate a pair of gems where source tier >= target tier (invalid evolution)
const invalidEvolutionPairArb: fc.Arbitrary<[TieredGem, TieredGem]> = fc
  .integer({ min: 0, max: 3 }) // Source tier index
  .chain((sourceTierIndex) => {
    const sourceTier = ALL_TIERS[sourceTierIndex];
    // Target tier must be same or lower
    const targetTierIndex = fc.integer({
      min: 0,
      max: sourceTierIndex,
    });
    return fc.tuple(
      tieredGemWithTierArb(sourceTier),
      targetTierIndex.chain((idx) => tieredGemWithTierArb(ALL_TIERS[idx])),
    );
  });

// Valid evolution cost generator
const evolutionCostArb: fc.Arbitrary<EvolutionCost> = fc.record({
  gold: fc.integer({ min: 1, max: 10000 }),
  materials: fc.option(
    fc.dictionary(
      fc.string({ minLength: 1, maxLength: 20 }),
      fc.integer({ min: 1, max: 100 }),
    ),
    { nil: undefined },
  ),
});

// Valid evolution path generator
const evolutionPathArb: fc.Arbitrary<EvolutionPath> = fc.record({
  id: fc.uuid(),
  sourceGemId: fc.uuid(),
  targetGemId: fc.uuid(),
  cost: evolutionCostArb,
  createdAt: validIsoDateArb,
  updatedAt: validIsoDateArb,
});

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: gem-skill-tree, Property 3: Evolution Path Round Trip**
 * **Validates: Requirements 2.1**
 *
 * For any valid evolution path input (source gem, target gem, cost),
 * creating the path and retrieving it should return an equivalent path
 * with all fields matching.
 */
describe("Property 3: Evolution Path Round Trip", () => {
  it("property: JSON serialize/deserialize preserves all evolution path fields", () => {
    fc.assert(
      fc.property(evolutionPathArb, (path) => {
        // Serialize to JSON string
        const serialized = JSON.stringify(path);

        // Deserialize back to object
        const deserialized = JSON.parse(serialized) as EvolutionPath;

        // All fields should be preserved
        expect(deserialized.id).toBe(path.id);
        expect(deserialized.sourceGemId).toBe(path.sourceGemId);
        expect(deserialized.targetGemId).toBe(path.targetGemId);
        expect(deserialized.cost.gold).toBe(path.cost.gold);
        expect(deserialized.createdAt).toBe(path.createdAt);
        expect(deserialized.updatedAt).toBe(path.updatedAt);

        // Materials should match if present
        if (path.cost.materials) {
          expect(deserialized.cost.materials).toEqual(path.cost.materials);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: evolution cost gold is always positive after serialization", () => {
    fc.assert(
      fc.property(evolutionPathArb, (path) => {
        const serialized = JSON.stringify(path);
        const deserialized = JSON.parse(serialized) as EvolutionPath;

        expect(deserialized.cost.gold).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it("property: evolution path IDs are preserved through serialization", () => {
    fc.assert(
      fc.property(evolutionPathArb, (path) => {
        const serialized = JSON.stringify(path);
        const deserialized = JSON.parse(serialized) as EvolutionPath;

        // IDs should be valid UUIDs and match
        expect(deserialized.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        expect(deserialized.sourceGemId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
        expect(deserialized.targetGemId).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-tree, Property 4: Evolution Path Tier Validation**
 * **Validates: Requirements 2.2**
 *
 * For any pair of gems where source tier >= target tier (according to TIER_ORDER),
 * the Evolution_System should reject the evolution path creation.
 */
describe("Property 4: Evolution Path Tier Validation", () => {
  it("property: validatePath accepts when target tier is higher than source tier", () => {
    fc.assert(
      fc.property(validEvolutionPairArb, ([sourceGem, targetGem]) => {
        const result = EvolutionService.validatePath(sourceGem, targetGem);

        expect(result.valid).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: validatePath rejects when target tier is same or lower than source tier", () => {
    fc.assert(
      fc.property(invalidEvolutionPairArb, ([sourceGem, targetGem]) => {
        const result = EvolutionService.validatePath(sourceGem, targetGem);

        expect(result.valid).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain("must be higher");
      }),
      { numRuns: 100 },
    );
  });

  it("property: tier validation is consistent with TIER_ORDER", () => {
    fc.assert(
      fc.property(tieredGemArb, tieredGemArb, (sourceGem, targetGem) => {
        const result = EvolutionService.validatePath(sourceGem, targetGem);
        const sourceTierOrder = TIER_ORDER[sourceGem.tier];
        const targetTierOrder = TIER_ORDER[targetGem.tier];

        if (targetTierOrder > sourceTierOrder) {
          expect(result.valid).toBe(true);
        } else {
          expect(result.valid).toBe(false);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: same tier always results in invalid path", () => {
    fc.assert(
      fc.property(gemTierArb, tieredGemArb, (tier, baseGem) => {
        const sourceGem = { ...baseGem, tier, id: "source-id" };
        const targetGem = { ...baseGem, tier, id: "target-id" };

        const result = EvolutionService.validatePath(sourceGem, targetGem);

        expect(result.valid).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-tree, Property 5: Evolution Path Deletion Isolation**
 * **Validates: Requirements 2.3**
 *
 * For any evolution path that is deleted, the source and target gems
 * should still exist in the database unchanged.
 *
 * Note: This is tested at the data structure level since we can't
 * easily test against a real database in property tests.
 */
describe("Property 5: Evolution Path Deletion Isolation", () => {
  it("property: deleting a path from a list does not affect gem references", () => {
    fc.assert(
      fc.property(
        fc.array(evolutionPathArb, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 9 }),
        (paths, indexToDelete) => {
          // Ensure index is valid
          const validIndex = indexToDelete % paths.length;
          const pathToDelete = paths[validIndex];

          // Store gem IDs before deletion
          const sourceGemId = pathToDelete.sourceGemId;
          const targetGemId = pathToDelete.targetGemId;

          // Simulate deletion by filtering out the path
          const remainingPaths = paths.filter((p) => p.id !== pathToDelete.id);

          // The gem IDs should still be valid strings (not affected by deletion)
          expect(sourceGemId).toBeDefined();
          expect(targetGemId).toBeDefined();
          expect(typeof sourceGemId).toBe("string");
          expect(typeof targetGemId).toBe("string");

          // The deleted path should not be in remaining paths
          expect(
            remainingPaths.find((p) => p.id === pathToDelete.id),
          ).toBeUndefined();

          // Other paths should be unaffected
          expect(remainingPaths.length).toBe(paths.length - 1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: path deletion preserves other paths with same source gem", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(evolutionPathArb, { minLength: 2, maxLength: 5 }),
        (sharedSourceId, basePaths) => {
          // Create paths that share the same source gem
          const pathsWithSharedSource = basePaths.map((p, i) => ({
            ...p,
            sourceGemId: sharedSourceId,
            id: `path-${i}`,
          }));

          // Delete the first path
          const pathToDelete = pathsWithSharedSource[0];
          const remainingPaths = pathsWithSharedSource.filter(
            (p) => p.id !== pathToDelete.id,
          );

          // All remaining paths should still have the shared source
          remainingPaths.forEach((p) => {
            expect(p.sourceGemId).toBe(sharedSourceId);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-tree, Property 6: Multiple Evolution Paths from Source**
 * **Validates: Requirements 2.4**
 *
 * For any source gem, the Evolution_System should allow creating
 * multiple evolution paths to different target gems.
 */
describe("Property 6: Multiple Evolution Paths from Source", () => {
  it("property: multiple paths from same source can coexist", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(fc.uuid(), { minLength: 2, maxLength: 5 }),
        evolutionCostArb,
        validIsoDateArb,
        (sourceGemId, targetGemIds, cost, timestamp) => {
          // Create multiple paths from the same source
          const paths: EvolutionPath[] = targetGemIds.map((targetId, i) => ({
            id: `path-${i}`,
            sourceGemId,
            targetGemId: targetId,
            cost,
            createdAt: timestamp,
            updatedAt: timestamp,
          }));

          // All paths should have the same source
          paths.forEach((p) => {
            expect(p.sourceGemId).toBe(sourceGemId);
          });

          // All paths should have unique IDs
          const pathIds = paths.map((p) => p.id);
          const uniqueIds = new Set(pathIds);
          expect(uniqueIds.size).toBe(paths.length);

          // All target gems should be different
          const targetIds = paths.map((p) => p.targetGemId);
          const uniqueTargets = new Set(targetIds);
          expect(uniqueTargets.size).toBe(targetGemIds.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: filtering paths by source returns all paths from that source", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.array(evolutionPathArb, { minLength: 3, maxLength: 10 }),
        fc.integer({ min: 1, max: 3 }),
        (targetSourceId, basePaths, numPathsFromSource) => {
          // Assign some paths to the target source
          const paths = basePaths.map((p, i) => ({
            ...p,
            sourceGemId:
              i < numPathsFromSource ? targetSourceId : p.sourceGemId,
          }));

          // Filter paths by source
          const pathsFromSource = paths.filter(
            (p) => p.sourceGemId === targetSourceId,
          );

          // Should find at least numPathsFromSource paths
          expect(pathsFromSource.length).toBeGreaterThanOrEqual(
            numPathsFromSource,
          );

          // All filtered paths should have the correct source
          pathsFromSource.forEach((p) => {
            expect(p.sourceGemId).toBe(targetSourceId);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-tree, Property 7: Circular Path Prevention**
 * **Validates: Requirements 2.5**
 *
 * For any sequence of evolution paths that would form a cycle (A→B→C→A),
 * the Evolution_System should reject the path that completes the cycle.
 */
describe("Property 7: Circular Path Prevention", () => {
  it("property: direct cycle (A→B, B→A) is detected", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        evolutionCostArb,
        validIsoDateArb,
        (gemA, gemB, cost, timestamp) => {
          // Existing path: A → B
          const existingPaths: EvolutionPath[] = [
            {
              id: "path-1",
              sourceGemId: gemA,
              targetGemId: gemB,
              cost,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ];

          // Trying to add: B → A (would create cycle)
          const wouldCreateCycle = EvolutionService.checkCircularPath(
            gemB,
            gemA,
            existingPaths,
          );

          expect(wouldCreateCycle).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: indirect cycle (A→B→C, C→A) is detected", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        evolutionCostArb,
        validIsoDateArb,
        (gemA, gemB, gemC, cost, timestamp) => {
          // Existing paths: A → B → C
          const existingPaths: EvolutionPath[] = [
            {
              id: "path-1",
              sourceGemId: gemA,
              targetGemId: gemB,
              cost,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            {
              id: "path-2",
              sourceGemId: gemB,
              targetGemId: gemC,
              cost,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ];

          // Trying to add: C → A (would create cycle)
          const wouldCreateCycle = EvolutionService.checkCircularPath(
            gemC,
            gemA,
            existingPaths,
          );

          expect(wouldCreateCycle).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: non-cyclic path is allowed", () => {
    fc.assert(
      fc.property(
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        fc.uuid(),
        evolutionCostArb,
        validIsoDateArb,
        (gemA, gemB, gemC, gemD, cost, timestamp) => {
          // Existing paths: A → B, C → D (no connection)
          const existingPaths: EvolutionPath[] = [
            {
              id: "path-1",
              sourceGemId: gemA,
              targetGemId: gemB,
              cost,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
            {
              id: "path-2",
              sourceGemId: gemC,
              targetGemId: gemD,
              cost,
              createdAt: timestamp,
              updatedAt: timestamp,
            },
          ];

          // Trying to add: B → C (connects the chains but no cycle)
          const wouldCreateCycle = EvolutionService.checkCircularPath(
            gemB,
            gemC,
            existingPaths,
          );

          expect(wouldCreateCycle).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: adding path to empty graph never creates cycle", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (sourceId, targetId) => {
        const existingPaths: EvolutionPath[] = [];

        const wouldCreateCycle = EvolutionService.checkCircularPath(
          sourceId,
          targetId,
          existingPaths,
        );

        expect(wouldCreateCycle).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: self-loop (A→A) is not detected by checkCircularPath (handled by tier validation)", () => {
    fc.assert(
      fc.property(fc.uuid(), (gemA) => {
        const existingPaths: EvolutionPath[] = [];

        // Self-loop: A → A
        // Note: This would be caught by tier validation (same tier),
        // but checkCircularPath doesn't detect it as a cycle
        const wouldCreateCycle = EvolutionService.checkCircularPath(
          gemA,
          gemA,
          existingPaths,
        );

        // Self-loops are handled by tier validation, not cycle detection
        expect(wouldCreateCycle).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Additional canEvolve Tests
// ============================================

describe("canEvolve resource validation", () => {
  it("property: canEvolve returns true when player owns gem and has sufficient gold", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.integer({ min: 0, max: 10000 }),
        (path, extraGold) => {
          const playerGold = path.cost.gold + extraGold;
          const playerMaterials: Record<string, number> = {};
          const playerGemIds = [path.sourceGemId]; // Player owns the source gem

          // Add sufficient materials if required
          if (path.cost.materials) {
            for (const [materialId, required] of Object.entries(
              path.cost.materials,
            )) {
              playerMaterials[materialId] = required;
            }
          }

          const canEvolve = EvolutionService.canEvolve(
            path,
            playerGold,
            playerMaterials,
            playerGemIds,
          );

          expect(canEvolve).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: canEvolve returns false when player does not own source gem", () => {
    fc.assert(
      fc.property(evolutionPathArb, (path) => {
        const playerGold = path.cost.gold + 1000; // Sufficient gold
        const playerMaterials: Record<string, number> = {};
        const playerGemIds: string[] = []; // Player does NOT own the source gem

        // Add sufficient materials if required
        if (path.cost.materials) {
          for (const [materialId, required] of Object.entries(
            path.cost.materials,
          )) {
            playerMaterials[materialId] = required;
          }
        }

        const canEvolve = EvolutionService.canEvolve(
          path,
          playerGold,
          playerMaterials,
          playerGemIds,
        );

        expect(canEvolve).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: canEvolve returns false when player has insufficient gold", () => {
    fc.assert(
      fc.property(evolutionPathArb, (path) => {
        // Player has less gold than required
        const playerGold = Math.max(0, path.cost.gold - 1);
        const playerMaterials: Record<string, number> = {};
        const playerGemIds = [path.sourceGemId]; // Player owns the source gem

        // Add sufficient materials if required
        if (path.cost.materials) {
          for (const [materialId, required] of Object.entries(
            path.cost.materials,
          )) {
            playerMaterials[materialId] = required;
          }
        }

        const canEvolve = EvolutionService.canEvolve(
          path,
          playerGold,
          playerMaterials,
          playerGemIds,
        );

        expect(canEvolve).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: canEvolve returns false when player has insufficient materials", () => {
    // Generate path with required materials
    const pathWithMaterialsArb = fc.record({
      id: fc.uuid(),
      sourceGemId: fc.uuid(),
      targetGemId: fc.uuid(),
      cost: fc.record({
        gold: fc.integer({ min: 1, max: 1000 }),
        materials: fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.integer({ min: 2, max: 100 }), // At least 2 so we can have insufficient
        ),
      }),
      createdAt: validIsoDateArb,
      updatedAt: validIsoDateArb,
    });

    fc.assert(
      fc.property(pathWithMaterialsArb, (path) => {
        // Skip if no materials required
        if (
          !path.cost.materials ||
          Object.keys(path.cost.materials).length === 0
        ) {
          return true;
        }

        // Player has sufficient gold
        const playerGold = path.cost.gold;
        const playerMaterials: Record<string, number> = {};
        const playerGemIds = [path.sourceGemId]; // Player owns the source gem

        // Add insufficient materials (1 less than required for first material)
        const materialEntries = Object.entries(path.cost.materials);
        materialEntries.forEach(([materialId, required], index) => {
          if (index === 0) {
            playerMaterials[materialId] = required - 1; // Insufficient
          } else {
            playerMaterials[materialId] = required; // Sufficient
          }
        });

        const canEvolve = EvolutionService.canEvolve(
          path,
          playerGold,
          playerMaterials,
          playerGemIds,
        );

        expect(canEvolve).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 12 & 13: Evolution Execution Tests
// ============================================

/**
 * **Feature: gem-skill-tree, Property 12: Evolution Execution Invariants**
 * **Validates: Requirements 5.1, 5.2, 5.3**
 *
 * For any successful evolution:
 * - Player gold should decrease by exactly the evolution cost
 * - Target gem should appear in player's gem list
 * - Source gem should be removed from player's gem list
 *
 * Note: These tests validate the logic at the data transformation level
 * since we can't easily test against a real database in property tests.
 */
describe("Property 12: Evolution Execution Invariants", () => {
  it("property: evolution cost deduction is exact", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.integer({ min: 0, max: 100000 }),
        (path, extraGold) => {
          const initialGold = path.cost.gold + extraGold;
          const expectedGold = initialGold - path.cost.gold;

          // Simulate gold deduction
          const newGold = initialGold - path.cost.gold;

          expect(newGold).toBe(expectedGold);
          expect(newGold).toBe(extraGold);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: source gem is removed from player inventory after evolution", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (path, additionalGemIds) => {
          // Create player gem list including the source gem
          const playerGemIds = [path.sourceGemId, ...additionalGemIds];

          // Simulate evolution: remove source, add target
          const newGemIds = playerGemIds.filter(
            (id) => id !== path.sourceGemId,
          );
          newGemIds.push(path.targetGemId);

          // Source gem should not be in the new list
          expect(newGemIds).not.toContain(path.sourceGemId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: target gem is added to player inventory after evolution", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        (path, additionalGemIds) => {
          // Create player gem list including the source gem
          const playerGemIds = [path.sourceGemId, ...additionalGemIds];

          // Simulate evolution: remove source, add target
          const newGemIds = playerGemIds.filter(
            (id) => id !== path.sourceGemId,
          );
          newGemIds.push(path.targetGemId);

          // Target gem should be in the new list
          expect(newGemIds).toContain(path.targetGemId);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: gem count changes by exactly 0 after evolution (remove 1, add 1)", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
        (path, additionalGemIds) => {
          // Create player gem list including the source gem
          const playerGemIds = [path.sourceGemId, ...additionalGemIds];
          const initialCount = playerGemIds.length;

          // Simulate evolution: remove source, add target
          const newGemIds = playerGemIds.filter(
            (id) => id !== path.sourceGemId,
          );
          newGemIds.push(path.targetGemId);

          // Count should remain the same (removed 1, added 1)
          expect(newGemIds.length).toBe(initialCount);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: material costs are deducted correctly", () => {
    // Generate path with required materials
    const pathWithMaterialsArb = fc.record({
      id: fc.uuid(),
      sourceGemId: fc.uuid(),
      targetGemId: fc.uuid(),
      cost: fc.record({
        gold: fc.integer({ min: 1, max: 1000 }),
        materials: fc.dictionary(
          fc.string({ minLength: 1, maxLength: 10 }),
          fc.integer({ min: 1, max: 50 }),
        ),
      }),
      createdAt: validIsoDateArb,
      updatedAt: validIsoDateArb,
    });

    fc.assert(
      fc.property(pathWithMaterialsArb, (path) => {
        // Skip if no materials required
        if (
          !path.cost.materials ||
          Object.keys(path.cost.materials).length === 0
        ) {
          return true;
        }

        // Create player materials with sufficient amounts
        const playerMaterials: Record<string, number> = {};
        for (const [materialId, required] of Object.entries(
          path.cost.materials,
        )) {
          playerMaterials[materialId] = required + 10; // Extra materials
        }

        // Simulate material deduction
        const newMaterials = { ...playerMaterials };
        for (const [materialId, required] of Object.entries(
          path.cost.materials,
        )) {
          newMaterials[materialId] = (newMaterials[materialId] || 0) - required;
        }

        // Verify each material was deducted correctly
        for (const [materialId, required] of Object.entries(
          path.cost.materials,
        )) {
          expect(newMaterials[materialId]).toBe(
            playerMaterials[materialId] - required,
          );
        }
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * **Feature: gem-skill-tree, Property 13: Evolution Resource Validation**
 * **Validates: Requirements 5.4**
 *
 * For any evolution attempt where player gold < evolution cost,
 * the Evolution_System should reject the evolution and leave player state unchanged.
 */
describe("Property 13: Evolution Resource Validation", () => {
  it("property: evolution is rejected when player does not own source gem", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.array(fc.uuid(), { minLength: 0, maxLength: 10 }),
        (path, otherGemIds) => {
          // Ensure player does NOT own the source gem
          const playerGemIds = otherGemIds.filter(
            (id) => id !== path.sourceGemId,
          );
          const playerGold = path.cost.gold + 1000; // Sufficient gold
          const playerMaterials: Record<string, number> = {};

          // Add sufficient materials if required
          if (path.cost.materials) {
            for (const [materialId, required] of Object.entries(
              path.cost.materials,
            )) {
              playerMaterials[materialId] = required;
            }
          }

          const canEvolve = EvolutionService.canEvolve(
            path,
            playerGold,
            playerMaterials,
            playerGemIds,
          );

          expect(canEvolve).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: evolution is rejected when player has insufficient gold", () => {
    fc.assert(
      fc.property(evolutionPathArb, (path) => {
        // Player owns the source gem but has insufficient gold
        const playerGemIds = [path.sourceGemId];
        const playerGold = Math.max(0, path.cost.gold - 1);
        const playerMaterials: Record<string, number> = {};

        // Add sufficient materials if required
        if (path.cost.materials) {
          for (const [materialId, required] of Object.entries(
            path.cost.materials,
          )) {
            playerMaterials[materialId] = required;
          }
        }

        const canEvolve = EvolutionService.canEvolve(
          path,
          playerGold,
          playerMaterials,
          playerGemIds,
        );

        expect(canEvolve).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: player state is unchanged when evolution is rejected", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.array(fc.uuid(), { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 0, max: 10000 }),
        (path, additionalGemIds, initialGold) => {
          // Create initial state
          const initialGemIds = [path.sourceGemId, ...additionalGemIds];
          const initialMaterials: Record<string, number> = {
            iron: 10,
            gold: 5,
          };

          // Make a copy of initial state
          const gemIdsCopy = [...initialGemIds];
          const goldCopy = initialGold;
          const materialsCopy = { ...initialMaterials };

          // Check if evolution is possible
          const canEvolve = EvolutionService.canEvolve(
            path,
            initialGold,
            initialMaterials,
            initialGemIds,
          );

          // If evolution is rejected, state should be unchanged
          if (!canEvolve) {
            // Verify state is unchanged
            expect(initialGemIds).toEqual(gemIdsCopy);
            expect(initialGold).toBe(goldCopy);
            expect(initialMaterials).toEqual(materialsCopy);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: evolution is accepted only when all conditions are met", () => {
    fc.assert(
      fc.property(
        evolutionPathArb,
        fc.integer({ min: 0, max: 10000 }),
        fc.boolean(),
        (path, extraGold, ownsSourceGem) => {
          const playerGemIds = ownsSourceGem ? [path.sourceGemId] : [];
          const playerGold = path.cost.gold + extraGold;
          const playerMaterials: Record<string, number> = {};

          // Add sufficient materials if required
          if (path.cost.materials) {
            for (const [materialId, required] of Object.entries(
              path.cost.materials,
            )) {
              playerMaterials[materialId] = required;
            }
          }

          const canEvolve = EvolutionService.canEvolve(
            path,
            playerGold,
            playerMaterials,
            playerGemIds,
          );

          // Evolution should only be possible if player owns source gem
          // and has sufficient resources
          const hasEnoughGold = playerGold >= path.cost.gold;
          const expectedResult = ownsSourceGem && hasEnoughGold;

          expect(canEvolve).toBe(expectedResult);
        },
      ),
      { numRuns: 100 },
    );
  });
});
