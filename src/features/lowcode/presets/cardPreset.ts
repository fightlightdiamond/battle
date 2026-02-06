import type { PresetDefinition } from "../types/presets";

/**
 * Card-like preset definition
 * Creates an entity with combat stats similar to the Card entity
 * Includes: name, hp, atk, def, spd, critChance, critDamage, armorPen, lifesteal, imagePath
 */
export const cardPreset: PresetDefinition = {
  type: "card",
  label: "Card-like",
  description: "Combat entity with HP, ATK, DEF, SPD and offensive stats",
  defaultEntityName: "BattleUnit",
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
      key: "hp",
      label: "HP",
      type: "number",
      required: true,
      options: { min: 1, max: 99999 },
    },
    {
      id: "f3",
      key: "atk",
      label: "Attack",
      type: "number",
      required: true,
      options: { min: 0, max: 9999 },
    },
    {
      id: "f4",
      key: "def",
      label: "Defense",
      type: "number",
      required: true,
      options: { min: 0, max: 9999 },
    },
    {
      id: "f5",
      key: "spd",
      label: "Speed",
      type: "number",
      required: true,
      options: { min: 0, max: 9999 },
    },
    {
      id: "f6",
      key: "critChance",
      label: "Crit Chance",
      type: "number",
      required: false,
      options: { min: 0, max: 100 },
    },
    {
      id: "f7",
      key: "critDamage",
      label: "Crit Damage",
      type: "number",
      required: false,
      options: { min: 0, max: 500 },
    },
    {
      id: "f8",
      key: "armorPen",
      label: "Armor Pen",
      type: "number",
      required: false,
      options: { min: 0, max: 100 },
    },
    {
      id: "f9",
      key: "lifesteal",
      label: "Lifesteal",
      type: "number",
      required: false,
      options: { min: 0, max: 100 },
    },
    {
      id: "f10",
      key: "imagePath",
      label: "Image Path",
      type: "text",
      required: false,
    },
  ],
};
