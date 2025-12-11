import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCardUIStore } from "../store";
import { useDeleteCard } from "../hooks";

/**
 * DeleteConfirmDialog component
 * Show confirmation message with card name
 * Implement confirm and cancel actions
 * Requirements: 4.1, 4.2, 4.3
 */
export function DeleteConfirmDialog() {
  const { isDeleteDialogOpen, deletingCard, closeDeleteDialog } =
    useCardUIStore();
  const deleteCard = useDeleteCard();

  const handleConfirm = async () => {
    if (!deletingCard) return;

    await deleteCard.mutateAsync(deletingCard.id);
    closeDeleteDialog();
  };

  const handleCancel = () => {
    closeDeleteDialog();
  };

  return (
    <Dialog open={isDeleteDialogOpen} onOpenChange={handleCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{deletingCard?.name}</span>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteCard.isPending}
          >
            {deleteCard.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
