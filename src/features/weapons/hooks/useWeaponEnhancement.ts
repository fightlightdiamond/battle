import { useCallback } from "react";
import { useEnhancementStore } from "../store/enhancementStore";
import { MaterialService } from "../services/materialService";
import type { Weapon } from "../types/weapon";

/**
 * Hook for weapon enhancement functionality
 */
export function useWeaponEnhancement() {
  const {
    selectedWeapon,
    preview,
    lastResult,
    isEnhancing,
    error,
    selectWeapon,
    clearSelection,
    enhance,
    refreshPreview,
    clearResult,
  } = useEnhancementStore();

  const materials = MaterialService.getAll();

  const handleSelectWeapon = useCallback(
    (weapon: Weapon) => {
      selectWeapon(weapon);
    },
    [selectWeapon],
  );

  const handleEnhance = useCallback(
    async (useProtection: boolean = false) => {
      return enhance(useProtection);
    },
    [enhance],
  );

  const canEnhance = useCallback(() => {
    if (!preview) return false;
    const { requiredMaterial } = preview;
    return MaterialService.has(
      requiredMaterial.type,
      requiredMaterial.quantity,
    );
  }, [preview]);

  const canUseProtection = useCallback(() => {
    if (!preview) return false;
    return (
      preview.failureResult.canUseProtection &&
      MaterialService.has("protection_scroll", 1)
    );
  }, [preview]);

  return {
    // State
    selectedWeapon,
    preview,
    lastResult,
    isEnhancing,
    error,
    materials,

    // Actions
    selectWeapon: handleSelectWeapon,
    clearSelection,
    enhance: handleEnhance,
    refreshPreview,
    clearResult,

    // Helpers
    canEnhance,
    canUseProtection,
  };
}
