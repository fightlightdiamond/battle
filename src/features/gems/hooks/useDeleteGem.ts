import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { GemService } from "../services/gemService";
import { GemEquipmentService } from "../services/gemEquipmentService";
import { gemKeys } from "./gemKeys";

/**
 * Hook to delete a gem
 * Requirements: 1.4 - Delete gem and unequip from all cards
 */
export function useDeleteGem(
  options?: Omit<UseMutationOptions<boolean, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // First unequip the gem from all cards (Requirement 1.4)
      await GemEquipmentService.unequipAllByGemId(id);
      // Then delete the gem
      return await GemService.delete(id);
    },
    onSuccess: (_, id) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: gemKeys.lists() });
      // Remove the specific gem from cache
      queryClient.removeQueries({ queryKey: gemKeys.detail(id) });
    },
    ...options,
  });
}
