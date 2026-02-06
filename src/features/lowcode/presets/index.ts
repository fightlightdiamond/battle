import type { FieldDefinition } from "../types/entityDefinition";
import type { PresetDefinition, PresetType } from "../types/presets";
import { cardPreset } from "./cardPreset";
import { gemPreset } from "./gemPreset";
import { weaponPreset } from "./weaponPreset";

/**
 * Registry of all available presets
 */
const presetRegistry: Map<PresetType, PresetDefinition> = new Map([
  ["card", cardPreset],
  ["gem", gemPreset],
  ["weapon", weaponPreset],
]);

/**
 * Get all available presets
 * @returns Array of all preset definitions
 */
export function getPresets(): PresetDefinition[] {
  return Array.from(presetRegistry.values());
}

/**
 * Get a specific preset by type
 * @param type - The preset type to retrieve
 * @returns The preset definition or undefined if not found
 */
export function getPreset(type: PresetType): PresetDefinition | undefined {
  if (type === "none") {
    return undefined;
  }
  return presetRegistry.get(type);
}

/**
 * Apply preset and return a copy of its fields with new unique IDs
 * This ensures each application creates independent field instances
 * @param type - The preset type to apply
 * @returns Array of field definitions with new IDs, or empty array if preset not found
 */
export function applyPreset(type: PresetType): FieldDefinition[] {
  const preset = getPreset(type);
  if (!preset) {
    return [];
  }

  // Create deep copy of fields with new unique IDs
  return preset.fields.map((field, index) => ({
    ...field,
    id: `preset-${type}-${index}-${Date.now()}`,
    options: field.options ? { ...field.options } : undefined,
  }));
}

/**
 * Get preset options for UI display (including "None" option)
 * @returns Array of preset options with type, label, and description
 */
export function getPresetOptions(): Array<{
  type: PresetType;
  label: string;
  description: string;
}> {
  return [
    { type: "none", label: "None", description: "Start with empty fields" },
    ...getPresets().map((preset) => ({
      type: preset.type,
      label: preset.label,
      description: preset.description,
    })),
  ];
}

// Re-export presets for direct access if needed
export { cardPreset } from "./cardPreset";
export { gemPreset } from "./gemPreset";
export { weaponPreset } from "./weaponPreset";
