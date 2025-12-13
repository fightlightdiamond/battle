import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import { SyncQueue } from "../services/syncQueue";
import { saveImage, getImageUrl } from "../services/imageStorage";
import type { Card, CardFormInput } from "../types";
import { cardKeys } from "./cardKeys";
import { isOnline } from "./utils";
import { DEFAULT_STATS } from "../types/constants";

/**
 * Hook to create a new card
 * Requirements: 2.2
 * Flow: Save image to OPFS → Save to IndexedDB → POST to API (if online) or queue for sync
 * Both IndexedDB and API use the same ID for consistency
 */
export function useCreateCard(
  options?: Omit<UseMutationOptions<Card, Error, CardFormInput>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CardFormInput) => {
      // Generate ID upfront to ensure consistency between IndexedDB and API
      const id = crypto.randomUUID();
      const now = Date.now();

      // Save image to OPFS if provided
      let imagePath: string | null = null;
      if (input.image) {
        try {
          imagePath = await saveImage(id, input.image);
        } catch (imageError) {
          console.error("[useCreateCard] Failed to save image:", imageError);
          // Continue without image
        }
      }

      // Create card object with all stats from config
      const cardData = {
        id,
        name: input.name,
        // Core Stats (Tier 1)
        hp: input.hp ?? DEFAULT_STATS.hp,
        atk: input.atk ?? DEFAULT_STATS.atk,
        def: input.def ?? DEFAULT_STATS.def,
        spd: input.spd ?? DEFAULT_STATS.spd,
        // Combat Stats (Tier 2)
        critChance: input.critChance ?? DEFAULT_STATS.critChance,
        critDamage: input.critDamage ?? DEFAULT_STATS.critDamage,
        armorPen: input.armorPen ?? DEFAULT_STATS.armorPen,
        lifesteal: input.lifesteal ?? DEFAULT_STATS.lifesteal,
        // Metadata
        imagePath,
        createdAt: now,
        updatedAt: now,
      };

      // Always save to IndexedDB first
      try {
        await CardService.createWithId(cardData);
      } catch (dbError) {
        console.error("[useCreateCard] IndexedDB save failed:", dbError);
        throw new Error("Failed to save card to local storage");
      }

      // Sync to json-server if online, otherwise queue for later
      if (isOnline()) {
        try {
          await cardApi.createWithId(cardData);
        } catch (apiError) {
          // API failed - queue for later sync
          console.warn(
            "[useCreateCard] API sync failed, queuing for later:",
            apiError instanceof Error ? apiError.message : apiError
          );
          await SyncQueue.queueCreate(cardData);
        }
      } else {
        // Offline - queue for later sync
        await SyncQueue.queueCreate(cardData);
        console.log("[useCreateCard] Offline, queued create for sync");
      }

      // Return card with imageUrl
      const imageUrl = imagePath ? await getImageUrl(imagePath) : null;
      return { ...cardData, imageUrl };
    },
    onSuccess: () => {
      // Invalidate all list queries to refetch with new card
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
    ...options,
  });
}
