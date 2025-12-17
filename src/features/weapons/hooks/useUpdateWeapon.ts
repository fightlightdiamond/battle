import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { WeaponService } from "../services/weaponService";
import type { Weapon, WeaponFormInput } from "../types/weapon";
import { weaponKeys } from "./weaponKeys";

/**
 * Hook to update an existing weapon
 * Requirements: 2.2, 2.3 - Update weapon and persist changes with new timestamp
 */
export function useUpdateWeapon(
  options?: Omit<
    UseMutationOptions<
      Weapon | null,
      Error,
      { id: string; input: WeaponFormInput }
    >,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: WeaponFormInput;
    }) => {
      return await WeaponService.update(id, input);
    },
    onSuccess: (_, variables) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: weaponKeys.lists() });
      // Invalidate the specific weapon detail query
      queryClient.invalidateQueries({
        queryKey: weaponKeys.detail(variables.id),
      });
    },
    ...options,
  });
}
