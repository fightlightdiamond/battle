import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { GemService } from "../services/gemService";
import type { Gem, GemFormInput } from "../types/gem";
import { gemKeys } from "./gemKeys";

/**
 * Hook to update an existing gem
 * Requirements: 1.3 - Edit gem properties and persist changes
 */
export function useUpdateGem(
  options?: Omit<
    UseMutationOptions<Gem | null, Error, { id: string; input: GemFormInput }>,
    "mutationFn"
  >,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: GemFormInput }) => {
      return await GemService.update(id, input);
    },
    onSuccess: (_, variables) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: gemKeys.lists() });
      // Invalidate the specific gem detail query
      queryClient.invalidateQueries({
        queryKey: gemKeys.detail(variables.id),
      });
    },
    ...options,
  });
}
