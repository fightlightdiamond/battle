import { create } from "zustand";
import type { Card, CardUIState } from "../types";

/**
 * Zustand store for UI state management
 * Manages delete confirmation dialog state only
 */
export const useCardUIStore = create<CardUIState>((set) => ({
  isDeleteDialogOpen: false,
  deletingCard: null,

  openDeleteDialog: (card: Card) =>
    set({
      isDeleteDialogOpen: true,
      deletingCard: card,
    }),

  closeDeleteDialog: () =>
    set({
      isDeleteDialogOpen: false,
      deletingCard: null,
    }),
}));
