import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { WeaponService } from "../services/weaponService";
import type { Weapon } from "../types/weapon";
import { weaponKeys } from "./weaponKeys";

/**
 * Hook to fetch all weapons
 * Requirements: 2.1 - Display all weapons with their names and stats
 */
export function useWeapons(
  options?: Omit<UseQueryOptions<Weapon[]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: weaponKeys.list(),
    queryFn: async () => {
      try {
        return await WeaponService.getAll();
      } catch (error) {
        console.error("[useWeapons] Failed to fetch weapons:", error);
        return [];
      }
    },
    ...options,
  });
}
