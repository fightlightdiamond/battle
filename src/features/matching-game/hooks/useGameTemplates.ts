/**
 * React Query hooks for Game Template CRUD operations
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GameTemplateService } from "../services/gameTemplateService";
import type { GameTemplate, GameTemplateFormInput } from "../types";

// ============================================================================
// QUERY KEYS
// ============================================================================

export const gameTemplateKeys = {
  all: ["gameTemplates"] as const,
  lists: () => [...gameTemplateKeys.all, "list"] as const,
  list: (filters: { onlyActive?: boolean }) =>
    [...gameTemplateKeys.lists(), filters] as const,
  details: () => [...gameTemplateKeys.all, "detail"] as const,
  detail: (id: string) => [...gameTemplateKeys.details(), id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Hook to fetch all game templates
 */
export function useGameTemplates(onlyActive?: boolean) {
  return useQuery({
    queryKey: gameTemplateKeys.list({ onlyActive }),
    queryFn: () => GameTemplateService.getAll(onlyActive),
  });
}

/**
 * Hook to fetch a single game template by ID
 */
export function useGameTemplate(id: string | undefined) {
  return useQuery({
    queryKey: gameTemplateKeys.detail(id ?? ""),
    queryFn: () => GameTemplateService.getById(id!),
    enabled: !!id,
  });
}

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Hook to create a new game template
 */
export function useCreateGameTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GameTemplateFormInput) =>
      GameTemplateService.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameTemplateKeys.lists() });
    },
  });
}

/**
 * Hook to update a game template
 */
export function useUpdateGameTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Partial<GameTemplateFormInput>;
    }) => GameTemplateService.update(id, input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameTemplateKeys.lists() });
      queryClient.setQueryData(gameTemplateKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to delete a game template
 */
export function useDeleteGameTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GameTemplateService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameTemplateKeys.lists() });
    },
  });
}

/**
 * Hook to toggle game template active status
 */
export function useToggleGameTemplateActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => GameTemplateService.toggleActive(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: gameTemplateKeys.lists() });
      queryClient.setQueryData(gameTemplateKeys.detail(data.id), data);
    },
  });
}

/**
 * Hook to get game templates with sentence counts
 */
export function useGameTemplatesWithCounts() {
  const { data: templates, ...rest } = useGameTemplates();

  const templatesWithCounts = useQuery({
    queryKey: [...gameTemplateKeys.lists(), "withCounts"],
    queryFn: async (): Promise<
      (GameTemplate & { sentenceCount: number })[]
    > => {
      if (!templates) return [];

      const counts = await Promise.all(
        templates.map((t) => GameTemplateService.getSentenceCount(t.id)),
      );

      return templates.map((t, i) => ({
        ...t,
        sentenceCount: counts[i],
      }));
    },
    enabled: !!templates && templates.length > 0,
  });

  return {
    ...rest,
    data: templatesWithCounts.data,
    isLoading: rest.isLoading || templatesWithCounts.isLoading,
  };
}
