import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeleteDialog } from "../store";
import { useDeleteCard } from "../hooks";

/**
 * DeleteConfirmDialog component
 * Show confirmation message with card name
 * Implement confirm and cancel actions
 * Requirements: 4.1, 4.2, 4.3
 */
export function DeleteConfirmDialog() {
  const { isOpen, card, close } = useDeleteDialog();
  const deleteCard = useDeleteCard();

  const handleConfirm = async () => {
    if (!card) return;

    await deleteCard.mutateAsync(card.id);
    close();
  };

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Card</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold">{card?.name}</span>? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={close}>
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
