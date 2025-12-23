import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { GemEquipmentService } from "../services/gemEquipmentService";
import type { CardGemEquipment } from "../types/equipment";
import { gemEquipmentKeys } from "./gemEquipmentKeys";

/**
 * Hook to fetch equipped gems for a specific card
 * Requirements: 2.4 - Show equipped gems on card
 */
export function useCardGems(
  cardId: string,
  options?: Omit<
    UseQueryOptions<CardGemEquipment | null>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery({
    queryKey: gemEquipmentKeys.detail(cardId),
    queryFn: async () => {
      try {
        return await GemEquipmentService.getCardGems(cardId);
      } catch (error) {
        console.error("[useCardGems] Failed to fetch card gems:", error);
        return null;
      }
    },
    enabled: !!cardId,
    ...options,
  });
}
