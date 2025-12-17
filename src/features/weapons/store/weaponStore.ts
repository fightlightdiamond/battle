import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Weapon } from "../types/weapon";
import type { WeaponStore, WeaponState } from "./types";

const initialState: WeaponState = {
  weapons: [],
  selectedWeapon: null,
  total: 0,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

/**
 * Zustand store for Weapon CRUD state management
 * Manages weapons data, loading states, and errors
 *
 * Requirements: 2.1, 2.2, 2.3
 */
export const useWeaponStore = create<WeaponStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // CRUD operations
      setWeapons: (weapons: Weapon[], total?: number) =>
        set(
          { weapons, total: total ?? weapons.length, error: null },
          false,
          "setWeapons",
        ),

      addWeapon: (weapon: Weapon) =>
        set(
          (state) => ({
            weapons: [weapon, ...state.weapons],
            total: state.total + 1,
            error: null,
          }),
          false,
          "addWeapon",
        ),

      updateWeapon: (id: string, updates: Partial<Weapon>) =>
        set(
          (state) => ({
            weapons: state.weapons.map((weapon) =>
              weapon.id === id ? { ...weapon, ...updates } : weapon,
            ),
            selectedWeapon:
              state.selectedWeapon?.id === id
                ? { ...state.selectedWeapon, ...updates }
                : state.selectedWeapon,
            error: null,
          }),
          false,
          "updateWeapon",
        ),

      removeWeapon: (id: string) =>
        set(
          (state) => ({
            weapons: state.weapons.filter((weapon) => weapon.id !== id),
            total: Math.max(0, state.total - 1),
            selectedWeapon:
              state.selectedWeapon?.id === id ? null : state.selectedWeapon,
            error: null,
          }),
          false,
          "removeWeapon",
        ),

      // Selection
      selectWeapon: (weapon: Weapon | null) =>
        set({ selectedWeapon: weapon }, false, "selectWeapon"),

      // Loading states
      setLoading: (isLoading: boolean) =>
        set({ isLoading }, false, "setLoading"),

      setCreating: (isCreating: boolean) =>
        set({ isCreating }, false, "setCreating"),

      setUpdating: (isUpdating: boolean) =>
        set({ isUpdating }, false, "setUpdating"),

      setDeleting: (isDeleting: boolean) =>
        set({ isDeleting }, false, "setDeleting"),

      // Error handling
      setError: (error: string | null) => set({ error }, false, "setError"),

      clearError: () => set({ error: null }, false, "clearError"),

      // Reset
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "weapon-store" },
  ),
);

// Selectors for optimized re-renders
export const selectWeapons = (state: WeaponStore) => state.weapons;
export const selectSelectedWeapon = (state: WeaponStore) =>
  state.selectedWeapon;
export const selectTotal = (state: WeaponStore) => state.total;
export const selectIsLoading = (state: WeaponStore) => state.isLoading;
export const selectIsCreating = (state: WeaponStore) => state.isCreating;
export const selectIsUpdating = (state: WeaponStore) => state.isUpdating;
export const selectIsDeleting = (state: WeaponStore) => state.isDeleting;
export const selectError = (state: WeaponStore) => state.error;
export const selectIsAnyLoading = (state: WeaponStore) =>
  state.isLoading || state.isCreating || state.isUpdating || state.isDeleting;
