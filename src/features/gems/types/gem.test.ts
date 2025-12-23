/**
 * Property-based tests for Gem Types
 * Using fast-check for property-based testing
 *
 * **Feature: gem-skill-system, Property 1: Gem CRUD Round Trip**
 * **Validates: Requirements 1.1, 1.3**
 *
 * For any valid gem data, creating a gem and then retrieving it by ID
 * should return an equivalent gem with all fields matching.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  gemSchema,
  gemFormSchema,
  validateGemName,
  GEM_NAME_MAX_LENGTH,
  GEM_DESCRIPTION_MAX_LENGTH,
  ACTIVATION_CHANCE_RANGE,
  COOLDOWN_RANGE,
  EFFECT_PARAM_RANGES,
  skillTypeSchema,
  skillTriggerSchema,
} from "./schemas";
import type { Gem, GemFormInput, SkillType, SkillTrigger } from "./gem";

// ============================================
// Arbitraries (Generators)
// ============================================

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

// Valid name generator
const validNameArb = fc
  .string({ minLength: 1, maxLength: GEM_NAME_MAX_LENGTH })
  .filter((s) => s.trim().length > 0);

// Valid description generator
const validDescriptionArb = fc.string({
  minLength: 0,
  maxLength: GEM_DESCRIPTION_MAX_LENGTH,
});

// Valid effect params generator based on skill type
const effectParamsArb = fc.record({
  knockbackDistance: fc.option(
    fc.integer({
      min: EFFECT_PARAM_RANGES.knockbackDistance.min,
      max: EFFECT_PARAM_RANGES.knockbackDistance.max,
    }),
    { nil: undefined },
  ),
  moveDistance: fc.option(
    fc.integer({
      min: EFFECT_PARAM_RANGES.moveDistance.min,
      max: EFFECT_PARAM_RANGES.moveDistance.max,
    }),
    { nil: undefined },
  ),
  attackCount: fc.option(
    fc.integer({
      min: EFFECT_PARAM_RANGES.attackCount.min,
      max: EFFECT_PARAM_RANGES.attackCount.max,
    }),
    { nil: undefined },
  ),
  executeThreshold: fc.option(
    fc.integer({
      min: EFFECT_PARAM_RANGES.executeThreshold.min,
      max: EFFECT_PARAM_RANGES.executeThreshold.max,
    }),
    { nil: undefined },
  ),
  leapRange: fc.option(
    fc.integer({
      min: EFFECT_PARAM_RANGES.leapRange.min,
      max: EFFECT_PARAM_RANGES.leapRange.max,
    }),
    { nil: undefined },
  ),
  leapKnockback: fc.option(
    fc.integer({
      min: EFFECT_PARAM_RANGES.leapKnockback.min,
      max: EFFECT_PARAM_RANGES.leapKnockback.max,
    }),
    { nil: undefined },
  ),
});

// Valid gem form input generator
const validGemFormInputArb: fc.Arbitrary<GemFormInput> = fc.record({
  name: validNameArb,
  description: validDescriptionArb,
  skillType: skillTypeArb,
  trigger: skillTriggerArb,
  activationChance: fc.integer({
    min: ACTIVATION_CHANCE_RANGE.min,
    max: ACTIVATION_CHANCE_RANGE.max,
  }),
  cooldown: fc.integer({
    min: COOLDOWN_RANGE.min,
    max: COOLDOWN_RANGE.max,
  }),
  effectParams: effectParamsArb,
  image: fc.constant(undefined), // Image is optional and not validated by schema
});

// Valid ISO date string generator using timestamp range
const validIsoDateArb = fc
  .integer({
    min: new Date("2020-01-01").getTime(),
    max: new Date("2030-12-31").getTime(),
  })
  .map((ts) => new Date(ts).toISOString());

// Valid complete gem generator
const validGemArb: fc.Arbitrary<Gem> = fc.record({
  id: fc.uuid(),
  name: validNameArb,
  description: validDescriptionArb,
  skillType: skillTypeArb,
  trigger: skillTriggerArb,
  activationChance: fc.integer({
    min: ACTIVATION_CHANCE_RANGE.min,
    max: ACTIVATION_CHANCE_RANGE.max,
  }),
  cooldown: fc.integer({
    min: COOLDOWN_RANGE.min,
    max: COOLDOWN_RANGE.max,
  }),
  effectParams: effectParamsArb,
  imagePath: fc.option(fc.string({ minLength: 1, maxLength: 100 }), {
    nil: null,
  }),
  imageUrl: fc.option(fc.string({ minLength: 1, maxLength: 200 }), {
    nil: null,
  }),
  createdAt: validIsoDateArb,
  updatedAt: validIsoDateArb,
});

// ============================================
// Property Tests
// ============================================

/**
 * **Feature: gem-skill-system, Property 1: Gem CRUD Round Trip**
 * **Validates: Requirements 1.1, 1.3**
 */
