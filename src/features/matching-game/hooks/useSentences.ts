/**
 * Sentence Hooks - React Query hooks for sentence CRUD
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SentenceService } from "../services/sentenceService";
import type { SentenceFormInput, SentenceFilters } from "../types";

const QUERY_KEY = "sentences";

/**
 * Hook to fetch all sentences
 */
export function useSentences(filters?: SentenceFilters) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => SentenceService.getAll(filters),
  });
}

/**
 * Hook to fetch paginated sentences
 */
export function usePaginatedSentences(
  page: number = 1,
  limit: number = 10,
  filters?: SentenceFilters,
) {
  return useQuery({
    queryKey: [QUERY_KEY, "paginated", page, limit, filters],
    queryFn: () => SentenceService.getPaginated(page, limit, filters),
  });
}

/**
 * Hook to fetch a single sentence by ID
 */
export function useSentence(id: string) {
  return useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: () => SentenceService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to create a new sentence
 */
export function useCreateSentence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SentenceFormInput) => SentenceService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook to update a sentence
 */
export function useUpdateSentence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<SentenceFormInput>;
    }) => SentenceService.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook to delete a sentence
 */
export function useDeleteSentence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => SentenceService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

/**
 * Hook to get random sentences for game
 */
export function useRandomSentences(
  count: number,
  difficulty?: "easy" | "medium" | "hard" | "mixed",
) {
  return useQuery({
    queryKey: [QUERY_KEY, "random", count, difficulty],
    queryFn: () => SentenceService.getRandomForGame(count, difficulty),
    staleTime: 0, // Always refetch for randomness
    refetchOnMount: "always",
  });
}
