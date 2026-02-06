import { describe, it, expect, beforeEach } from "vitest";
import { useEntityStore } from "./entityStore";
import { cardPreset } from "../presets/cardPreset";
import { gemPreset } from "../presets/gemPreset";
import { weaponPreset } from "../presets/weaponPreset";

describe("entityStore preset actions", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useEntityStore.setState({
      currentEntity: {
        id: "test-id",
        name: "",
        fields: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      currentPreset: "none",
      savedEntities: [],
      isLoading: false,
      error: null,
    });
  });

  describe("applyPreset", () => {
    it("should set currentPreset to the applied preset type", () => {
      const { applyPreset } = useEntityStore.getState();

      applyPreset("card");

      const state = useEntityStore.getState();
      expect(state.currentPreset).toBe("card");
    });

    it("should populate fields from card preset", () => {
      const { applyPreset } = useEntityStore.getState();

      applyPreset("card");

      const state = useEntityStore.getState();
      expect(state.currentEntity.fields.length).toBe(cardPreset.fields.length);
      const fieldKeys = state.currentEntity.fields.map((f) => f.key);
      expect(fieldKeys).toContain("name");
      expect(fieldKeys).toContain("hp");
      expect(fieldKeys).toContain("atk");
      expect(fieldKeys).toContain("def");
    });

    it("should populate fields from gem preset", () => {
      const { applyPreset } = useEntityStore.getState();

      applyPreset("gem");

      const state = useEntityStore.getState();
      expect(state.currentEntity.fields.length).toBe(gemPreset.fields.length);
      const fieldKeys = state.currentEntity.fields.map((f) => f.key);
      expect(fieldKeys).toContain("skillType");
      expect(fieldKeys).toContain("trigger");
      expect(fieldKeys).toContain("tier");
    });

    it("should populate fields from weapon preset", () => {
      const { applyPreset } = useEntityStore.getState();

      applyPreset("weapon");

      const state = useEntityStore.getState();
      expect(state.currentEntity.fields.length).toBe(
        weaponPreset.fields.length,
      );
      const fieldKeys = state.currentEntity.fields.map((f) => f.key);
      expect(fieldKeys).toContain("attackRange");
      expect(fieldKeys).toContain("critChance");
    });

    it("should set default entity name from preset when name is empty", () => {
      const { applyPreset } = useEntityStore.getState();

      applyPreset("card");

      const state = useEntityStore.getState();
      expect(state.currentEntity.name).toBe("BattleUnit");
    });

    it("should preserve existing entity name when not empty", () => {
      useEntityStore.setState((state) => ({
        currentEntity: { ...state.currentEntity, name: "MyCustomEntity" },
      }));

      const { applyPreset } = useEntityStore.getState();
      applyPreset("card");

      const state = useEntityStore.getState();
      expect(state.currentEntity.name).toBe("MyCustomEntity");
    });

    it("should clear error when applying preset", () => {
      useEntityStore.setState({ error: "Some previous error" });

      const { applyPreset } = useEntityStore.getState();
      applyPreset("card");

      const state = useEntityStore.getState();
      expect(state.error).toBeNull();
    });

    it("should update updatedAt timestamp", () => {
      const initialUpdatedAt =
        useEntityStore.getState().currentEntity.updatedAt;

      // Small delay to ensure timestamp difference
      const { applyPreset } = useEntityStore.getState();
      applyPreset("card");

      const state = useEntityStore.getState();
      expect(state.currentEntity.updatedAt).toBeGreaterThanOrEqual(
        initialUpdatedAt,
      );
    });

    it("should return empty fields for 'none' preset type", () => {
      // First apply a preset
      const { applyPreset } = useEntityStore.getState();
      applyPreset("card");

      // Then apply 'none'
      applyPreset("none");

      const state = useEntityStore.getState();
      expect(state.currentEntity.fields).toEqual([]);
      expect(state.currentPreset).toBe("none");
    });
  });

  describe("clearPreset", () => {
    it("should reset currentPreset to 'none'", () => {
      const { applyPreset, clearPreset } = useEntityStore.getState();

      applyPreset("card");
      clearPreset();

      const state = useEntityStore.getState();
      expect(state.currentPreset).toBe("none");
    });

    it("should clear all fields", () => {
      const { applyPreset, clearPreset } = useEntityStore.getState();

      applyPreset("card");
      expect(
        useEntityStore.getState().currentEntity.fields.length,
      ).toBeGreaterThan(0);

      clearPreset();

      const state = useEntityStore.getState();
      expect(state.currentEntity.fields).toEqual([]);
    });

    it("should preserve entity name when clearing preset", () => {
      useEntityStore.setState((state) => ({
        currentEntity: { ...state.currentEntity, name: "MyEntity" },
      }));

      const { applyPreset, clearPreset } = useEntityStore.getState();
      applyPreset("card");
      clearPreset();

      const state = useEntityStore.getState();
      expect(state.currentEntity.name).toBe("MyEntity");
    });

    it("should clear error when clearing preset", () => {
      useEntityStore.setState({ error: "Some error" });

      const { clearPreset } = useEntityStore.getState();
      clearPreset();

      const state = useEntityStore.getState();
      expect(state.error).toBeNull();
    });

    it("should update updatedAt timestamp", () => {
      const { applyPreset, clearPreset } = useEntityStore.getState();
      applyPreset("card");

      const beforeClear = useEntityStore.getState().currentEntity.updatedAt;
      clearPreset();

      const state = useEntityStore.getState();
      expect(state.currentEntity.updatedAt).toBeGreaterThanOrEqual(beforeClear);
    });
  });

  describe("resetCurrentEntity", () => {
    it("should reset currentPreset to 'none'", () => {
      const { applyPreset, resetCurrentEntity } = useEntityStore.getState();

      applyPreset("card");
      resetCurrentEntity();

      const state = useEntityStore.getState();
      expect(state.currentPreset).toBe("none");
    });

    it("should reset entity to empty state", () => {
      const { applyPreset, setEntityName, resetCurrentEntity } =
        useEntityStore.getState();

      applyPreset("card");
      setEntityName("TestEntity");
      resetCurrentEntity();

      const state = useEntityStore.getState();
      expect(state.currentEntity.name).toBe("");
      expect(state.currentEntity.fields).toEqual([]);
    });

    it("should clear error when resetting", () => {
      useEntityStore.setState({ error: "Some error" });

      const { resetCurrentEntity } = useEntityStore.getState();
      resetCurrentEntity();

      const state = useEntityStore.getState();
      expect(state.error).toBeNull();
    });

    it("should create new entity ID", () => {
      const initialId = useEntityStore.getState().currentEntity.id;

      const { resetCurrentEntity } = useEntityStore.getState();
      resetCurrentEntity();

      const state = useEntityStore.getState();
      expect(state.currentEntity.id).not.toBe(initialId);
    });
  });
});
