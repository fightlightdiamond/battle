import { describe, it, expect } from "vitest";
import {
  generateInterface,
  generateZodSchema,
  createRuntimeSchema,
} from "./codeGenerator";
import type { EntityDefinition } from "../types/entityDefinition";

const createTestEntity = (
  overrides: Partial<EntityDefinition> = {},
): EntityDefinition => ({
  id: "test-id",
  name: "TestEntity",
  fields: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides,
});

describe("generateInterface", () => {
  it("should generate empty interface for entity with no fields", () => {
    const entity = createTestEntity({ name: "User", fields: [] });
    const result = generateInterface(entity);
    expect(result).toBe("export interface User {\n}");
  });

  it("should generate interface with text field", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        { id: "1", key: "name", label: "Name", type: "text", required: true },
      ],
    });
    const result = generateInterface(entity);
    expect(result).toContain("export interface User");
    expect(result).toContain("name: string;");
  });

  it("should generate interface with number field", () => {
    const entity = createTestEntity({
      name: "Product",
      fields: [
        {
          id: "1",
          key: "price",
          label: "Price",
          type: "number",
          required: true,
        },
      ],
    });
    const result = generateInterface(entity);
    expect(result).toContain("price: number;");
  });

  it("should generate interface with boolean field", () => {
    const entity = createTestEntity({
      name: "Task",
      fields: [
        {
          id: "1",
          key: "completed",
          label: "Completed",
          type: "boolean",
          required: true,
        },
      ],
    });
    const result = generateInterface(entity);
    expect(result).toContain("completed: boolean;");
  });

  it("should generate interface with select field as string", () => {
    const entity = createTestEntity({
      name: "Order",
      fields: [
        {
          id: "1",
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          options: {
            choices: [
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ],
          },
        },
      ],
    });
    const result = generateInterface(entity);
    expect(result).toContain("status: string;");
  });

  it("should mark optional fields with ?", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        {
          id: "1",
          key: "nickname",
          label: "Nickname",
          type: "text",
          required: false,
        },
      ],
    });
    const result = generateInterface(entity);
    expect(result).toContain("nickname?: string;");
  });

  it("should generate interface with multiple fields", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        { id: "1", key: "name", label: "Name", type: "text", required: true },
        { id: "2", key: "age", label: "Age", type: "number", required: false },
        {
          id: "3",
          key: "active",
          label: "Active",
          type: "boolean",
          required: true,
        },
      ],
    });
    const result = generateInterface(entity);
    expect(result).toContain("name: string;");
    expect(result).toContain("age?: number;");
    expect(result).toContain("active: boolean;");
  });
});

describe("generateZodSchema", () => {
  it("should generate empty schema for entity with no fields", () => {
    const entity = createTestEntity({ name: "User", fields: [] });
    const result = generateZodSchema(entity);
    expect(result).toBe("export const userSchema = z.object({});");
  });

  it("should generate schema with text field", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        { id: "1", key: "name", label: "Name", type: "text", required: true },
      ],
    });
    const result = generateZodSchema(entity);
    expect(result).toContain("name: z.string(),");
  });

  it("should generate schema with text field constraints", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        {
          id: "1",
          key: "name",
          label: "Name",
          type: "text",
          required: true,
          options: { minLength: 2, maxLength: 50 },
        },
      ],
    });
    const result = generateZodSchema(entity);
    expect(result).toContain("z.string().min(2).max(50)");
  });

  it("should generate schema with number field constraints", () => {
    const entity = createTestEntity({
      name: "Product",
      fields: [
        {
          id: "1",
          key: "price",
          label: "Price",
          type: "number",
          required: true,
          options: { min: 0, max: 1000 },
        },
      ],
    });
    const result = generateZodSchema(entity);
    expect(result).toContain("z.number().min(0).max(1000)");
  });

  it("should generate schema with select field as enum", () => {
    const entity = createTestEntity({
      name: "Order",
      fields: [
        {
          id: "1",
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          options: {
            choices: [
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ],
          },
        },
      ],
    });
    const result = generateZodSchema(entity);
    expect(result).toContain('z.enum(["pending", "completed"])');
  });

  it("should generate schema with optional fields", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        {
          id: "1",
          key: "nickname",
          label: "Nickname",
          type: "text",
          required: false,
        },
      ],
    });
    const result = generateZodSchema(entity);
    expect(result).toContain("z.string().optional()");
  });
});

describe("createRuntimeSchema", () => {
  it("should create schema that validates correct data", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        { id: "1", key: "name", label: "Name", type: "text", required: true },
        { id: "2", key: "age", label: "Age", type: "number", required: true },
      ],
    });
    const schema = createRuntimeSchema(entity);
    const result = schema.safeParse({ name: "John", age: 30 });
    expect(result.success).toBe(true);
  });

  it("should reject invalid data", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        { id: "1", key: "name", label: "Name", type: "text", required: true },
      ],
    });
    const schema = createRuntimeSchema(entity);
    const result = schema.safeParse({ name: 123 });
    expect(result.success).toBe(false);
  });

  it("should validate text field constraints", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        {
          id: "1",
          key: "name",
          label: "Name",
          type: "text",
          required: true,
          options: { minLength: 2, maxLength: 10 },
        },
      ],
    });
    const schema = createRuntimeSchema(entity);

    expect(schema.safeParse({ name: "Jo" }).success).toBe(true);
    expect(schema.safeParse({ name: "J" }).success).toBe(false);
    expect(schema.safeParse({ name: "JohnJohnJohn" }).success).toBe(false);
  });

  it("should validate number field constraints", () => {
    const entity = createTestEntity({
      name: "Product",
      fields: [
        {
          id: "1",
          key: "price",
          label: "Price",
          type: "number",
          required: true,
          options: { min: 0, max: 100 },
        },
      ],
    });
    const schema = createRuntimeSchema(entity);

    expect(schema.safeParse({ price: 50 }).success).toBe(true);
    expect(schema.safeParse({ price: -1 }).success).toBe(false);
    expect(schema.safeParse({ price: 101 }).success).toBe(false);
  });

  it("should validate select field with enum", () => {
    const entity = createTestEntity({
      name: "Order",
      fields: [
        {
          id: "1",
          key: "status",
          label: "Status",
          type: "select",
          required: true,
          options: {
            choices: [
              { value: "pending", label: "Pending" },
              { value: "completed", label: "Completed" },
            ],
          },
        },
      ],
    });
    const schema = createRuntimeSchema(entity);

    expect(schema.safeParse({ status: "pending" }).success).toBe(true);
    expect(schema.safeParse({ status: "invalid" }).success).toBe(false);
  });

  it("should allow optional fields to be undefined", () => {
    const entity = createTestEntity({
      name: "User",
      fields: [
        { id: "1", key: "name", label: "Name", type: "text", required: true },
        {
          id: "2",
          key: "nickname",
          label: "Nickname",
          type: "text",
          required: false,
        },
      ],
    });
    const schema = createRuntimeSchema(entity);

    expect(schema.safeParse({ name: "John" }).success).toBe(true);
    expect(schema.safeParse({ name: "John", nickname: "Johnny" }).success).toBe(
      true,
    );
  });
});
