/**
 * Matching Board Stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { MatchingBoard } from "../components/MatchingBoard";
import type { GameCard } from "../types";

const meta: Meta<typeof MatchingBoard> = {
  title: "Features/MatchingGame/MatchingBoard",
  component: MatchingBoard,
  parameters: {
    layout: "padded",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1a1a2e" }],
    },
  },
};

export default meta;

const generateCards = (count: number): GameCard[] => {
  const cards: GameCard[] = [];
  const sentences = [
    { en: "Hello", vi: "Xin chào" },
    { en: "How are you?", vi: "Bạn khỏe không?" },
    { en: "Thank you", vi: "Cảm ơn" },
    { en: "Good morning", vi: "Chào buổi sáng" },
    { en: "Goodbye", vi: "Tạm biệt" },
    { en: "I love you", vi: "Tôi yêu bạn" },
    { en: "See you later", vi: "Hẹn gặp lại" },
    { en: "Nice to meet you", vi: "Rất vui được gặp bạn" },
  ];

  for (let i = 0; i < Math.min(count, sentences.length); i++) {
    const sentenceId = `sent-${i}`;
    cards.push({
      id: `${sentenceId}-en`,
      sentenceId,
      content: sentences[i].en,
      type: "english",
      isMatched: false,
      isSelected: false,
      isWrong: false,
    });
    cards.push({
      id: `${sentenceId}-vi`,
      sentenceId,
      content: sentences[i].vi,
      type: "vietnamese",
      isMatched: false,
      isSelected: false,
      isWrong: false,
    });
  }

  // Shuffle
  return cards.sort(() => Math.random() - 0.5);
};

export const SixPairs: StoryObj<typeof MatchingBoard> = {
  args: {
    cards: generateCards(6),
    onCardClick: (id) => console.log("Clicked:", id),
  },
};

export const FourPairs: StoryObj<typeof MatchingBoard> = {
  args: {
    cards: generateCards(4),
    onCardClick: (id) => console.log("Clicked:", id),
  },
};

export const EightPairs: StoryObj<typeof MatchingBoard> = {
  args: {
    cards: generateCards(8),
    onCardClick: (id) => console.log("Clicked:", id),
  },
};

export const WithMatchedCards: StoryObj<typeof MatchingBoard> = {
  args: {
    cards: generateCards(4).map((card, i) => ({
      ...card,
      isMatched: i < 4, // First 2 pairs matched
    })),
    onCardClick: (id) => console.log("Clicked:", id),
  },
};

export const Disabled: StoryObj<typeof MatchingBoard> = {
  args: {
    cards: generateCards(4),
    onCardClick: (id) => console.log("Clicked:", id),
    disabled: true,
  },
};
