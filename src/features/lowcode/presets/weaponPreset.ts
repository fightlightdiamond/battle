import type { PresetDefinition } from "../types/presets";

/**
 * Weapon-like preset definition
 * Creates an entity with offensive equipment stats similar to the Weapon entity
 * Includes: name, atk, critChance, critDamage, armorPen, lifesteal, attackRange, imagePath
 */
export const weaponPreset: PresetDefinition = {
  type: "weapon",
  label: "Weapon-like",
  description: "Equipment entity with offensive stats and attack range",
  defaultEntityName: "Equipment",
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
      key: "atk",
      label: "Attack",
      type: "number",
      required: false,
      options: { min: 0, max: 9999 },
    },
    {
      id: "f3",
      key: "critChance",
      label: "Crit Chance",
      type: "number",
      required: false,
      options: { min: 0, max: 100 },
    },
    {
      id: "f4",
      key: "critDamage",
      label: "Crit Damage",
      type: "number",
      required: false,
      options: { min: 0, max: 500 },
    },
    {
      id: "f5",
      key: "armorPen",
      label: "Armor Pen",
      type: "number",
      required: false,
      options: { min: 0, max: 100 },
    },
    {
      id: "f6",
      key: "lifesteal",
      label: "Lifesteal",
      type: "number",
      required: false,
      options: { min: 0, max: 100 },
    },
    {
      id: "f7",
      key: "attackRange",
      label: "Attack Range",
      type: "number",
      required: false,
      options: { min: 0, max: 6 },
    },
    {
      id: "f8",
      key: "imagePath",
      label: "Image Path",
      type: "text",
      required: false,
    },
  ],
};
