import { useCardStore } from "./cardStore";
import { useCardUIStore } from "./cardUIStore";

/**
 * Hook for edit dialog operations
 */
export function useEditDialog() {
  const isOpen = useCardUIStore((s) => s.isEditDialogOpen);
  const card = useCardUIStore((s) => s.editingCard);
  const openDialog = useCardUIStore((s) => s.openEditDialog);
  const closeDialog = useCardUIStore((s) => s.closeEditDialog);
  const isUpdating = useCardStore((s) => s.isUpdating);

  return {
    isOpen,
    card,
    isUpdating,
    open: openDialog,
    close: closeDialog,
  };
}
