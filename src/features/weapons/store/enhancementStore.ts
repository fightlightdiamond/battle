// ============================================================================
// ENHANCEMENT STORE (Zustand)
// ============================================================================

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { QueryClient } from "@tanstack/react-query";
import type { Weapon } from "../types/weapon";
import type { EnhanceResult, EnhancePreview } from "../types/enhancement";
import { WeaponService } from "../services/weaponService";
import { MaterialService } from "../services/materialService";
import {
  initializeEnhancement,
  getEnhancePreview,
  performEnhancement,
  type EnhanceableWeapon,
} from "../services/enhancementService";
import { getTierForLevel } from "../config/enhanceConfig";
import { weaponKeys } from "../hooks/weaponKeys";

// QueryClient instance for cache invalidation
let queryClient: QueryClient | null = null;

export function setEnhancementQueryClient(client: QueryClient) {
  queryClient = client;
}

interface EnhancementState {
  // Current weapon being enhanced
  selectedWeapon: EnhanceableWeapon | null;
  // Enhancement preview
  preview: EnhancePreview | null;
  // Last enhancement result
  lastResult: EnhanceResult | null;
  // Animation state
  isEnhancing: boolean;
  // Error state
  error: string | null;

  // Actions
  selectWeapon: (weapon: Weapon) => void;
  clearSelection: () => void;
  enhance: (useProtection: boolean) => Promise<EnhanceResult | null>;
  refreshPreview: () => void;
  clearResult: () => void;
}

export const useEnhancementStore = create<EnhancementState>()(
  devtools(
    (set, get) => ({
      selectedWeapon: null,
      preview: null,
      lastResult: null,
      isEnhancing: false,
      error: null,

      selectWeapon: (weapon: Weapon) => {
        const enhanceable = initializeEnhancement(weapon);
        const preview = getEnhancePreview(enhanceable);
        set({
          selectedWeapon: enhanceable,
          preview,
          lastResult: null,
          error: null,
        });
      },

      clearSelection: () => {
        set({
          selectedWeapon: null,
          preview: null,
          lastResult: null,
          error: null,
        });
      },

      enhance: async (useProtection: boolean) => {
        const { selectedWeapon, preview } = get();
        if (!selectedWeapon || !preview) {
          set({ error: "No weapon selected" });
          return null;
        }

        // Check materials
        const { requiredMaterial } = preview;
        if (
          !MaterialService.has(requiredMaterial.type, requiredMaterial.quantity)
        ) {
          set({ error: `Not enough ${requiredMaterial.type}` });
          return null;
        }

        // Check protection scroll if requested
        if (useProtection) {
          const tier = getTierForLevel(selectedWeapon.enhanceLevel);
          if (!tier?.protectionAllowed) {
            set({ error: "Protection not allowed at this level" });
            return null;
          }
          if (!MaterialService.has("protection_scroll", 1)) {
            set({ error: "Not enough protection scrolls" });
            return null;
          }
        }

        set({ isEnhancing: true, error: null });

        try {
          // Perform enhancement
          const result = performEnhancement(selectedWeapon, useProtection);
          if (!result) {
            set({ isEnhancing: false, error: "Enhancement failed" });
            return null;
          }

          // Consume materials
          MaterialService.consume(
            requiredMaterial.type,
            requiredMaterial.quantity,
          );
          if (useProtection && !result.result.success) {
            MaterialService.consume("protection_scroll", 1);
          }

          // Save to database
          await WeaponService.enhance(
            selectedWeapon.id,
            result.weapon.enhanceLevel,
            result.weapon.enhanceHistory[
              result.weapon.enhanceHistory.length - 1
            ],
          );

          // Invalidate weapons cache to refresh list
          if (queryClient) {
            queryClient.invalidateQueries({ queryKey: weaponKeys.all });
          }

          // Update state
          const newPreview = getEnhancePreview(result.weapon);
          set({
            selectedWeapon: result.weapon,
            preview: newPreview,
            lastResult: result.result,
            isEnhancing: false,
          });

          return result.result;
        } catch (error) {
          set({
            isEnhancing: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
          return null;
        }
      },

      refreshPreview: () => {
        const { selectedWeapon } = get();
        if (selectedWeapon) {
          const preview = getEnhancePreview(selectedWeapon);
          set({ preview });
        }
      },

      clearResult: () => {
        set({ lastResult: null });
      },
    }),
    { name: "enhancement-store" },
  ),
);
