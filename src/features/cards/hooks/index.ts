import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from "@tanstack/react-query";
import { CardService } from "../services/cardService";
import type {
  Card,
  CardFormInput,
  CardListParams,
  PaginatedCards,
} from "../types";

// Query keys for cache management
export const cardKeys = {
  all: ["cards"] as const,
  lists: () => [...cardKeys.all, "list"] as const,
  list: (params: CardListParams) => [...cardKeys.lists(), params] as const,
  details: () => [...cardKeys.all, "detail"] as const,
  detail: (id: string) => [...cardKeys.details(), id] as const,
};

/**
 * Hook to fetch paginated cards with search, sort, and pagination
 * Requirements: 1.1, 1.5, 1.6, 1.7
 */
export function useCards(
  params: CardListParams,
  options?: Omit<UseQueryOptions<PaginatedCards>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: cardKeys.list(params),
    queryFn: () => CardService.getPaginated(params),
    ...options,
  });
}

/**
 * Hook to fetch a single card by ID
 * Requirements: 1.1
 */
export function useCard(
  id: string,
  options?: Omit<UseQueryOptions<Card | null>, "queryKey" | "queryFn">
) {
  return useQuery({
    queryKey: cardKeys.detail(id),
    queryFn: () => CardService.getById(id),
    enabled: !!id,
    ...options,
  });
}

/**
 * Hook to create a new card
 * Requirements: 2.2
 */
export function useCreateCard(
  options?: Omit<UseMutationOptions<Card, Error, CardFormInput>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CardFormInput) => CardService.create(input),
    onSuccess: () => {
      // Invalidate all list queries to refetch with new card
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
    },
    ...options,
  });
}

/**
 * Hook to update an existing card
 * Requirements: 3.2
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
    mutationFn: ({ id, input }: { id: string; input: CardFormInput }) =>
      CardService.update(id, input),
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

/**
 * Hook to delete a card
 * Requirements: 4.2
 */
export function useDeleteCard(
  options?: Omit<UseMutationOptions<boolean, Error, string>, "mutationFn">
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => CardService.delete(id),
    onSuccess: (_, id) => {
      // Invalidate all list queries
      queryClient.invalidateQueries({ queryKey: cardKeys.lists() });
      // Remove the specific card from cache
      queryClient.removeQueries({ queryKey: cardKeys.detail(id) });
    },
    ...options,
  });
}

// OPFS hooks
export { useOPFSSupport, useOPFSImage, useOPFSOperations } from "./useOPFS";
