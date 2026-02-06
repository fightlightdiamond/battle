import type { FieldDefinition } from "./entityDefinition";

/**
 * Available preset types for entity creation
 */
export type PresetType = "none" | "card" | "gem" | "weapon";

/**
 * Preset definition structure containing template information
 * for quickly creating entity definitions
 */
export interface PresetDefinition {
  type: PresetType;
  label: string;
  description: string;
  defaultEntityName: string;
  fields: FieldDefinition[];
}
