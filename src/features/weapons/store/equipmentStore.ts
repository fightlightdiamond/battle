import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { CardEquipment } from "../types/equipment";
import type { EquipmentState, EquipmentActions, EquipmentStore } from "./types";

// Re-export types for convenience
export type { EquipmentState, EquipmentActions, EquipmentStore };

const initialState: EquipmentState = {
  cardEquipments: new Map(),
  isLoading: false,
  isEquipping: false,
  isUnequipping: false,
  error: null,
};

/**
 * Zustand store for Equipment state management
 * Manages card-weapon equipment relationships, loading states, and errors
 *
 * Requirements: 3.2, 3.4
 */
export const useEquipmentStore = create<EquipmentStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // Equipment operations
      setEquipment: (cardId: string, equipment: CardEquipment) =>
        set(
          (state) => {
            const newMap = new Map(state.cardEquipments);
            newMap.set(cardId, equipment);
            return { cardEquipments: newMap, error: null };
          },
          false,
          "setEquipment",
        ),

      setMultipleEquipments: (equipments: CardEquipment[]) =>
        set(
          (state) => {
            const newMap = new Map(state.cardEquipments);
            equipments.forEach((eq) => newMap.set(eq.cardId, eq));
            return { cardEquipments: newMap, error: null };
          },
          false,
          "setMultipleEquipments",
        ),

      equipWeapon: (cardId: string, weaponId: string) =>
        set(
          (state) => {
            const newMap = new Map(state.cardEquipments);

            // Find and unequip from previous card if weapon is already equipped
            for (const [existingCardId, eq] of newMap.entries()) {
              if (eq.weaponId === weaponId && existingCardId !== cardId) {
                newMap.set(existingCardId, {
                  cardId: existingCardId,
                  weaponId: null,
                  equippedAt: null,
                });
              }
            }

            // Equip to new card
            newMap.set(cardId, {
              cardId,
              weaponId,
              equippedAt: Date.now(),
            });

            return { cardEquipments: newMap, error: null };
          },
          false,
          "equipWeapon",
        ),

      unequipWeapon: (cardId: string) =>
        set(
          (state) => {
            const newMap = new Map(state.cardEquipments);
            newMap.set(cardId, {
              cardId,
              weaponId: null,
              equippedAt: null,
            });
            return { cardEquipments: newMap, error: null };
          },
          false,
          "unequipWeapon",
        ),

      removeEquipment: (cardId: string) =>
        set(
          (state) => {
            const newMap = new Map(state.cardEquipments);
            newMap.delete(cardId);
            return { cardEquipments: newMap, error: null };
          },
          false,
          "removeEquipment",
        ),

      // Loading states
      setLoading: (isLoading: boolean) =>
        set({ isLoading }, false, "setLoading"),

      setEquipping: (isEquipping: boolean) =>
        set({ isEquipping }, false, "setEquipping"),

      setUnequipping: (isUnequipping: boolean) =>
        set({ isUnequipping }, false, "setUnequipping"),

      // Error handling
      setError: (error: string | null) => set({ error }, false, "setError"),

      clearError: () => set({ error: null }, false, "clearError"),

      // Reset
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "equipment-store" },
  ),
);

// Selectors for optimized re-renders
export const selectCardEquipments = (state: EquipmentStore) =>
  state.cardEquipments;
export const selectCardEquipment =
  (cardId: string) => (state: EquipmentStore) =>
    state.cardEquipments.get(cardId) ?? null;
export const selectIsLoading = (state: EquipmentStore) => state.isLoading;
export const selectIsEquipping = (state: EquipmentStore) => state.isEquipping;
export const selectIsUnequipping = (state: EquipmentStore) =>
  state.isUnequipping;
export const selectError = (state: EquipmentStore) => state.error;
export const selectIsAnyLoading = (state: EquipmentStore) =>
  state.isLoading || state.isEquipping || state.isUnequipping;
