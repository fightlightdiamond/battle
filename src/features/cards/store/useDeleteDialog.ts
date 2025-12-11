import { useCardStore } from "./cardStore";
import { useCardUIStore } from "./cardUIStore";

/**
 * Hook for delete dialog operations
 * Combines UI state with actions
 */
export function useDeleteDialog() {
  const isOpen = useCardUIStore((s) => s.isDeleteDialogOpen);
  const card = useCardUIStore((s) => s.deletingCard);
  const openDialog = useCardUIStore((s) => s.openDeleteDialog);
  const closeDialog = useCardUIStore((s) => s.closeDeleteDialog);
  const isDeleting = useCardStore((s) => s.isDeleting);

  return {
    isOpen,
    card,
    isDeleting,
    open: openDialog,
    close: closeDialog,
  };
}
