/**
 * Service Generator for Low-Code Builder V2
 * Generates service file with CRUD operations from EntityDefinition
 *
 * Requirements: 3.1, 3.2, 3.3
 */

import type { EntityDefinition } from "../types/entityDefinition";

/**
 * Converts entity name to lowercase for variable names
 */
function toLowerCamelCase(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * Generates service file with CRUD operations
 * - getAll: Get all items from localStorage
 * - getById: Get single item by ID
 * - create: Create new item with generated ID
 * - update: Update existing item
 * - delete: Delete item by ID
 *
 * Requirements: 3.1, 3.2, 3.3
 */
export function generateService(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `// Empty entity - no service generated`;
  }

  const entityName = entity.name;
  const entityLower = toLowerCamelCase(entityName);
  const storageKey = `${entityLower}-data`;

  return `/**
 * ${entityName} Service
 * CRUD operations with localStorage persistence
 */

import type { ${entityName} } from "../types/${entityLower}";

const STORAGE_KEY = "${storageKey}";

/**
 * Get all ${entityLower}s from localStorage
 */
export function getAll${entityName}s(): ${entityName}[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

/**
 * Get a single ${entityLower} by ID
 */
export function get${entityName}ById(id: string): ${entityName} | undefined {
  return getAll${entityName}s().find((item) => item.id === id);
}

/**
 * Create a new ${entityLower}
 */
export function create${entityName}(data: Omit<${entityName}, "id">): ${entityName} {
  const items = getAll${entityName}s();
  const newItem: ${entityName} = { ...data, id: crypto.randomUUID() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...items, newItem]));
  return newItem;
}

/**
 * Update an existing ${entityLower}
 */
export function update${entityName}(id: string, data: Partial<${entityName}>): ${entityName} | undefined {
  const items = getAll${entityName}s();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return undefined;
  items[index] = { ...items[index], ...data };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  return items[index];
}

/**
 * Delete a ${entityLower} by ID
 */
export function delete${entityName}(id: string): boolean {
  const items = getAll${entityName}s();
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}
`;
}
