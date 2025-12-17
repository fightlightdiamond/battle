import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { WeaponService } from "../services/weaponService";
import type { Weapon, WeaponFormInput } from "../types/weapon";
import { weaponKeys } from "./weaponKeys";

/**
 * Hook to create a new weapon
 * Requirements: 1.1 - Create weapons with offensive stats
 */
export function useCreateWeapon(
  options?: Omit<
    UseMutationOptions<Weapon, Error, WeaponFormInput>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: WeaponFormInput) => {
      return await WeaponService.create(input);
    },
    onSuccess: () => {
      // Invalidate all list queries to refetch with new weapon
      queryClient.invalidateQueries({ queryKey: weaponKeys.lists() });
    },
    ...options,
  });
}
