import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { EquipmentService } from "../services/equipmentService";
import { equipmentKeys } from "./equipmentKeys";

/**
 * Hook to unequip a weapon from a card
 * Requirements: 3.4 - Remove association and revert to base stats display
 */
export function useUnequipWeapon(
  options?: Omit<UseMutationOptions<void, Error, string>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (cardId: string) => {
      await EquipmentService.unequipWeapon(cardId);
    },
    onSuccess: (_, cardId) => {
      // Update the specific card's equipment cache to reflect unequipped state
      queryClient.setQueryData(equipmentKeys.card(cardId), {
        cardId,
        weaponId: null,
        equippedAt: null,
      });
      // Invalidate all equipment queries
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
    ...options,
  });
}
