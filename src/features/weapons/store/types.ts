import type { Weapon } from "../types/weapon";
import type { CardEquipment } from "../types/equipment";

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

// ============================================
// Equipment Store Types
// ============================================

export interface EquipmentState {
  // Data - Map of cardId to CardEquipment
  cardEquipments: Map<string, CardEquipment>;

  // Loading states
  isLoading: boolean;
  isEquipping: boolean;
  isUnequipping: boolean;

  // Error state
  error: string | null;
}

export interface EquipmentActions {
  // Equipment operations
  setEquipment: (cardId: string, equipment: CardEquipment) => void;
  setMultipleEquipments: (equipments: CardEquipment[]) => void;
  equipWeapon: (cardId: string, weaponId: string) => void;
  unequipWeapon: (cardId: string) => void;
  removeEquipment: (cardId: string) => void;

  // Loading states
  setLoading: (isLoading: boolean) => void;
  setEquipping: (isEquipping: boolean) => void;
  setUnequipping: (isUnequipping: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset
  reset: () => void;
}

export type EquipmentStore = EquipmentState & EquipmentActions;
