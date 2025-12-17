import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { WeaponService } from "../services/weaponService";
import { weaponKeys } from "./weaponKeys";

/**
 * Hook to delete a weapon
 * Requirements: 2.4 - Delete weapon (unequips from card automatically via WeaponService)
 */
export function useDeleteWeapon(
  options?: Omit<UseMutationOptions<boolean, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return await WeaponService.delete(id);
    },
    onSuccess: (_, id) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: weaponKeys.lists() });
      // Remove the specific weapon from cache
      queryClient.removeQueries({ queryKey: weaponKeys.detail(id) });
    },
    ...options,
  });
}
