/**
 * Matching Game Stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { GameCard as GameCardComponent } from "../components/GameCard";
import type { GameCard as GameCardType } from "../types";

// ============================================================================
// GAME CARD STORIES
// ============================================================================

const gameCardMeta: Meta<typeof GameCardComponent> = {
  title: "Features/MatchingGame/GameCard",
  component: GameCardComponent,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1a1a2e" }],
    },
  },
};

export default gameCardMeta;

const sampleCard: GameCardType = {
  id: "card-1",
  sentenceId: "sent-1",
  content: "Hello, how are you?",
  type: "english",
  isMatched: false,
  isSelected: false,
  isWrong: false,
};

export const Default: StoryObj<typeof GameCardComponent> = {
  args: {
    card: sampleCard,
    onClick: () => console.log("clicked"),
  },
};

export const Selected: StoryObj<typeof GameCardComponent> = {
  args: {
    card: { ...sampleCard, isSelected: true },
    onClick: () => console.log("clicked"),
  },
};

export const Matched: StoryObj<typeof GameCardComponent> = {
  args: {
    card: { ...sampleCard, isMatched: true },
    onClick: () => console.log("clicked"),
  },
};

export const Wrong: StoryObj<typeof GameCardComponent> = {
  args: {
    card: { ...sampleCard, isWrong: true },
    onClick: () => console.log("clicked"),
  },
};

export const VietnameseCard: StoryObj<typeof GameCardComponent> = {
  args: {
    card: {
      ...sampleCard,
      id: "card-2",
      content: "Xin chào, bạn khỏe không?",
      type: "vietnamese",
    },
    onClick: () => console.log("clicked"),
  },
};

export const AllStates = () => {
  const cards: GameCardType[] = [
    { ...sampleCard, id: "1", content: "Normal" },
    { ...sampleCard, id: "2", content: "Selected", isSelected: true },
    { ...sampleCard, id: "3", content: "Matched", isMatched: true },
    { ...sampleCard, id: "4", content: "Wrong", isWrong: true },
    { ...sampleCard, id: "5", content: "Vietnamese", type: "vietnamese" },
    {
      ...sampleCard,
      id: "6",
      content: "VI Matched",
      type: "vietnamese",
      isMatched: true,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {cards.map((card) => (
        <div key={card.id} className="w-48">
          <GameCardComponent card={card} onClick={() => {}} />
        </div>
      ))}
    </div>
  );
};
