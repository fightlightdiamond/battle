import { z } from "zod";
import type {
  EntityDefinition,
  FieldDefinition,
  FieldType,
} from "../types/entityDefinition";

/**
 * Maps FieldType to TypeScript type string
 */
function fieldTypeToTypeScript(type: FieldType): string {
  const typeMap: Record<FieldType, string> = {
    text: "string",
    number: "number",
    select: "string",
    boolean: "boolean",
  };
  return typeMap[type];
}

/**
 * Generates TypeScript interface code from an EntityDefinition
 */
export function generateInterface(entity: EntityDefinition): string {
  if (!entity.name || entity.fields.length === 0) {
    return `export interface ${entity.name || "Entity"} {\n}`;
  }

  const fieldLines = entity.fields.map((field) => {
    const tsType = fieldTypeToTypeScript(field.type);
    const optional = field.required ? "" : "?";
    return `  ${field.key}${optional}: ${tsType};`;
  });

  return `export interface ${entity.name} {\n${fieldLines.join("\n")}\n}`;
}

/**
 * Generates Zod schema code string from an EntityDefinition
 */
export function generateZodSchema(entity: EntityDefinition): string {
  const schemaName = entity.name
    ? entity.name.charAt(0).toLowerCase() + entity.name.slice(1)
    : "entity";

  if (!entity.name || entity.fields.length === 0) {
    return `export const ${schemaName}Schema = z.object({});`;
  }

  const fieldLines = entity.fields.map((field) => {
    const zodType = fieldToZodString(field);
    return `  ${field.key}: ${zodType},`;
  });

  return `export const ${schemaName}Schema = z.object({\n${fieldLines.join("\n")}\n});`;
}

/**
 * Converts a FieldDefinition to its Zod schema string representation
 */
function fieldToZodString(field: FieldDefinition): string {
  let zodStr: string;

  switch (field.type) {
    case "text": {
      zodStr = "z.string()";
      if (field.options?.minLength !== undefined) {
        zodStr += `.min(${field.options.minLength})`;
      }
      if (field.options?.maxLength !== undefined) {
        zodStr += `.max(${field.options.maxLength})`;
      }
      break;
    }
    case "number": {
      zodStr = "z.number()";
      if (field.options?.min !== undefined) {
        zodStr += `.min(${field.options.min})`;
      }
      if (field.options?.max !== undefined) {
        zodStr += `.max(${field.options.max})`;
      }
      break;
    }
    case "select": {
      const choices = field.options?.choices || [];
      if (choices.length > 0) {
        const values = choices.map((c) => `"${c.value}"`).join(", ");
        zodStr = `z.enum([${values}])`;
      } else {
        zodStr = "z.string()";
      }
      break;
    }
    case "boolean": {
      zodStr = "z.boolean()";
      break;
    }
    default:
      zodStr = "z.unknown()";
  }

  if (!field.required) {
    zodStr += ".optional()";
  }

  return zodStr;
}

/**
 * Creates a runtime Zod schema object from an EntityDefinition
 * This can be used for actual form validation
 */
export function createRuntimeSchema(
  entity: EntityDefinition,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const field of entity.fields) {
    shape[field.key] = fieldToZodType(field);
  }

  return z.object(shape);
}

/**
 * Converts a FieldDefinition to an actual Zod type
 */
function fieldToZodType(field: FieldDefinition): z.ZodTypeAny {
  let zodType: z.ZodTypeAny;

  switch (field.type) {
    case "text": {
      let strSchema = z.string();
      if (field.options?.minLength !== undefined) {
        strSchema = strSchema.min(field.options.minLength);
      }
      if (field.options?.maxLength !== undefined) {
        strSchema = strSchema.max(field.options.maxLength);
      }
      zodType = strSchema;
      break;
    }
    case "number": {
      let numSchema = z.number();
      if (field.options?.min !== undefined) {
        numSchema = numSchema.min(field.options.min);
      }
      if (field.options?.max !== undefined) {
        numSchema = numSchema.max(field.options.max);
      }
      zodType = numSchema;
      break;
    }
    case "select": {
      const choices = field.options?.choices || [];
      if (choices.length > 0) {
        const values = choices.map((c) => c.value) as [string, ...string[]];
        zodType = z.enum(values);
      } else {
        zodType = z.string();
      }
      break;
    }
    case "boolean": {
      zodType = z.boolean();
      break;
    }
    default:
      zodType = z.unknown();
  }

  if (!field.required) {
    zodType = zodType.optional();
  }

  return zodType;
}
