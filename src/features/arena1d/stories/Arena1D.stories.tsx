/**
 * Arena1D Storybook Stories
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * Stories demonstrating the Arena1D component in various states:
 * - Empty arena with 8 cells
 * - Initial battle setup with cards at boundaries
 * - Mid-arena positions
 * - Movement animation demo
 * - Combat phase with adjacent cards
 */

import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, useEffect, useCallback } from "react";
import { Arena1D } from "../components/Arena1D";
import type { ArenaCardData, CellIndex, ArenaPhase } from "../types";
import {
  PHASE_SETUP,
  PHASE_MOVING,
  PHASE_COMBAT,
  LEFT_BOUNDARY_INDEX,
  RIGHT_BOUNDARY_INDEX,
} from "../types";

const meta: Meta<typeof Arena1D> = {
  title: "Features/Arena1D/Arena1D",
  component: Arena1D,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    leftPosition: {
      control: { type: "range", min: 0, max: 7, step: 1 },
      description: "Position of left card (0-7)",
    },
    rightPosition: {
      control: { type: "range", min: 0, max: 7, step: 1 },
      description: "Position of right card (0-7)",
    },
    phase: {
      control: { type: "select" },
      options: ["setup", "moving", "combat", "finished"],
      description: "Current arena phase",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Arena1D>;

// API base URL for card images
const API_BASE_URL = "http://localhost:3001";

// Helper to build image URL from imagePath
function buildImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null;
  return `${API_BASE_URL}/images/${imagePath}`;
}

// Sample card data using real cards from db.json
const sampleLeftCard: ArenaCardData = {
  id: "550e8400-e29b-41d4-a716-446655440001",
  name: "Fire Dragon",
  imageUrl: buildImageUrl("550e8400-e29b-41d4-a716-446655440001.jpeg"),
};

const sampleRightCard: ArenaCardData = {
  id: "550e8400-e29b-41d4-a716-446655440003",
  name: "Thunder Knight",
  imageUrl: buildImageUrl("550e8400-e29b-41d4-a716-446655440003.png"),
};

/**
 * Story 1: Empty Arena
 * Requirements: 6.1
 * Shows an empty arena with 8 cells, no cards placed
 */
export const EmptyArena: Story = {
  name: "Empty Arena (8 cells)",
  args: {
    leftCard: null,
    rightCard: null,
    leftPosition: LEFT_BOUNDARY_INDEX as CellIndex,
    rightPosition: RIGHT_BOUNDARY_INDEX as CellIndex,
    phase: PHASE_SETUP,
  },
  parameters: {
    docs: {
      description: {
        story:
          "An empty arena displaying all 8 cells. Boundary cells (0 and 7) are visually distinguished with amber styling.",
      },
    },
  },
};

/**
 * Story 2: Initial Setup
 * Requirements: 6.2
 * Shows cards at their starting boundary positions (0 and 7)
 */
export const InitialSetup: Story = {
  name: "Initial Setup (cards at boundaries)",
  args: {
    leftCard: sampleLeftCard,
    rightCard: sampleRightCard,
    leftPosition: LEFT_BOUNDARY_INDEX as CellIndex,
    rightPosition: RIGHT_BOUNDARY_INDEX as CellIndex,
    phase: PHASE_SETUP,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Battle initial setup with Fire Dragon at cell 0 and Thunder Knight at cell 7. This is the starting position for all arena battles.",
      },
    },
  },
};

/**
 * Story 3: Mid-Arena Positions
 * Requirements: 6.3
 * Shows cards at various mid-arena positions
 */
export const MidArenaPositions: Story = {
  name: "Mid-Arena Positions",
  args: {
    leftCard: sampleLeftCard,
    rightCard: sampleRightCard,
    leftPosition: 2 as CellIndex,
    rightPosition: 5 as CellIndex,
    phase: PHASE_MOVING,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Cards positioned in the middle of the arena after several turns of movement. Fire Dragon at position 2, Thunder Knight at position 5.",
      },
    },
  },
};

/**
 * Story 4: Movement Animation Demo
 * Requirements: 6.4
 * Interactive demo showing card movement animation
 */
