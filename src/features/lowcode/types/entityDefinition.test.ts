import { describe, it, expect } from "vitest";
import { isValidFieldKey, isValidEntityName } from "./entityDefinition";

describe("isValidFieldKey", () => {
  it("should return true for valid camelCase keys", () => {
    expect(isValidFieldKey("name")).toBe(true);
    expect(isValidFieldKey("firstName")).toBe(true);
    expect(isValidFieldKey("userAge")).toBe(true);
    expect(isValidFieldKey("item123")).toBe(true);
  });

  it("should return false for keys starting with uppercase", () => {
    expect(isValidFieldKey("Name")).toBe(false);
    expect(isValidFieldKey("FirstName")).toBe(false);
  });

  it("should return false for keys with spaces or special characters", () => {
    expect(isValidFieldKey("first name")).toBe(false);
    expect(isValidFieldKey("first-name")).toBe(false);
    expect(isValidFieldKey("first_name")).toBe(false);
    expect(isValidFieldKey("name!")).toBe(false);
  });

  it("should return false for empty or invalid inputs", () => {
    expect(isValidFieldKey("")).toBe(false);
    expect(isValidFieldKey(null as unknown as string)).toBe(false);
    expect(isValidFieldKey(undefined as unknown as string)).toBe(false);
    expect(isValidFieldKey(123 as unknown as string)).toBe(false);
  });

  it("should return false for keys starting with numbers", () => {
    expect(isValidFieldKey("123name")).toBe(false);
    expect(isValidFieldKey("1stName")).toBe(false);
  });
});

describe("isValidEntityName", () => {
  it("should return true for valid PascalCase names", () => {
    expect(isValidEntityName("User")).toBe(true);
    expect(isValidEntityName("UserProfile")).toBe(true);
    expect(isValidEntityName("Item123")).toBe(true);
  });

  it("should return false for names starting with lowercase", () => {
    expect(isValidEntityName("user")).toBe(false);
    expect(isValidEntityName("userProfile")).toBe(false);
  });

  it("should return false for names with spaces or special characters", () => {
    expect(isValidEntityName("User Profile")).toBe(false);
    expect(isValidEntityName("User-Profile")).toBe(false);
    expect(isValidEntityName("User_Profile")).toBe(false);
    expect(isValidEntityName("User!")).toBe(false);
  });

  it("should return false for empty or invalid inputs", () => {
    expect(isValidEntityName("")).toBe(false);
    expect(isValidEntityName(null as unknown as string)).toBe(false);
    expect(isValidEntityName(undefined as unknown as string)).toBe(false);
    expect(isValidEntityName(123 as unknown as string)).toBe(false);
  });

  it("should return false for names starting with numbers", () => {
    expect(isValidEntityName("123User")).toBe(false);
    expect(isValidEntityName("1stUser")).toBe(false);
  });
});
