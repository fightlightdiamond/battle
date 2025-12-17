import type { Weapon } from "../types/weapon";

// ============================================
// Weapon Store Types
// ============================================

export interface WeaponState {
  // Data
  weapons: Weapon[];
  selectedWeapon: Weapon | null;
  total: number;

  // Loading states
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error state
  error: string | null;
}

export interface WeaponActions {
  // CRUD operations
  setWeapons: (weapons: Weapon[], total?: number) => void;
  addWeapon: (weapon: Weapon) => void;
  updateWeapon: (id: string, updates: Partial<Weapon>) => void;
  removeWeapon: (id: string) => void;

  // Selection
  selectWeapon: (weapon: Weapon | null) => void;

  // Loading states
  setLoading: (isLoading: boolean) => void;
  setCreating: (isCreating: boolean) => void;
  setUpdating: (isUpdating: boolean) => void;
  setDeleting: (isDeleting: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset
  reset: () => void;
}

export type WeaponStore = WeaponState & WeaponActions;
