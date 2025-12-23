import {
  useMutation,
  useQueryClient,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { GemService } from "../services/gemService";
import type { Gem, GemFormInput } from "../types/gem";
import { gemKeys } from "./gemKeys";

/**
 * Hook to create a new gem
 * Requirements: 1.1 - Create gems with unique id, name, description, skill type, etc.
 */
export function useCreateGem(
  options?: Omit<UseMutationOptions<Gem, Error, GemFormInput>, "mutationFn">,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: GemFormInput) => {
      return await GemService.create(input);
    },
    onSuccess: () => {
      // Invalidate all list queries to refetch with new gem
      queryClient.invalidateQueries({ queryKey: gemKeys.lists() });
    },
    ...options,
  });
}
