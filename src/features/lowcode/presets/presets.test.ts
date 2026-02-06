import { describe, it, expect } from "vitest";
import { cardPreset } from "./cardPreset";
import { gemPreset } from "./gemPreset";
import { weaponPreset } from "./weaponPreset";
import { getPresets, getPreset, applyPreset, getPresetOptions } from "./index";

describe("Card Preset", () => {
  it("should have correct type and metadata", () => {
    expect(cardPreset.type).toBe("card");
    expect(cardPreset.label).toBe("Card-like");
    expect(cardPreset.defaultEntityName).toBe("BattleUnit");
  });

  it("should include all required stat fields", () => {
    const fieldKeys = cardPreset.fields.map((f) => f.key);
    expect(fieldKeys).toContain("name");
    expect(fieldKeys).toContain("hp");
    expect(fieldKeys).toContain("atk");
    expect(fieldKeys).toContain("def");
    expect(fieldKeys).toContain("spd");
    expect(fieldKeys).toContain("critChance");
    expect(fieldKeys).toContain("critDamage");
    expect(fieldKeys).toContain("armorPen");
    expect(fieldKeys).toContain("lifesteal");
    expect(fieldKeys).toContain("imagePath");
  });

  it("should have name field as text and required", () => {
    const nameField = cardPreset.fields.find((f) => f.key === "name");
    expect(nameField?.type).toBe("text");
    expect(nameField?.required).toBe(true);
  });

  it("should have correct number constraints for stat fields", () => {
    const hpField = cardPreset.fields.find((f) => f.key === "hp");
    expect(hpField?.options?.min).toBe(1);
    expect(hpField?.options?.max).toBe(99999);

    const critChanceField = cardPreset.fields.find(
      (f) => f.key === "critChance",
    );
    expect(critChanceField?.options?.min).toBe(0);
    expect(critChanceField?.options?.max).toBe(100);

    const critDamageField = cardPreset.fields.find(
      (f) => f.key === "critDamage",
    );
    expect(critDamageField?.options?.min).toBe(0);
    expect(critDamageField?.options?.max).toBe(500);
  });
});

describe("Gem Preset", () => {
  it("should have correct type and metadata", () => {
    expect(gemPreset.type).toBe("gem");
    expect(gemPreset.label).toBe("Gem-like");
    expect(gemPreset.defaultEntityName).toBe("SkillGem");
  });

  it("should include all required fields", () => {
    const fieldKeys = gemPreset.fields.map((f) => f.key);
    expect(fieldKeys).toContain("name");
    expect(fieldKeys).toContain("description");
    expect(fieldKeys).toContain("skillType");
    expect(fieldKeys).toContain("trigger");
    expect(fieldKeys).toContain("activationChance");
    expect(fieldKeys).toContain("cooldown");
    expect(fieldKeys).toContain("tier");
  });

  it("should have skillType field with correct choices", () => {
    const skillTypeField = gemPreset.fields.find((f) => f.key === "skillType");
    expect(skillTypeField?.type).toBe("select");
    const choices = skillTypeField?.options?.choices?.map((c) => c.value);
    expect(choices).toContain("knockback");
    expect(choices).toContain("retreat");
    expect(choices).toContain("double_move");
    expect(choices).toContain("double_attack");
    expect(choices).toContain("execute");
    expect(choices).toContain("leap_strike");
  });

  it("should have trigger field with movement and combat choices", () => {
    const triggerField = gemPreset.fields.find((f) => f.key === "trigger");
    expect(triggerField?.type).toBe("select");
    const choices = triggerField?.options?.choices?.map((c) => c.value);
    expect(choices).toContain("movement");
    expect(choices).toContain("combat");
  });

  it("should have tier field with correct tier choices", () => {
    const tierField = gemPreset.fields.find((f) => f.key === "tier");
    expect(tierField?.type).toBe("select");
    const choices = tierField?.options?.choices?.map((c) => c.value);
    expect(choices).toContain("basic");
    expect(choices).toContain("advanced");
    expect(choices).toContain("master");
    expect(choices).toContain("legendary");
  });

  it("should have correct number constraints", () => {
    const activationChanceField = gemPreset.fields.find(
      (f) => f.key === "activationChance",
    );
    expect(activationChanceField?.options?.min).toBe(0);
    expect(activationChanceField?.options?.max).toBe(100);

    const cooldownField = gemPreset.fields.find((f) => f.key === "cooldown");
    expect(cooldownField?.options?.min).toBe(0);
  });
});

