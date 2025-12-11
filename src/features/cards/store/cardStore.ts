import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Card } from "../types";
import type { CardStore, CardState } from "./types";

const initialState: CardState = {
  cards: [],
  selectedCard: null,
  total: 0,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
};

/**
 * Zustand store for Card CRUD state management
 * Manages cards data, loading states, and errors
 */
export const useCardStore = create<CardStore>()(
  devtools(
    (set) => ({
      ...initialState,

      // CRUD operations
      setCards: (cards: Card[], total: number) =>
        set({ cards, total, error: null }, false, "setCards"),

      addCard: (card: Card) =>
        set(
          (state) => ({
            cards: [card, ...state.cards],
            total: state.total + 1,
            error: null,
          }),
          false,
          "addCard"
        ),

      updateCard: (id: string, updates: Partial<Card>) =>
        set(
          (state) => ({
            cards: state.cards.map((card) =>
              card.id === id ? { ...card, ...updates } : card
            ),
            selectedCard:
              state.selectedCard?.id === id
                ? { ...state.selectedCard, ...updates }
                : state.selectedCard,
            error: null,
          }),
          false,
          "updateCard"
        ),

      removeCard: (id: string) =>
        set(
          (state) => ({
            cards: state.cards.filter((card) => card.id !== id),
            total: Math.max(0, state.total - 1),
            selectedCard:
              state.selectedCard?.id === id ? null : state.selectedCard,
            error: null,
          }),
          false,
          "removeCard"
        ),

      // Selection
      selectCard: (card: Card | null) =>
        set({ selectedCard: card }, false, "selectCard"),

      // Loading states
      setLoading: (isLoading: boolean) =>
        set({ isLoading }, false, "setLoading"),

      setCreating: (isCreating: boolean) =>
        set({ isCreating }, false, "setCreating"),

      setUpdating: (isUpdating: boolean) =>
        set({ isUpdating }, false, "setUpdating"),

      setDeleting: (isDeleting: boolean) =>
        set({ isDeleting }, false, "setDeleting"),

      // Error handling
      setError: (error: string | null) => set({ error }, false, "setError"),

      clearError: () => set({ error: null }, false, "clearError"),

      // Reset
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "card-store" }
  )
);

// Selectors for optimized re-renders
export const selectCards = (state: CardStore) => state.cards;
export const selectSelectedCard = (state: CardStore) => state.selectedCard;
export const selectTotal = (state: CardStore) => state.total;
export const selectIsLoading = (state: CardStore) => state.isLoading;
export const selectIsCreating = (state: CardStore) => state.isCreating;
export const selectIsUpdating = (state: CardStore) => state.isUpdating;
export const selectIsDeleting = (state: CardStore) => state.isDeleting;
export const selectError = (state: CardStore) => state.error;
export const selectIsAnyLoading = (state: CardStore) =>
  state.isLoading || state.isCreating || state.isUpdating || state.isDeleting;
