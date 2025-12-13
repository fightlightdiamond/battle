import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { cardApi } from "../api/cardApi";
import { CardService } from "../services/cardService";
import { SyncQueue } from "../services/syncQueue";
import { saveImage, deleteImage } from "../services/imageStorage";
import type { Card, CardFormInput } from "../types";
import { cardKeys } from "./cardKeys";
import { toCard, isOnline } from "./utils";
import { DEFAULT_STATS } from "../types/constants";

/**
 * Hook to update an existing card
 * Requirements: 3.2
 * Flow: Get card (sync from API if needed) → Update OPFS if new image → Update IndexedDB → PUT to API (if online) or queue for sync
 */
export function useUpdateCard(
  options?: Omit<
    UseMutationOptions<
      Card | null,
      Error,
      { id: string; input: CardFormInput }
    >,
    "mutationFn"
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: CardFormInput }) => {
      // Get existing card from IndexedDB first
      let existing: Card | null = null;
      try {
        existing = await CardService.getById(id);
      } catch (dbError) {
        console.error(
          "[useUpdateCard] Failed to get existing card from IndexedDB:",
          dbError
        );
      }

      // If not in IndexedDB but online, try to fetch from API and sync
      if (!existing && isOnline()) {
        try {
          const apiCard = await cardApi.getById(id);
          if (apiCard) {
            // Sync card from API to IndexedDB
            await CardService.createWithId(apiCard);
            existing = await toCard(apiCard);
            console.log(
              "[useUpdateCard] Synced card from API to IndexedDB:",
              id
            );
          }
        } catch (apiError) {
          console.error(
            "[useUpdateCard] Failed to fetch card from API:",
            apiError
          );
        }
      }

      if (!existing) {
        throw new Error(`Card with id ${id} not found`);
      }

      let imagePath = existing.imagePath;

      // Handle image update
      if (input.image) {
        try {
          // Delete old image from OPFS if exists
          if (existing.imagePath) {
            await deleteImage(existing.imagePath);
          }
          // Save new image to OPFS
          imagePath = await saveImage(id, input.image);
        } catch (imageError) {
          console.error("[useUpdateCard] Image update failed:", imageError);
          // Continue with existing image path
        }
      }

      // Always update IndexedDB first
      let updatedCard: Card | null = null;
      try {
        updatedCard = await CardService.update(id, input);
      } catch (dbError) {
        console.error("[useUpdateCard] IndexedDB update failed:", dbError);
        throw new Error("Failed to update card in local storage");
      }

      // Prepare card data for API/queue with all stats
      const cardDataForSync = {
        id,
        name: input.name,
        // Core Stats (Tier 1)
        hp: input.hp ?? existing.hp ?? DEFAULT_STATS.hp,
        atk: input.atk ?? existing.atk ?? DEFAULT_STATS.atk,
        def: input.def ?? existing.def ?? DEFAULT_STATS.def,
        spd: input.spd ?? existing.spd ?? DEFAULT_STATS.spd,
        // Combat Stats (Tier 2)
        critChance:
          input.critChance ?? existing.critChance ?? DEFAULT_STATS.critChance,
        critDamage:
          input.critDamage ?? existing.critDamage ?? DEFAULT_STATS.critDamage,
        armorPen: input.armorPen ?? existing.armorPen ?? DEFAULT_STATS.armorPen,
        lifesteal:
          input.lifesteal ?? existing.lifesteal ?? DEFAULT_STATS.lifesteal,
        // Metadata
        imagePath,
        createdAt: existing.createdAt,
        updatedAt: updatedCard?.updatedAt || Date.now(),
      };

      // Update in json-server if online, otherwise queue for later
      if (isOnline()) {
        try {
          await cardApi.update(id, {
            name: input.name,
            // Core Stats (Tier 1)
            hp: cardDataForSync.hp,
            atk: cardDataForSync.atk,
            def: cardDataForSync.def,
            spd: cardDataForSync.spd,
            // Combat Stats (Tier 2)
            critChance: cardDataForSync.critChance,
            critDamage: cardDataForSync.critDamage,
            armorPen: cardDataForSync.armorPen,
            lifesteal: cardDataForSync.lifesteal,
            // Metadata
            imagePath,
          });
        } catch (apiError) {
          // API failed - queue for later sync
          console.warn(
            "[useUpdateCard] API sync failed, queuing for later:",
            apiError instanceof Error ? apiError.message : apiError
          );
          await SyncQueue.queueUpdate(cardDataForSync);
        }
      } else {
        // Offline - queue for later sync
        await SyncQueue.queueUpdate(cardDataForSync);
        console.log("[useUpdateCard] Offline, queued update for sync");
      }

      return updatedCard;
    },
    onSuccess: (_, variables) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      // Invalidate the specific card detail query
      queryClient.invalidateQueries({
        queryKey: cardKeys.detail(variables.id),
      });
    },
    ...options,
  });
}
