import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { EquipmentService } from "../services/equipmentService";
import type { CardEquipment } from "../types/equipment";
import { equipmentKeys } from "./equipmentKeys";

/**
 * Hook to fetch equipment state for a card
 * Requirements: 3.2 - Associate weapon with card and persist relationship
 */
export function useCardEquipment(
  cardId: string,
  options?: Omit<UseQueryOptions<CardEquipment | null>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: equipmentKeys.card(cardId),
    queryFn: async () => {
      try {
        return await EquipmentService.getEquipment(cardId);
      } catch (error) {
        console.error("[useCardEquipment] Failed to fetch equipment:", error);
        return null;
      }
    },
    enabled: !!cardId,
    ...options,
  });
}
