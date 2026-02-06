import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  EntityDefinition,
  FieldDefinition,
} from "../types/entityDefinition";
import type { PresetType } from "../types/presets";
import {
  saveEntity as persistEntity,
  loadEntity as loadPersistedEntity,
  deleteEntity as deletePersistedEntity,
  listEntities,
} from "../services/entityStorage";
import { applyPreset as applyPresetFields, getPreset } from "../presets";

/**
 * Creates a new empty entity definition
 */
function createEmptyEntity(): EntityDefinition {
  return {
    id: crypto.randomUUID(),
    name: "",
    fields: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Creates a new empty field definition
 */
function createEmptyField(): FieldDefinition {
  return {
    id: crypto.randomUUID(),
    key: "",
    label: "",
    type: "text",
    required: false,
  };
}

interface EntityState {
  currentEntity: EntityDefinition;
  currentPreset: PresetType;
  savedEntities: EntityDefinition[];
  isLoading: boolean;
  error: string | null;
}

interface EntityActions {
  // Entity name actions
  setEntityName: (name: string) => void;

  // Field actions
  addField: () => void;
  updateField: (fieldId: string, updates: Partial<FieldDefinition>) => void;
  removeField: (fieldId: string) => void;

  // Preset actions
  applyPreset: (type: PresetType) => void;
  clearPreset: () => void;

  // Persistence actions
  saveEntity: () => void;
  loadEntity: (entityId: string) => void;
  deleteEntity: (entityId: string) => void;
  loadSavedEntities: () => void;

  // Reset actions
  resetCurrentEntity: () => void;
  setError: (error: string | null) => void;
}

export type EntityStore = EntityState & EntityActions;

const initialState: EntityState = {
  currentEntity: createEmptyEntity(),
  currentPreset: "none",
  savedEntities: [],
  isLoading: false,
  error: null,
};

/**
 * Zustand store for entity definition management
 * Manages current entity being edited and list of saved entities
 */
export const useEntityStore = create<EntityStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Set entity name
      setEntityName: (name: string) =>
        set(
          (state) => ({
            currentEntity: {
              ...state.currentEntity,
              name,
              updatedAt: Date.now(),
            },
          }),
          false,
          "setEntityName",
        ),

      // Add a new empty field
      addField: () =>
        set(
          (state) => ({
            currentEntity: {
              ...state.currentEntity,
              fields: [...state.currentEntity.fields, createEmptyField()],
              updatedAt: Date.now(),
            },
          }),
          false,
          "addField",
        ),

      // Update an existing field
      updateField: (fieldId: string, updates: Partial<FieldDefinition>) =>
        set(
          (state) => ({
            currentEntity: {
              ...state.currentEntity,
              fields: state.currentEntity.fields.map((field) =>
                field.id === fieldId ? { ...field, ...updates } : field,
              ),
              updatedAt: Date.now(),
            },
          }),
          false,
          "updateField",
        ),

      // Remove a field
      removeField: (fieldId: string) =>
        set(
          (state) => ({
            currentEntity: {
              ...state.currentEntity,
              fields: state.currentEntity.fields.filter(
                (field) => field.id !== fieldId,
              ),
              updatedAt: Date.now(),
            },
          }),
          false,
          "removeField",
        ),

      // Apply a preset to the current entity
      applyPreset: (type: PresetType) => {
        const preset = getPreset(type);
        const fields = applyPresetFields(type);

        set(
          (state) => ({
            currentPreset: type,
            currentEntity: {
              ...state.currentEntity,
              // Use preset's default name if current name is empty
              name: state.currentEntity.name || preset?.defaultEntityName || "",
              fields,
              updatedAt: Date.now(),
            },
            error: null,
          }),
          false,
          "applyPreset",
        );
      },

      // Clear the current preset and reset fields
      clearPreset: () =>
        set(
          (state) => ({
            currentPreset: "none",
            currentEntity: {
              ...state.currentEntity,
              fields: [],
              updatedAt: Date.now(),
            },
            error: null,
          }),
          false,
          "clearPreset",
        ),

      // Save current entity to localStorage
      saveEntity: () => {
        const { currentEntity } = get();
        try {
          const savedEntity = persistEntity(currentEntity);
          set(
            (state) => {
              const existingIndex = state.savedEntities.findIndex(
                (e) => e.id === savedEntity.id,
              );
              const newSavedEntities =
                existingIndex >= 0
                  ? state.savedEntities.map((e, i) =>
                      i === existingIndex ? savedEntity : e,
                    )
                  : [...state.savedEntities, savedEntity];

              return {
                currentEntity: savedEntity,
                savedEntities: newSavedEntities,
                error: null,
              };
            },
            false,
            "saveEntity",
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to save entity",
            },
            false,
            "saveEntityError",
          );
        }
      },

      // Load an entity from localStorage
      loadEntity: (entityId: string) => {
        try {
          const entity = loadPersistedEntity(entityId);
          if (entity) {
            set(
              {
                currentEntity: entity,
                error: null,
              },
              false,
              "loadEntity",
            );
          } else {
            set({ error: "Entity not found" }, false, "loadEntityError");
          }
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load entity",
            },
            false,
            "loadEntityError",
          );
        }
      },

      // Delete an entity from localStorage
      deleteEntity: (entityId: string) => {
        try {
          deletePersistedEntity(entityId);
          set(
            (state) => ({
              savedEntities: state.savedEntities.filter(
                (e) => e.id !== entityId,
              ),
              // Reset current entity if it was the deleted one
              currentEntity:
                state.currentEntity.id === entityId
                  ? createEmptyEntity()
                  : state.currentEntity,
              error: null,
            }),
            false,
            "deleteEntity",
          );
        } catch (error) {
          set(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to delete entity",
            },
            false,
            "deleteEntityError",
          );
        }
      },

      // Load all saved entities from localStorage
      loadSavedEntities: () => {
        set({ isLoading: true }, false, "loadSavedEntitiesStart");
        try {
          const entities = listEntities();
          set(
            {
              savedEntities: entities,
              isLoading: false,
              error: null,
            },
            false,
            "loadSavedEntities",
          );
        } catch (error) {
          set(
            {
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : "Failed to load entities",
            },
            false,
            "loadSavedEntitiesError",
          );
        }
      },

      // Reset current entity to empty state and clear preset
      resetCurrentEntity: () =>
        set(
          {
            currentEntity: createEmptyEntity(),
            currentPreset: "none",
            error: null,
          },
          false,
          "resetCurrentEntity",
        ),

      // Set error message
      setError: (error: string | null) => set({ error }, false, "setError"),
    }),
    { name: "entity-store" },
  ),
);

// Selectors for optimized re-renders
export const selectCurrentEntity = (state: EntityStore) => state.currentEntity;
export const selectCurrentPreset = (state: EntityStore) => state.currentPreset;
export const selectSavedEntities = (state: EntityStore) => state.savedEntities;
export const selectIsLoading = (state: EntityStore) => state.isLoading;
export const selectError = (state: EntityStore) => state.error;
export const selectFields = (state: EntityStore) => state.currentEntity.fields;
export const selectEntityName = (state: EntityStore) =>
  state.currentEntity.name;
