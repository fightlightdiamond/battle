import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { WeaponService } from "../services/weaponService";
import type { Weapon } from "../types/weapon";
import { weaponKeys } from "./weaponKeys";

/**
 * Hook to fetch a single weapon by ID
 * Requirements: 2.2 - Display weapon form pre-filled with current values
 */
export function useWeapon(
  id: string,
  options?: Omit<UseQueryOptions<Weapon | null>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: weaponKeys.detail(id),
    queryFn: async () => {
      try {
        return await WeaponService.getById(id);
      } catch (error) {
        console.error("[useWeapon] Failed to fetch weapon:", error);
        return null;
      }
    },
    enabled: !!id,
    ...options,
  });
}
