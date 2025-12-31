/**
 * Field type options for entity fields
 */
export type FieldType = "text" | "number" | "select" | "boolean";

/**
 * Choice option for select fields
 */
export interface SelectChoice {
  value: string;
  label: string;
}

/**
 * Type-specific options for field definitions
 */
export interface FieldOptions {
  // For text fields
  minLength?: number;
  maxLength?: number;
  // For number fields
  min?: number;
  max?: number;
  step?: number;
  // For select fields
  choices?: SelectChoice[];
}

/**
 * Single field definition within an entity
 */
export interface FieldDefinition {
  id: string;
  key: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: FieldOptions;
}

/**
 * Complete entity definition
 */
export interface EntityDefinition {
  id: string;
  name: string;
  fields: FieldDefinition[];
  createdAt: number;
  updatedAt: number;
}

/**
 * Validates if a string is a valid field key (camelCase, no spaces, starts with letter)
 */
export function isValidFieldKey(key: string): boolean {
  if (!key || typeof key !== "string") return false;
  // Must start with lowercase letter, followed by alphanumeric characters
  // Allows camelCase pattern
  const camelCasePattern = /^[a-z][a-zA-Z0-9]*$/;
  return camelCasePattern.test(key);
}

/**
 * Validates if a string is a valid entity name (PascalCase, no spaces, starts with uppercase letter)
 */
export function isValidEntityName(name: string): boolean {
  if (!name || typeof name !== "string") return false;
  // Must start with uppercase letter, followed by alphanumeric characters
  // Allows PascalCase pattern
  const pascalCasePattern = /^[A-Z][a-zA-Z0-9]*$/;
  return pascalCasePattern.test(name);
}
