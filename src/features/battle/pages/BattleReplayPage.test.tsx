/**
 * BattleReplayPage Unit Tests
 *
 * Tests for BattleReplayPage component rendering and state handling.
 *
 * Requirements: 4.2
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BattleReplayPage } from "./BattleReplayPage";
import type { BattleRecord } from "../types/battleHistoryTypes";

// Mock the useBattleDetail hook
const mockUseBattleDetail = vi.fn();
vi.mock("../hooks/useBattleDetail", () => ({
  useBattleDetail: (...args: unknown[]) => mockUseBattleDetail(...args),
}));

// Mock BattleReplayPlayer to avoid complex rendering
vi.mock("../components/BattleReplayPlayer", () => ({
  BattleReplayPlayer: ({ battleRecord }: { battleRecord: BattleRecord }) => (
    <div data-testid="battle-replay-player">
      Replay: {battleRecord.challenger.name} vs {battleRecord.opponent.name}
    </div>
  ),
}));

// Create a mock battle record
const createMockBattleRecord = (): BattleRecord => ({
  id: "test-battle-123",
  startedAt: Date.now() - 60000,
  endedAt: Date.now(),
  battleDurationMs: 60000,
  challenger: {
    id: "card-1",
    name: "Test Challenger",
    imageUrl: null,
    maxHp: 100,
    currentHp: 100,
    atk: 50,
    def: 30,
    spd: 40,
    critChance: 10,
    critDamage: 150,
    armorPen: 5,
    lifesteal: 0,
  },
  opponent: {
    id: "card-2",
    name: "Test Opponent",
    imageUrl: null,
    maxHp: 100,
    currentHp: 100,
    atk: 45,
    def: 35,
    spd: 35,
    critChance: 15,
    critDamage: 140,
    armorPen: 10,
    lifesteal: 5,
  },
  winnerId: "card-1",
  winnerName: "Test Challenger",
  totalTurns: 5,
  turns: [],
  hpTimeline: [],
});

// Helper to render with providers
const renderWithProviders = (id: string = "test-battle-123") => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/history/${id}/replay`]}>
        <Routes>
          <Route path="/history/:id/replay" element={<BattleReplayPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("BattleReplayPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mounts successfully without errors", () => {
    mockUseBattleDetail.mockReturnValue({
      data: createMockBattleRecord(),
      isLoading: false,
      isError: false,
      error: null,
    });

    const { container } = renderWithProviders();
    expect(container).toBeDefined();
  });

  it("displays loading state when data is being fetched", () => {
    mockUseBattleDetail.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("Loading battle data...")).toBeDefined();
  });

  it("displays error state when fetch fails", () => {
    mockUseBattleDetail.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error("Network error"),
    });

    renderWithProviders();

    expect(screen.getByText("Network error")).toBeDefined();
  });

  it("displays not found state when battle does not exist", () => {
    mockUseBattleDetail.mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("Battle not found")).toBeDefined();
    expect(
      screen.getByText("This battle record doesn't exist or has been deleted.")
    ).toBeDefined();
  });

  it("renders battle replay player when data is loaded successfully", () => {
    const mockBattle = createMockBattleRecord();
    mockUseBattleDetail.mockReturnValue({
      data: mockBattle,
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByTestId("battle-replay-player")).toBeDefined();
    expect(
      screen.getByText("Replay: Test Challenger vs Test Opponent")
    ).toBeDefined();
  });

  it("displays page title in header", () => {
    mockUseBattleDetail.mockReturnValue({
      data: createMockBattleRecord(),
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("Battle Replay")).toBeDefined();
  });

  it("displays back button with correct label", () => {
    mockUseBattleDetail.mockReturnValue({
      data: createMockBattleRecord(),
      isLoading: false,
      isError: false,
      error: null,
    });

    renderWithProviders();

    expect(screen.getByText("Details")).toBeDefined();
  });
});