describe("Weapon Preset", () => {
  it("should have correct type and metadata", () => {
    expect(weaponPreset.type).toBe("weapon");
    expect(weaponPreset.label).toBe("Weapon-like");
    expect(weaponPreset.defaultEntityName).toBe("Equipment");
  });

  it("should include all required fields", () => {
    const fieldKeys = weaponPreset.fields.map((f) => f.key);
    expect(fieldKeys).toContain("name");
    expect(fieldKeys).toContain("atk");
    expect(fieldKeys).toContain("critChance");
    expect(fieldKeys).toContain("critDamage");
    expect(fieldKeys).toContain("armorPen");
    expect(fieldKeys).toContain("lifesteal");
    expect(fieldKeys).toContain("attackRange");
  });

  it("should have name field as text and required", () => {
    const nameField = weaponPreset.fields.find((f) => f.key === "name");
    expect(nameField?.type).toBe("text");
    expect(nameField?.required).toBe(true);
  });

  it("should have correct number constraints", () => {
    const critChanceField = weaponPreset.fields.find(
      (f) => f.key === "critChance",
    );
    expect(critChanceField?.options?.min).toBe(0);
    expect(critChanceField?.options?.max).toBe(100);

    const critDamageField = weaponPreset.fields.find(
      (f) => f.key === "critDamage",
    );
    expect(critDamageField?.options?.min).toBe(0);
    expect(critDamageField?.options?.max).toBe(500);

    const attackRangeField = weaponPreset.fields.find(
      (f) => f.key === "attackRange",
    );
    expect(attackRangeField?.options?.min).toBe(0);
    expect(attackRangeField?.options?.max).toBe(6);
  });
});

describe("presetRegistry functions", () => {
  describe("getPresets", () => {
    it("should return all 3 presets", () => {
      const presets = getPresets();
      expect(presets).toHaveLength(3);
    });

    it("should include card, gem, and weapon presets", () => {
      const presets = getPresets();
      const types = presets.map((p) => p.type);
      expect(types).toContain("card");
      expect(types).toContain("gem");
      expect(types).toContain("weapon");
    });
  });

  describe("getPreset", () => {
    it("should return card preset for type 'card'", () => {
      const preset = getPreset("card");
      expect(preset).toBeDefined();
      expect(preset?.type).toBe("card");
      expect(preset?.label).toBe("Card-like");
    });

    it("should return gem preset for type 'gem'", () => {
      const preset = getPreset("gem");
      expect(preset).toBeDefined();
      expect(preset?.type).toBe("gem");
      expect(preset?.label).toBe("Gem-like");
    });

    it("should return weapon preset for type 'weapon'", () => {
      const preset = getPreset("weapon");
      expect(preset).toBeDefined();
      expect(preset?.type).toBe("weapon");
      expect(preset?.label).toBe("Weapon-like");
    });

    it("should return undefined for type 'none'", () => {
      const preset = getPreset("none");
      expect(preset).toBeUndefined();
    });
  });

  describe("applyPreset", () => {
    it("should return fields with new unique IDs for card preset", () => {
      const fields = applyPreset("card");
      expect(fields.length).toBe(cardPreset.fields.length);
      fields.forEach((field) => {
        expect(field.id).toMatch(/^preset-card-\d+-\d+$/);
      });
    });

    it("should return fields with new unique IDs for gem preset", () => {
      const fields = applyPreset("gem");
      expect(fields.length).toBe(gemPreset.fields.length);
      fields.forEach((field) => {
        expect(field.id).toMatch(/^preset-gem-\d+-\d+$/);
      });
    });

    it("should return fields with new unique IDs for weapon preset", () => {
      const fields = applyPreset("weapon");
      expect(fields.length).toBe(weaponPreset.fields.length);
      fields.forEach((field) => {
        expect(field.id).toMatch(/^preset-weapon-\d+-\d+$/);
      });
    });

    it("should return empty array for type 'none'", () => {
      const fields = applyPreset("none");
      expect(fields).toEqual([]);
    });

    it("should create independent field copies (not references)", () => {
      const fields = applyPreset("card");
      // Verify fields are copies, not references to original preset fields
      expect(fields[0].id).not.toBe(cardPreset.fields[0].id);
      // Verify options are also copied
      const hpField = fields.find((f) => f.key === "hp");
      const originalHpField = cardPreset.fields.find((f) => f.key === "hp");
      expect(hpField?.options).not.toBe(originalHpField?.options);
    });
  });

  describe("getPresetOptions", () => {
    it("should return 4 options including 'none'", () => {
      const options = getPresetOptions();
      expect(options).toHaveLength(4);
    });

    it("should have 'none' as first option", () => {
      const options = getPresetOptions();
      expect(options[0].type).toBe("none");
      expect(options[0].label).toBe("None");
    });

    it("should include all preset types", () => {
      const options = getPresetOptions();
      const types = options.map((o) => o.type);
      expect(types).toContain("none");
      expect(types).toContain("card");
      expect(types).toContain("gem");
      expect(types).toContain("weapon");
    });
  });
});
