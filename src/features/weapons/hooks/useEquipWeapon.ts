import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { EquipmentService } from "../services/equipmentService";
import type { CardEquipment } from "../types/equipment";
import { equipmentKeys } from "./equipmentKeys";

interface EquipWeaponParams {
  cardId: string;
  weaponId: string;
}

/**
 * Hook to equip a weapon to a card
 * Requirements: 3.2 - Associate weapon with card and persist relationship
 */
export function useEquipWeapon(
  options?: Omit<
    UseMutationOptions<CardEquipment, Error, EquipWeaponParams>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, weaponId }: EquipWeaponParams) => {
      return await EquipmentService.equipWeapon(cardId, weaponId);
    },
    onSuccess: (equipment, { cardId }) => {
      // Update the specific card's equipment cache
      queryClient.setQueryData(equipmentKeys.card(cardId), equipment);
      // Invalidate all equipment queries to handle weapon exclusivity
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
    ...options,
  });
}
