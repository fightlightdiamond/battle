/**
 * Property-based tests for Layout Engine
 * Using fast-check for property-based testing
 *
 * **Feature: gem-skill-tree, Property 8: Node Generation Count**
 * **Feature: gem-skill-tree, Property 9: Node Position by Tier**
 * **Feature: gem-skill-tree, Property 10: Edge Source/Target Mapping**
 * **Feature: gem-skill-tree, Property 11: Node State Determination**
 * **Feature: gem-skill-tree, Property 15: Edge Cost Affordability**
 * **Feature: gem-skill-tree, Property 16: Layout Tier Grouping**
 * **Feature: gem-skill-tree, Property 17: Layout Vertical Distribution**
 * **Validates: Requirements 3.1, 3.2, 3.3, 4.1-4.4, 7.3, 7.4, 9.1, 9.2, 9.4**
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { TieredGem, GemTier } from "../../types/gemTier";
import { TIER_ORDER, ALL_TIERS } from "../../types/gemTier";
import type { EvolutionPath, EvolutionCost } from "../../types/evolutionPath";
import type { SkillType, SkillTrigger } from "../../types/gem";
import { defaultSkillTreeConfig } from "../../config/skillTreeConfig";
import {
  calculateNodePositions,
  getNodeState,
  gemsToNodes,
  pathsToEdges,
  canAffordEvolution,
} from "./layoutEngine";

// ============================================
// Arbitraries (Generators)
// ============================================

const gemTierArb: fc.Arbitrary<GemTier> = fc.constantFrom(
  "basic",
  "advanced",
  "master",
  "legendary",
);

const skillTypeArb: fc.Arbitrary<SkillType> = fc.constantFrom(
  "knockback",
  "retreat",
  "double_move",
  "double_attack",
  "execute",
  "leap_strike",
);

const skillTriggerArb: fc.Arbitrary<SkillTrigger> = fc.constantFrom(
  "movement",
  "combat",
);

const validIsoDateArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

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

const evolutionPathArb: fc.Arbitrary<EvolutionPath> = fc.record({
  id: fc.uuid(),
  sourceGemId: fc.uuid(),
  targetGemId: fc.uuid(),
  cost: evolutionCostArb,
  createdAt: validIsoDateArb,
  updatedAt: validIsoDateArb,
});

// Generate array of gems with unique IDs
const uniqueGemsArb = (
  minLength: number,
  maxLength: number,
): fc.Arbitrary<TieredGem[]> =>
  fc.array(tieredGemArb, { minLength, maxLength }).map((gems) => {
    const seen = new Set<string>();
    return gems.filter((gem) => {
      if (seen.has(gem.id)) return false;
      seen.add(gem.id);
      return true;
    });
  });

// ============================================
// Property 8: Node Generation Count
// ============================================

/**
 * **Feature: gem-skill-tree, Property 8: Node Generation Count**
 * **Validates: Requirements 3.1**
 *
 * For any set of gems, the layout engine should generate exactly one
 * React Flow node per gem.
 */
