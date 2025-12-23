import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GemEquipmentService } from "../services/gemEquipmentService";
import { gemEquipmentKeys } from "./gemEquipmentKeys";

interface UnequipGemParams {
  cardId: string;
  gemId: string;
}

/**
 * Hook to unequip a gem from a card
 * Requirements: 2.3 - Unequip gem from card
 */
export function useUnequipGem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ cardId, gemId }: UnequipGemParams) => {
      return await GemEquipmentService.unequipGem(cardId, gemId);
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
