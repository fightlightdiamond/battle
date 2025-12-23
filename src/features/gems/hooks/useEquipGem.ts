import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GemEquipmentService } from "../services/gemEquipmentService";
import { gemEquipmentKeys } from "./gemEquipmentKeys";

interface EquipGemParams {
  cardId: string;
  gemId: string;
}

/**
 * Hook to equip a gem to a card
 * Requirements: 2.1 - Equip gem to card if fewer than 3 gems are equipped
 */
export function useEquipGem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, gemId }: EquipGemParams) => {
      return await GemEquipmentService.equipGem(cardId, gemId);
    },
    onSuccess: (_, { cardId }) => {
      // Invalidate the card's gem equipment cache
      queryClient.invalidateQueries({
        queryKey: gemEquipmentKeys.detail(cardId),
      });
      // Also invalidate the list in case it's being displayed
      queryClient.invalidateQueries({
        queryKey: gemEquipmentKeys.list(),
      });
    },
  });
}