const MovementAnimationDemo = () => {
  const [leftPosition, setLeftPosition] = useState<CellIndex>(
    LEFT_BOUNDARY_INDEX as CellIndex
  );
  const [rightPosition, setRightPosition] = useState<CellIndex>(
    RIGHT_BOUNDARY_INDEX as CellIndex
  );
  const [phase, setPhase] = useState<ArenaPhase>(PHASE_SETUP);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const moveCards = useCallback(() => {
    if (Math.abs(leftPosition - rightPosition) <= 1) {
      setPhase(PHASE_COMBAT);
      setIsAutoPlaying(false);
      return;
    }

    setPhase(PHASE_MOVING);
    setLeftPosition((prev) => Math.min(prev + 1, 7) as CellIndex);
    setRightPosition((prev) => Math.max(prev - 1, 0) as CellIndex);
  }, [leftPosition, rightPosition]);

  const reset = useCallback(() => {
    setLeftPosition(LEFT_BOUNDARY_INDEX as CellIndex);
    setRightPosition(RIGHT_BOUNDARY_INDEX as CellIndex);
    setPhase(PHASE_SETUP);
    setIsAutoPlaying(false);
  }, []);

  useEffect(() => {
    if (!isAutoPlaying || phase === PHASE_COMBAT) return;

    const timer = setTimeout(() => {
      moveCards();
    }, 800);

    return () => clearTimeout(timer);
  }, [isAutoPlaying, phase, moveCards]);

  return (
    <div className="flex flex-col items-center gap-4">
      <Arena1D
        leftCard={sampleLeftCard}
        rightCard={sampleRightCard}
        leftPosition={leftPosition}
        rightPosition={rightPosition}
        phase={phase}
      />

      <div className="flex gap-2">
        <button
          onClick={moveCards}
          disabled={phase === PHASE_COMBAT || phase === PHASE_MOVING}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Move Cards
        </button>
        <button
          onClick={() => setIsAutoPlaying(!isAutoPlaying)}
          disabled={phase === PHASE_COMBAT}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAutoPlaying ? "Stop Auto" : "Auto Play"}
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Reset
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>
          Left Position: {leftPosition} | Right Position: {rightPosition} |
          Phase: {phase}
        </p>
      </div>
    </div>
  );
};

export const MovementAnimation: Story = {
  name: "Movement Animation Demo",
  render: () => <MovementAnimationDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Interactive demo showing card movement animation. Click 'Move Cards' to advance both cards one cell toward each other, or use 'Auto Play' to watch the full sequence.",
      },
    },
  },
};

/**
 * Story 5: Combat Phase
 * Requirements: 6.5
 * Shows cards in adjacent cells, triggering combat phase
 */
export const CombatPhase: Story = {
  name: "Combat Phase (adjacent cards)",
  args: {
    leftCard: sampleLeftCard,
    rightCard: sampleRightCard,
    leftPosition: 3 as CellIndex,
    rightPosition: 4 as CellIndex,
    phase: PHASE_COMBAT,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Cards in adjacent cells (positions 3 and 4), triggering combat phase. Both cards are highlighted to indicate they are ready for battle.",
      },
    },
  },
};

/**
 * Additional Story: Single Card
 * Shows arena with only one card for edge case testing
 */
export const SingleCardLeft: Story = {
  name: "Single Card (Left Only)",
  args: {
    leftCard: sampleLeftCard,
    rightCard: null,
    leftPosition: 2 as CellIndex,
    rightPosition: RIGHT_BOUNDARY_INDEX as CellIndex,
    phase: PHASE_SETUP,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Arena with only the Fire Dragon present, useful for testing partial states.",
      },
    },
  },
};

/**
 * Additional Story: Cards About to Meet
 * Shows cards one step away from combat
 */
export const AboutToMeet: Story = {
  name: "About to Meet (2 cells apart)",
  args: {
    leftCard: sampleLeftCard,
    rightCard: sampleRightCard,
    leftPosition: 3 as CellIndex,
    rightPosition: 5 as CellIndex,
    phase: PHASE_MOVING,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Cards are 2 cells apart (positions 3 and 5). One more move will bring them into combat range.",
      },
    },
  },
};

/**
 * Story with different cards - Ice Wizard vs Shadow Assassin
 */
const iceWizard: ArenaCardData = {
  id: "550e8400-e29b-41d4-a716-446655440002",
  name: "Ice Wizard",
  imageUrl: buildImageUrl("550e8400-e29b-41d4-a716-446655440002.png"),
};

const shadowAssassin: ArenaCardData = {
  id: "550e8400-e29b-41d4-a716-446655440004",
  name: "Shadow Assassin",
  imageUrl: buildImageUrl("550e8400-e29b-41d4-a716-446655440004.png"),
};

export const DifferentCards: Story = {
  name: "Ice Wizard vs Shadow Assassin",
  args: {
    leftCard: iceWizard,
    rightCard: shadowAssassin,
    leftPosition: 1 as CellIndex,
    rightPosition: 6 as CellIndex,
    phase: PHASE_MOVING,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Different card matchup: Ice Wizard vs Shadow Assassin approaching each other.",
      },
    },
  },
};
