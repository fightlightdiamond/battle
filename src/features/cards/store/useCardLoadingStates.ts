import { useCardStore } from "./cardStore";

/**
 * Hook for card CRUD loading states
 */
export function useCardLoadingStates() {
  const isLoading = useCardStore((s) => s.isLoading);
  const isCreating = useCardStore((s) => s.isCreating);
  const isUpdating = useCardStore((s) => s.isUpdating);
  const isDeleting = useCardStore((s) => s.isDeleting);

  const isAnyLoading = isLoading || isCreating || isUpdating || isDeleting;

  return {
    isLoading,
    isCreating,
    isUpdating,
    isDeleting,
    isAnyLoading,
  };
}
