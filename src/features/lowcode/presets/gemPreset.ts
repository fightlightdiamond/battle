import type { PresetDefinition } from "../types/presets";

/**
 * Gem-like preset definition
 * Creates an entity with skill-based properties similar to the Gem entity
 * Includes: name, description, skillType, trigger, activationChance, cooldown, tier
 */
export const gemPreset: PresetDefinition = {
  type: "gem",
  label: "Gem-like",
  description:
    "Skill-based entity with trigger, cooldown and activation chance",
  defaultEntityName: "SkillGem",
  fields: [
    {
      id: "f1",
      key: "name",
      label: "Name",
      type: "text",
      required: true,
    },
    {
      id: "f2",
      key: "description",
      label: "Description",
      type: "text",
      required: false,
    },
    {
      id: "f3",
      key: "skillType",
      label: "Skill Type",
      type: "select",
      required: true,
      options: {
        choices: [
          { value: "knockback", label: "Knockback" },
          { value: "retreat", label: "Retreat" },
          { value: "double_move", label: "Double Move" },
          { value: "double_attack", label: "Double Attack" },
          { value: "execute", label: "Execute" },
          { value: "leap_strike", label: "Leap Strike" },
        ],
      },
    },
    {
      id: "f4",
      key: "trigger",
      label: "Trigger",
      type: "select",
      required: true,
      options: {
        choices: [
          { value: "movement", label: "Movement" },
          { value: "combat", label: "Combat" },
        ],
      },
    },
    {
      id: "f5",
      key: "activationChance",
      label: "Activation Chance",
      type: "number",
      required: true,
      options: { min: 0, max: 100 },
    },
    {
      id: "f6",
      key: "cooldown",
      label: "Cooldown",
      type: "number",
      required: true,
      options: { min: 0, max: 99 },
    },
    {
      id: "f7",
      key: "tier",
      label: "Tier",
      type: "select",
      required: true,
      options: {
        choices: [
          { value: "basic", label: "Basic" },
          { value: "advanced", label: "Advanced" },
          { value: "master", label: "Master" },
          { value: "legendary", label: "Legendary" },
        ],
      },
    },
  ],
};