describe("Property 8: Node Generation Count", () => {
  it("property: gemsToNodes generates exactly one node per gem", () => {
    fc.assert(
      fc.property(uniqueGemsArb(0, 20), (gems) => {
        const ownedGemIds = new Set<string>();
        const availableEvolutions = new Set<string>();
        const paths: EvolutionPath[] = [];

        const nodes = gemsToNodes(
          gems,
          ownedGemIds,
          availableEvolutions,
          paths,
          defaultSkillTreeConfig,
          null,
        );

        expect(nodes.length).toBe(gems.length);
      }),
      { numRuns: 100 },
    );
  });

  it("property: each node ID matches a gem ID", () => {
    fc.assert(
      fc.property(uniqueGemsArb(1, 15), (gems) => {
        const ownedGemIds = new Set<string>();
        const availableEvolutions = new Set<string>();
        const paths: EvolutionPath[] = [];

        const nodes = gemsToNodes(
          gems,
          ownedGemIds,
          availableEvolutions,
          paths,
          defaultSkillTreeConfig,
          null,
        );

        const gemIds = new Set(gems.map((g) => g.id));
        const nodeIds = new Set(nodes.map((n) => n.id));

        expect(nodeIds).toEqual(gemIds);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 9: Node Position by Tier
// ============================================

/**
 * **Feature: gem-skill-tree, Property 9: Node Position by Tier**
 * **Validates: Requirements 3.2**
 *
 * For any two gems where gem1.tier < gem2.tier (in TIER_ORDER),
 * the x-position of gem1's node should be less than gem2's node x-position.
 */
describe("Property 9: Node Position by Tier", () => {
  it("property: lower tier gems have smaller x-position than higher tier gems", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),
        tieredGemArb,
        tieredGemArb,
        (lowerTierIndex, gem1Base, gem2Base) => {
          const lowerTier = ALL_TIERS[lowerTierIndex];
          const higherTier = ALL_TIERS[lowerTierIndex + 1];

          const gem1: TieredGem = { ...gem1Base, tier: lowerTier, id: "gem-1" };
          const gem2: TieredGem = {
            ...gem2Base,
            tier: higherTier,
            id: "gem-2",
          };

          const positions = calculateNodePositions(
            [gem1, gem2],
            defaultSkillTreeConfig,
          );

          const pos1 = positions.get(gem1.id)!;
          const pos2 = positions.get(gem2.id)!;

          expect(pos1.x).toBeLessThan(pos2.x);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: tier order is consistent with TIER_ORDER constant", () => {
    fc.assert(
      fc.property(tieredGemArb, tieredGemArb, (gem1Base, gem2Base) => {
        const gem1: TieredGem = { ...gem1Base, id: "gem-1" };
        const gem2: TieredGem = { ...gem2Base, id: "gem-2" };

        const positions = calculateNodePositions(
          [gem1, gem2],
          defaultSkillTreeConfig,
        );

        const pos1 = positions.get(gem1.id)!;
        const pos2 = positions.get(gem2.id)!;

        if (TIER_ORDER[gem1.tier] < TIER_ORDER[gem2.tier]) {
          expect(pos1.x).toBeLessThan(pos2.x);
        } else if (TIER_ORDER[gem1.tier] > TIER_ORDER[gem2.tier]) {
          expect(pos1.x).toBeGreaterThan(pos2.x);
        } else {
          expect(pos1.x).toBe(pos2.x);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 10: Edge Source/Target Mapping
// ============================================

/**
 * **Feature: gem-skill-tree, Property 10: Edge Source/Target Mapping**
 * **Validates: Requirements 3.3**
 *
 * For any evolution path, the generated React Flow edge should have
 * source ID equal to sourceGemId and target ID equal to targetGemId.
 */
describe("Property 10: Edge Source/Target Mapping", () => {
  it("property: edge source matches path sourceGemId", () => {
    fc.assert(
      fc.property(
        fc.array(evolutionPathArb, { minLength: 1, maxLength: 10 }),
        (paths) => {
          const edges = pathsToEdges(paths, 10000, {});

          paths.forEach((path, index) => {
            expect(edges[index].source).toBe(path.sourceGemId);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: edge target matches path targetGemId", () => {
    fc.assert(
      fc.property(
        fc.array(evolutionPathArb, { minLength: 1, maxLength: 10 }),
        (paths) => {
          const edges = pathsToEdges(paths, 10000, {});

          paths.forEach((path, index) => {
            expect(edges[index].target).toBe(path.targetGemId);
          });
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: edge ID matches path ID", () => {
    fc.assert(
      fc.property(
        fc.array(evolutionPathArb, { minLength: 1, maxLength: 10 }),
        (paths) => {
          const edges = pathsToEdges(paths, 10000, {});

          paths.forEach((path, index) => {
            expect(edges[index].id).toBe(path.id);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 11: Node State Determination
// ============================================

/**
 * **Feature: gem-skill-tree, Property 11: Node State Determination**
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4**
 *
 * For any gem and ownership state:
 * - If gem is in ownedGemIds AND has available evolution → state is "available"
 * - If gem is in ownedGemIds AND no available evolution → state is "owned"
 * - If gem is NOT in ownedGemIds AND has owned prerequisite → state is "locked"
 * - If gem is NOT in ownedGemIds AND no owned prerequisite → state is "unowned"
 */
describe("Property 11: Node State Determination", () => {
  it("property: owned gem with available evolution returns 'available'", () => {
    fc.assert(
      fc.property(fc.uuid(), (gemId) => {
        const ownedGemIds = new Set([gemId]);
        const availableEvolutions = new Set([gemId]);
        const pathTargetToSources = new Map<string, string[]>();

        const state = getNodeState(
          gemId,
          ownedGemIds,
          availableEvolutions,
          pathTargetToSources,
        );

        expect(state).toBe("available");
      }),
      { numRuns: 100 },
    );
  });

  it("property: owned gem without available evolution returns 'owned'", () => {
    fc.assert(
      fc.property(fc.uuid(), (gemId) => {
        const ownedGemIds = new Set([gemId]);
        const availableEvolutions = new Set<string>(); // No evolutions
        const pathTargetToSources = new Map<string, string[]>();

        const state = getNodeState(
          gemId,
          ownedGemIds,
          availableEvolutions,
          pathTargetToSources,
        );

        expect(state).toBe("owned");
      }),
      { numRuns: 100 },
    );
  });

  it("property: unowned gem with owned prerequisite returns 'locked'", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (gemId, prerequisiteId) => {
        const ownedGemIds = new Set([prerequisiteId]); // Own the prerequisite
        const availableEvolutions = new Set<string>();
        const pathTargetToSources = new Map<string, string[]>();
        pathTargetToSources.set(gemId, [prerequisiteId]); // prerequisite → gemId

        const state = getNodeState(
          gemId,
          ownedGemIds,
          availableEvolutions,
          pathTargetToSources,
        );

        expect(state).toBe("locked");
      }),
      { numRuns: 100 },
    );
  });

  it("property: unowned gem without owned prerequisite returns 'unowned'", () => {
    fc.assert(
      fc.property(fc.uuid(), fc.uuid(), (gemId, otherGemId) => {
        const ownedGemIds = new Set<string>(); // Own nothing
        const availableEvolutions = new Set<string>();
        const pathTargetToSources = new Map<string, string[]>();
        pathTargetToSources.set(gemId, [otherGemId]); // otherGem → gemId (but not owned)

        const state = getNodeState(
          gemId,
          ownedGemIds,
          availableEvolutions,
          pathTargetToSources,
        );

        expect(state).toBe("unowned");
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 15: Edge Cost Affordability
// ============================================

/**
 * **Feature: gem-skill-tree, Property 15: Edge Cost Affordability**
 * **Validates: Requirements 7.3, 7.4**
 *
 * For any evolution path and player gold:
 * - If player gold >= path cost → canAfford is true
 * - If player gold < path cost → canAfford is false
 */
describe("Property 15: Edge Cost Affordability", () => {
  it("property: canAfford is true when player has sufficient gold", () => {
    fc.assert(
      fc.property(
        evolutionCostArb,
        fc.integer({ min: 0, max: 10000 }),
        (cost, extraGold) => {
          const playerGold = cost.gold + extraGold;
          const playerMaterials: Record<string, number> = {};

          // Add sufficient materials if required
          if (cost.materials) {
            for (const [materialId, required] of Object.entries(
              cost.materials,
            )) {
              playerMaterials[materialId] = required;
            }
          }

          const result = canAffordEvolution(cost, playerGold, playerMaterials);
          expect(result).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: canAfford is false when player has insufficient gold", () => {
    fc.assert(
      fc.property(evolutionCostArb, (cost) => {
        const playerGold = Math.max(0, cost.gold - 1);
        const playerMaterials: Record<string, number> = {};

        // Add sufficient materials if required
        if (cost.materials) {
          for (const [materialId, required] of Object.entries(cost.materials)) {
            playerMaterials[materialId] = required;
          }
        }

        const result = canAffordEvolution(cost, playerGold, playerMaterials);
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: canAfford is false when player has insufficient materials", () => {
    const costWithMaterialsArb = fc.record({
      gold: fc.integer({ min: 1, max: 1000 }),
      materials: fc.dictionary(
        fc.string({ minLength: 1, maxLength: 10 }),
        fc.integer({ min: 2, max: 100 }),
      ),
    });

    fc.assert(
      fc.property(costWithMaterialsArb, (cost) => {
        if (!cost.materials || Object.keys(cost.materials).length === 0) {
          return true; // Skip if no materials
        }

        const playerGold = cost.gold;
        const playerMaterials: Record<string, number> = {};

        // Add insufficient materials for first material
        const materialEntries = Object.entries(cost.materials);
        materialEntries.forEach(([materialId, required], index) => {
          playerMaterials[materialId] = index === 0 ? required - 1 : required;
        });

        const result = canAffordEvolution(cost, playerGold, playerMaterials);
        expect(result).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 16: Layout Tier Grouping
// ============================================

/**
 * **Feature: gem-skill-tree, Property 16: Layout Tier Grouping**
 * **Validates: Requirements 9.1**
 *
 * For any set of gems, all gems of the same tier should have
 * the same x-position in the layout.
 */
describe("Property 16: Layout Tier Grouping", () => {
  it("property: gems of same tier have same x-position", () => {
    fc.assert(
      fc.property(
        gemTierArb,
        fc.array(tieredGemArb, { minLength: 2, maxLength: 10 }),
        (tier, baseGems) => {
          // Create gems with same tier but unique IDs
          const gems = baseGems.map((gem, i) => ({
            ...gem,
            tier,
            id: `gem-${i}`,
          }));

          const positions = calculateNodePositions(
            gems,
            defaultSkillTreeConfig,
          );

          const xPositions = gems.map((gem) => positions.get(gem.id)!.x);
          const uniqueXPositions = new Set(xPositions);

          expect(uniqueXPositions.size).toBe(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: different tiers have different x-positions", () => {
    fc.assert(
      fc.property(tieredGemArb, tieredGemArb, (gem1Base, gem2Base) => {
        const gem1: TieredGem = { ...gem1Base, tier: "basic", id: "gem-1" };
        const gem2: TieredGem = { ...gem2Base, tier: "legendary", id: "gem-2" };

        const positions = calculateNodePositions(
          [gem1, gem2],
          defaultSkillTreeConfig,
        );

        const pos1 = positions.get(gem1.id)!;
        const pos2 = positions.get(gem2.id)!;

        expect(pos1.x).not.toBe(pos2.x);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 17: Layout Vertical Distribution
// ============================================

/**
 * **Feature: gem-skill-tree, Property 17: Layout Vertical Distribution**
 * **Validates: Requirements 9.2, 9.4**
 *
 * For any tier with multiple gems, the y-positions should be evenly
 * distributed with spacing equal to config.layout.nodeSpacing.
 */
describe("Property 17: Layout Vertical Distribution", () => {
  it("property: gems in same tier are evenly spaced vertically", () => {
    fc.assert(
      fc.property(
        gemTierArb,
        fc.array(tieredGemArb, { minLength: 3, maxLength: 8 }),
        (tier, baseGems) => {
          // Create gems with same tier but unique IDs
          const gems = baseGems.map((gem, i) => ({
            ...gem,
            tier,
            id: `gem-${i}`,
          }));

          const positions = calculateNodePositions(
            gems,
            defaultSkillTreeConfig,
          );

          // Get y-positions sorted
          const yPositions = gems
            .map((gem) => positions.get(gem.id)!.y)
            .sort((a, b) => a - b);

          // Check spacing between consecutive gems
          for (let i = 1; i < yPositions.length; i++) {
            const spacing = yPositions[i] - yPositions[i - 1];
            expect(spacing).toBeCloseTo(
              defaultSkillTreeConfig.layout.nodeSpacing,
              5,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it("property: single gem in tier is centered vertically", () => {
    fc.assert(
      fc.property(gemTierArb, tieredGemArb, (tier, gemBase) => {
        const gem: TieredGem = { ...gemBase, tier, id: "single-gem" };

        const positions = calculateNodePositions([gem], defaultSkillTreeConfig);
        const pos = positions.get(gem.id)!;

        // Single gem should be at canvas center
        const expectedY = defaultSkillTreeConfig.layout.canvasHeight / 2;
        expect(pos.y).toBeCloseTo(expectedY, 5);
      }),
      { numRuns: 100 },
    );
  });

  it("property: gems are centered around canvas middle", () => {
    fc.assert(
      fc.property(
        gemTierArb,
        fc.array(tieredGemArb, { minLength: 2, maxLength: 6 }),
        (tier, baseGems) => {
          const gems = baseGems.map((gem, i) => ({
            ...gem,
            tier,
            id: `gem-${i}`,
          }));

          const positions = calculateNodePositions(
            gems,
            defaultSkillTreeConfig,
          );

          const yPositions = gems.map((gem) => positions.get(gem.id)!.y);
          const minY = Math.min(...yPositions);
          const maxY = Math.max(...yPositions);
          const centerY = (minY + maxY) / 2;

          const canvasCenter = defaultSkillTreeConfig.layout.canvasHeight / 2;
          expect(centerY).toBeCloseTo(canvasCenter, 5);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ============================================
// Property 14: Skill Type Filtering
// ============================================

/**
 * **Feature: gem-skill-tree, Property 14: Skill Type Filtering**
 * **Validates: Requirements 6.1, 6.2, 6.3**
 *
 * For any skill type filter and set of gems:
 * - Gems matching the filter skill type should have isHighlighted = true
 * - Gems not matching should have isHighlighted = false
 * - When filter is null, all gems should have isHighlighted = true
 */
describe("Property 14: Skill Type Filtering", () => {
  it("property: all gems highlighted when filter is null", () => {
    fc.assert(
      fc.property(uniqueGemsArb(1, 10), (gems) => {
        const nodes = gemsToNodes(
          gems,
          new Set(),
          new Set(),
          [],
          defaultSkillTreeConfig,
          null,
        );

        nodes.forEach((node) => {
          expect(node.data.isHighlighted).toBe(true);
        });
      }),
      { numRuns: 100 },
    );
  });

  it("property: only matching gems highlighted when filter is set", () => {
    fc.assert(
      fc.property(uniqueGemsArb(1, 10), skillTypeArb, (gems, filterType) => {
        const nodes = gemsToNodes(
          gems,
          new Set(),
          new Set(),
          [],
          defaultSkillTreeConfig,
          filterType,
        );

        nodes.forEach((node) => {
          if (node.data.gem.skillType === filterType) {
            expect(node.data.isHighlighted).toBe(true);
          } else {
            expect(node.data.isHighlighted).toBe(false);
          }
        });
      }),
      { numRuns: 100 },
    );
  });
});