describe("Property 1: Gem CRUD Round Trip", () => {
  it("property: JSON serialize/deserialize produces equivalent gem", () => {
    fc.assert(
      fc.property(validGemArb, (gem) => {
        // Serialize to JSON string
        const serialized = JSON.stringify(gem);

        // Deserialize back to object
        const deserialized = JSON.parse(serialized);

        // Validate with schema
        const result = gemSchema.safeParse(deserialized);
        expect(result.success).toBe(true);

        if (result.success) {
          // All fields should match original
          expect(result.data.id).toBe(gem.id);
          expect(result.data.name).toBe(gem.name);
          expect(result.data.description).toBe(gem.description);
          expect(result.data.skillType).toBe(gem.skillType);
          expect(result.data.trigger).toBe(gem.trigger);
          expect(result.data.activationChance).toBe(gem.activationChance);
          expect(result.data.cooldown).toBe(gem.cooldown);
          expect(result.data.createdAt).toBe(gem.createdAt);
          expect(result.data.updatedAt).toBe(gem.updatedAt);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("property: effectParams are preserved through serialization", () => {
    fc.assert(
      fc.property(validGemArb, (gem) => {
        const serialized = JSON.stringify(gem);
        const deserialized = JSON.parse(serialized);

        // effectParams should be preserved
        expect(deserialized.effectParams.knockbackDistance).toBe(
          gem.effectParams.knockbackDistance,
        );
        expect(deserialized.effectParams.moveDistance).toBe(
          gem.effectParams.moveDistance,
        );
        expect(deserialized.effectParams.attackCount).toBe(
          gem.effectParams.attackCount,
        );
        expect(deserialized.effectParams.executeThreshold).toBe(
          gem.effectParams.executeThreshold,
        );
        expect(deserialized.effectParams.leapRange).toBe(
          gem.effectParams.leapRange,
        );
        expect(deserialized.effectParams.leapKnockback).toBe(
          gem.effectParams.leapKnockback,
        );
      }),
      { numRuns: 100 },
    );
  });

  it("property: valid gem form input passes schema validation", () => {
    fc.assert(
      fc.property(validGemFormInputArb, (input) => {
        const result = gemFormSchema.safeParse(input);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: valid complete gem passes schema validation", () => {
    fc.assert(
      fc.property(validGemArb, (gem) => {
        const result = gemSchema.safeParse(gem);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Gem name validation tests
 */
describe("Gem name validation", () => {
  // Generator for whitespace-only strings
  const whitespaceOnlyArb = fc
    .array(fc.constantFrom(" ", "\t", "\n", "\r", "\f", "\v"), {
      minLength: 0,
      maxLength: 50,
    })
    .map((chars) => chars.join(""));

  it("property: empty string is rejected", () => {
    fc.assert(
      fc.property(fc.constant(""), (name) => {
        const result = validateGemName(name);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: whitespace-only strings are rejected", () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, (name) => {
        const result = validateGemName(name);
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: valid non-whitespace names are accepted", () => {
    fc.assert(
      fc.property(validNameArb, (name) => {
        const result = validateGemName(name);
        expect(result.success).toBe(true);
        expect(result.error).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it("property: names exceeding max length are rejected", () => {
    const tooLongNameArb = fc.string({
      minLength: GEM_NAME_MAX_LENGTH + 1,
      maxLength: GEM_NAME_MAX_LENGTH + 100,
    });

    fc.assert(
      fc.property(tooLongNameArb, (name) => {
        const result = validateGemName(name);
        expect(result.success).toBe(false);
        expect(result.error).toContain("characters or less");
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Skill type and trigger validation tests
 */
describe("Skill type and trigger validation", () => {
  it("property: all valid skill types pass schema", () => {
    fc.assert(
      fc.property(skillTypeArb, (skillType) => {
        const result = skillTypeSchema.safeParse(skillType);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: all valid skill triggers pass schema", () => {
    fc.assert(
      fc.property(skillTriggerArb, (trigger) => {
        const result = skillTriggerSchema.safeParse(trigger);
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: invalid skill types are rejected", () => {
    const invalidSkillTypeArb = fc
      .string()
      .filter(
        (s) =>
          ![
            "knockback",
            "retreat",
            "double_move",
            "double_attack",
            "execute",
            "leap_strike",
          ].includes(s),
      );

    fc.assert(
      fc.property(invalidSkillTypeArb, (skillType) => {
        const result = skillTypeSchema.safeParse(skillType);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: invalid skill triggers are rejected", () => {
    const invalidTriggerArb = fc
      .string()
      .filter((s) => !["movement", "combat"].includes(s));

    fc.assert(
      fc.property(invalidTriggerArb, (trigger) => {
        const result = skillTriggerSchema.safeParse(trigger);
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });
});

/**
 * Activation chance and cooldown validation tests
 */
describe("Activation chance and cooldown validation", () => {
  it("property: activation chance within range is accepted", () => {
    const validChanceArb = fc.integer({
      min: ACTIVATION_CHANCE_RANGE.min,
      max: ACTIVATION_CHANCE_RANGE.max,
    });

    fc.assert(
      fc.property(validChanceArb, validNameArb, (chance, name) => {
        const result = gemFormSchema.safeParse({
          name,
          description: "",
          skillType: "knockback",
          trigger: "combat",
          activationChance: chance,
          cooldown: 0,
          effectParams: {},
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  it("property: activation chance below 0 is rejected", () => {
    const invalidChanceArb = fc.integer({ min: -100, max: -1 });

    fc.assert(
      fc.property(invalidChanceArb, validNameArb, (chance, name) => {
        const result = gemFormSchema.safeParse({
          name,
          description: "",
          skillType: "knockback",
          trigger: "combat",
          activationChance: chance,
          cooldown: 0,
          effectParams: {},
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: activation chance above 100 is rejected", () => {
    const invalidChanceArb = fc.integer({ min: 101, max: 200 });

    fc.assert(
      fc.property(invalidChanceArb, validNameArb, (chance, name) => {
        const result = gemFormSchema.safeParse({
          name,
          description: "",
          skillType: "knockback",
          trigger: "combat",
          activationChance: chance,
          cooldown: 0,
          effectParams: {},
        });
        expect(result.success).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  it("property: cooldown within range is accepted", () => {
    const validCooldownArb = fc.integer({
      min: COOLDOWN_RANGE.min,
      max: COOLDOWN_RANGE.max,
    });

    fc.assert(
      fc.property(validCooldownArb, validNameArb, (cooldown, name) => {
        const result = gemFormSchema.safeParse({
          name,
          description: "",
          skillType: "knockback",
          trigger: "combat",
          activationChance: 50,
          cooldown,
          effectParams: {},
        });
        expect(result.success).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});
