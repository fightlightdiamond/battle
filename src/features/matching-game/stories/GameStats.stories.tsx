/**
 * Game Stats Stories
 */

import type { Meta, StoryObj } from "@storybook/react";
import { GameStats } from "../components/GameStats";

const meta: Meta<typeof GameStats> = {
  title: "Features/MatchingGame/GameStats",
  component: GameStats,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "dark",
      values: [{ name: "dark", value: "#1a1a2e" }],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-[400px]">
        <Story />
      </div>
    ),
  ],
};

export default meta;

export const Default: StoryObj<typeof GameStats> = {
  args: {
    elapsedTime: 45,
    matchedPairs: 3,
    totalPairs: 6,
    wrongAttempts: 2,
  },
};

export const JustStarted: StoryObj<typeof GameStats> = {
  args: {
    elapsedTime: 5,
    matchedPairs: 0,
    totalPairs: 6,
    wrongAttempts: 0,
  },
};

export const Perfect: StoryObj<typeof GameStats> = {
  args: {
    elapsedTime: 30,
    matchedPairs: 6,
    totalPairs: 6,
    wrongAttempts: 0,
  },
};

export const WithTimeLimit: StoryObj<typeof GameStats> = {
  args: {
    elapsedTime: 45,
    matchedPairs: 3,
    totalPairs: 6,
    wrongAttempts: 1,
    timeLimit: 60,
  },
};

export const TimeCritical: StoryObj<typeof GameStats> = {
  args: {
    elapsedTime: 55,
    matchedPairs: 4,
    totalPairs: 6,
    wrongAttempts: 3,
    timeLimit: 60,
  },
};

export const ManyMistakes: StoryObj<typeof GameStats> = {
  args: {
    elapsedTime: 120,
    matchedPairs: 5,
    totalPairs: 6,
    wrongAttempts: 10,
  },
};
