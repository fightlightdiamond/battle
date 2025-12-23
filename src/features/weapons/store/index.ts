// Store types (separated from implementation)
export type {
  WeaponState,
  WeaponActions,
  WeaponStore,
  EquipmentState,
  EquipmentActions,
  EquipmentStore,
} from "./types";

// Weapon store exports
export {
  useWeaponStore,
  selectWeapons,
  selectSelectedWeapon,
  selectTotal,
  selectIsLoading as selectWeaponIsLoading,
  selectIsCreating,
  selectIsUpdating,
  selectIsDeleting,
  selectError as selectWeaponError,
  selectIsAnyLoading as selectWeaponIsAnyLoading,
} from "./weaponStore";

// Equipment store exports
export {
  useEquipmentStore,
  selectCardEquipments,
  selectCardEquipment,
  selectIsLoading as selectEquipmentIsLoading,
  selectIsEquipping,
  selectIsUnequipping,
  selectError as selectEquipmentError,
  selectIsAnyLoading as selectEquipmentIsAnyLoading,
} from "./equipmentStore";
