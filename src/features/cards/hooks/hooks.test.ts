import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useOnlineStatus } from "./index";

// Mock the modules
vi.mock("../api/cardApi", () => ({
  cardApi: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getPaginated: vi.fn(),
    create: vi.fn(),
    createWithId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../services/cardService", () => ({
  CardService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getPaginated: vi.fn(),
    create: vi.fn(),
    createWithId: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock("../services/imageStorage", () => ({
  saveImage: vi.fn().mockResolvedValue("test-image.png"),
  deleteImage: vi.fn().mockResolvedValue(true),
  getImageUrl: vi.fn().mockResolvedValue("blob:test-url"),
}));

describe("useOnlineStatus", () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // Reset navigator.onLine
    Object.defineProperty(global, "navigator", {
      value: { onLine: true },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, "navigator", {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it("should return true when online", () => {
    Object.defineProperty(global.navigator, "onLine", {
      value: true,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);
  });

  it("should return false when offline", () => {
    Object.defineProperty(global.navigator, "onLine", {
      value: false,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(false);
  });

  it("should update when online status changes", async () => {
    Object.defineProperty(global.navigator, "onLine", {
      value: true,
      writable: true,
    });

    const { result } = renderHook(() => useOnlineStatus());
    expect(result.current).toBe(true);

    // Simulate going offline
    Object.defineProperty(global.navigator, "onLine", {
      value: false,
      writable: true,
    });
    window.dispatchEvent(new Event("offline"));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    // Simulate going online
    Object.defineProperty(global.navigator, "onLine", {
      value: true,
      writable: true,
    });
    window.dispatchEvent(new Event("online"));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});

describe("Card Hooks - Online/Offline Logic", () => {
  let queryClient: QueryClient;

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("Online Mode Behavior", () => {
    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { onLine: true },
        writable: true,
        configurable: true,
      });
    });

    it("should attempt API call first when online", async () => {
      const { cardApi } = await import("../api/cardApi");
      const mockCards = [
        {
          id: "1",
          name: "Test",
          atk: 100,
          hp: 200,
          imagePath: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      vi.mocked(cardApi.getPaginated).mockResolvedValue({
        cards: mockCards,
        total: 1,
      });

      const { useCards } = await import("./index");

      const { result } = renderHook(
        () =>
          useCards({
            search: "",
            sortBy: "name",
            sortOrder: "asc",
            page: 1,
            pageSize: 10,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(cardApi.getPaginated).toHaveBeenCalled();
    });
  });

  describe("Offline Mode Behavior", () => {
    beforeEach(() => {
      Object.defineProperty(global, "navigator", {
        value: { onLine: false },
        writable: true,
        configurable: true,
      });
    });

    it("should use IndexedDB when offline", async () => {
      const { CardService } = await import("../services/cardService");
      const mockPaginatedResult = {
        cards: [
          {
            id: "1",
            name: "Test",
            atk: 100,
            hp: 200,
            def: 50,
            spd: 10,
            critChance: 5,
            critDamage: 150,
            armorPen: 0,
            lifesteal: 0,
            imagePath: null,
            imageUrl: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
      };

      vi.mocked(CardService.getPaginated).mockResolvedValue(
        mockPaginatedResult
      );

      const { useCards } = await import("./index");

      const { result } = renderHook(
        () =>
          useCards({
            search: "",
            sortBy: "name",
            sortOrder: "asc",
            page: 1,
            pageSize: 10,
          }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(CardService.getPaginated).toHaveBeenCalled();
    });
  });
});
