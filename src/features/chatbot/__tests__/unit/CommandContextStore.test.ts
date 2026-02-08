/**
 * Unit tests for CommandContext Zustand Store
 * Requirements: 8.1, 8.5
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  useCommandContextStore,
  selectLastCard,
  selectLastWeapon,
  selectLastGem,
  selectLastBattle,
  selectLanguage,
  selectHasContext,
  selectAllContext,
} from "../../store/commandContextStore";
import type { Card } from "../../../cards/types/card";
import type { Weapon } from "../../../weapons/types/weapon";
import type { Gem } from "../../../gems/types/gem";
import type { BattleRecord } from "../../../battle/types";

describe("CommandContextStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useCommandContextStore.getState().clear();
  });

  describe("Initial State", () => {
    it("should have undefined entities initially", () => {
      const state = useCommandContextStore.getState();

      expect(state.lastCard).toBeUndefined();
      expect(state.lastWeapon).toBeUndefined();
      expect(state.lastGem).toBeUndefined();
      expect(state.lastBattle).toBeUndefined();
    });

    it("should have English as default language", () => {
      const state = useCommandContextStore.getState();

      expect(state.language).toBe("en");
    });

    it("should not have context initially", () => {
      const state = useCommandContextStore.getState();

      expect(selectHasContext(state)).toBe(false);
    });
  });

  describe("setLastCard", () => {
    it("should update last card", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastCard(mockCard);
      const state = useCommandContextStore.getState();

      expect(state.lastCard).toEqual(mockCard);
      expect(selectLastCard(state)).toEqual(mockCard);
    });

    it("should overwrite previous card", () => {
      const card1: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const card2: Card = {
        id: "card-2",
        name: "Phoenix",
        hp: 450,
        atk: 90,
        def: 70,
        spd: 70,
        critChance: 15,
        critDamage: 160,
        armorPen: 10,
        lifesteal: 5,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastCard(card1);
      useCommandContextStore.getState().setLastCard(card2);
      const state = useCommandContextStore.getState();

      expect(state.lastCard).toEqual(card2);
      expect(state.lastCard?.id).toBe("card-2");
    });
  });

  describe("setLastWeapon", () => {
    it("should update last weapon", () => {
      const mockWeapon: Weapon = {
        id: "weapon-1",
        name: "Fire Sword",
        weaponType: "sword_shield",
        atk: 50,
        critChance: 5,
        critDamage: 25,
        armorPen: 10,
        lifesteal: 0,
        attackRange: 1,
        enhanceLevel: 0,
        enhanceHistory: [],
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastWeapon(mockWeapon);
      const state = useCommandContextStore.getState();

      expect(state.lastWeapon).toEqual(mockWeapon);
      expect(selectLastWeapon(state)).toEqual(mockWeapon);
    });

    it("should overwrite previous weapon", () => {
      const weapon1: Weapon = {
        id: "weapon-1",
        name: "Fire Sword",
        weaponType: "sword_shield",
        atk: 50,
        critChance: 5,
        critDamage: 25,
        armorPen: 10,
        lifesteal: 0,
        attackRange: 1,
        enhanceLevel: 0,
        enhanceHistory: [],
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const weapon2: Weapon = {
        id: "weapon-2",
        name: "Ice Bow",
        weaponType: "bow",
        atk: 40,
        critChance: 10,
        critDamage: 30,
        armorPen: 5,
        lifesteal: 0,
        attackRange: 3,
        enhanceLevel: 0,
        enhanceHistory: [],
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastWeapon(weapon1);
      useCommandContextStore.getState().setLastWeapon(weapon2);
      const state = useCommandContextStore.getState();

      expect(state.lastWeapon).toEqual(weapon2);
      expect(state.lastWeapon?.id).toBe("weapon-2");
    });
  });

  describe("setLastGem", () => {
    it("should update last gem", () => {
      const mockGem: Gem = {
        id: "gem-1",
        name: "Ruby",
        description: "Fire gem",
        skillType: "knockback",
        trigger: "combat",
        activationChance: 50,
        cooldown: 3,
        effectParams: { knockbackDistance: 1 },
        tier: "basic",
        imagePath: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useCommandContextStore.getState().setLastGem(mockGem);
      const state = useCommandContextStore.getState();

      expect(state.lastGem).toEqual(mockGem);
      expect(selectLastGem(state)).toEqual(mockGem);
    });

    it("should overwrite previous gem", () => {
      const gem1: Gem = {
        id: "gem-1",
        name: "Ruby",
        description: "Fire gem",
        skillType: "knockback",
        trigger: "combat",
        activationChance: 50,
        cooldown: 3,
        effectParams: { knockbackDistance: 1 },
        tier: "basic",
        imagePath: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const gem2: Gem = {
        id: "gem-2",
        name: "Sapphire",
        description: "Ice gem",
        skillType: "retreat",
        trigger: "combat",
        activationChance: 40,
        cooldown: 4,
        effectParams: { knockbackDistance: 1 },
        tier: "advanced",
        imagePath: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      useCommandContextStore.getState().setLastGem(gem1);
      useCommandContextStore.getState().setLastGem(gem2);
      const state = useCommandContextStore.getState();

      expect(state.lastGem).toEqual(gem2);
      expect(state.lastGem?.id).toBe("gem-2");
    });
  });

  describe("setLastBattle", () => {
    it("should update last battle", () => {
      const mockBattle: BattleRecord = {
        id: "battle-1",
        startedAt: Date.now(),
        endedAt: Date.now() + 5000,
        battleDurationMs: 5000,
        battleMode: "classic",
        challenger: {
          id: "card-1",
          name: "Dragon",
          imageUrl: null,
          maxHp: 500,
          currentHp: 500,
          atk: 100,
          def: 80,
          spd: 60,
          critChance: 10,
          critDamage: 150,
          armorPen: 5,
          lifesteal: 0,
        },
        opponent: {
          id: "card-2",
          name: "Phoenix",
          imageUrl: null,
          maxHp: 450,
          currentHp: 450,
          atk: 90,
          def: 70,
          spd: 70,
          critChance: 15,
          critDamage: 160,
          armorPen: 10,
          lifesteal: 5,
        },
        winnerId: "card-1",
        winnerName: "Dragon",
        totalTurns: 5,
        turns: [],
        hpTimeline: [],
      };

      useCommandContextStore.getState().setLastBattle(mockBattle);
      const state = useCommandContextStore.getState();

      expect(state.lastBattle).toEqual(mockBattle);
      expect(selectLastBattle(state)).toEqual(mockBattle);
    });

    it("should overwrite previous battle", () => {
      const battle1: BattleRecord = {
        id: "battle-1",
        startedAt: Date.now(),
        endedAt: Date.now() + 5000,
        battleDurationMs: 5000,
        battleMode: "classic",
        challenger: {
          id: "card-1",
          name: "Dragon",
          imageUrl: null,
          maxHp: 500,
          currentHp: 500,
          atk: 100,
          def: 80,
          spd: 60,
          critChance: 10,
          critDamage: 150,
          armorPen: 5,
          lifesteal: 0,
        },
        opponent: {
          id: "card-2",
          name: "Phoenix",
          imageUrl: null,
          maxHp: 450,
          currentHp: 450,
          atk: 90,
          def: 70,
          spd: 70,
          critChance: 15,
          critDamage: 160,
          armorPen: 10,
          lifesteal: 5,
        },
        winnerId: "card-1",
        winnerName: "Dragon",
        totalTurns: 5,
        turns: [],
        hpTimeline: [],
      };

      const battle2: BattleRecord = {
        id: "battle-2",
        startedAt: Date.now(),
        endedAt: Date.now() + 8000,
        battleDurationMs: 8000,
        battleMode: "classic",
        challenger: {
          id: "card-3",
          name: "Tiger",
          imageUrl: null,
          maxHp: 400,
          currentHp: 400,
          atk: 110,
          def: 60,
          spd: 80,
          critChance: 20,
          critDamage: 170,
          armorPen: 15,
          lifesteal: 10,
        },
        opponent: {
          id: "card-4",
          name: "Bear",
          imageUrl: null,
          maxHp: 600,
          currentHp: 600,
          atk: 80,
          def: 100,
          spd: 40,
          critChance: 5,
          critDamage: 140,
          armorPen: 0,
          lifesteal: 0,
        },
        winnerId: "card-4",
        winnerName: "Bear",
        totalTurns: 8,
        turns: [],
        hpTimeline: [],
      };

      useCommandContextStore.getState().setLastBattle(battle1);
      useCommandContextStore.getState().setLastBattle(battle2);
      const state = useCommandContextStore.getState();

      expect(state.lastBattle).toEqual(battle2);
      expect(state.lastBattle?.id).toBe("battle-2");
    });
  });

  describe("setLanguage", () => {
    it("should update language to Vietnamese", () => {
      useCommandContextStore.getState().setLanguage("vi");
      const state = useCommandContextStore.getState();

      expect(state.language).toBe("vi");
      expect(selectLanguage(state)).toBe("vi");
    });

    it("should update language to English", () => {
      useCommandContextStore.getState().setLanguage("vi");
      useCommandContextStore.getState().setLanguage("en");
      const state = useCommandContextStore.getState();

      expect(state.language).toBe("en");
    });

    it("should update language to mixed", () => {
      useCommandContextStore.getState().setLanguage("mixed");
      const state = useCommandContextStore.getState();

      expect(state.language).toBe("mixed");
    });
  });

  describe("clear", () => {
    it("should clear all entity context", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockWeapon: Weapon = {
        id: "weapon-1",
        name: "Fire Sword",
        weaponType: "sword_shield",
        atk: 50,
        critChance: 5,
        critDamage: 25,
        armorPen: 10,
        lifesteal: 0,
        attackRange: 1,
        enhanceLevel: 0,
        enhanceHistory: [],
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const mockGem: Gem = {
        id: "gem-1",
        name: "Ruby",
        description: "Fire gem",
        skillType: "knockback",
        trigger: "combat",
        activationChance: 50,
        cooldown: 3,
        effectParams: { knockbackDistance: 1 },
        tier: "basic",
        imagePath: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Set all context
      useCommandContextStore.getState().setLastCard(mockCard);
      useCommandContextStore.getState().setLastWeapon(mockWeapon);
      useCommandContextStore.getState().setLastGem(mockGem);
      useCommandContextStore.getState().setLanguage("vi");

      // Verify context is set
      let state = useCommandContextStore.getState();
      expect(state.lastCard).toBeDefined();
      expect(state.lastWeapon).toBeDefined();
      expect(state.lastGem).toBeDefined();
      expect(state.language).toBe("vi");

      // Clear context
      useCommandContextStore.getState().clear();

      // Verify all context is cleared
      state = useCommandContextStore.getState();
      expect(state.lastCard).toBeUndefined();
      expect(state.lastWeapon).toBeUndefined();
      expect(state.lastGem).toBeUndefined();
      expect(state.lastBattle).toBeUndefined();
      expect(state.language).toBe("en"); // Reset to default
    });

    it("should reset hasContext to false after clear", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastCard(mockCard);
      let state = useCommandContextStore.getState();
      expect(selectHasContext(state)).toBe(true);

      useCommandContextStore.getState().clear();
      state = useCommandContextStore.getState();
      expect(selectHasContext(state)).toBe(false);
    });
  });

  describe("Selectors", () => {
    it("selectHasContext should return true when any entity exists", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastCard(mockCard);
      const state = useCommandContextStore.getState();

      expect(selectHasContext(state)).toBe(true);
    });

    it("selectHasContext should return false when no entities exist", () => {
      const state = useCommandContextStore.getState();

      expect(selectHasContext(state)).toBe(false);
    });

    it("selectAllContext should return all context fields", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useCommandContextStore.getState().setLastCard(mockCard);
      useCommandContextStore.getState().setLanguage("vi");
      const state = useCommandContextStore.getState();

      const allContext = selectAllContext(state);

      expect(allContext.lastCard).toEqual(mockCard);
      expect(allContext.lastWeapon).toBeUndefined();
      expect(allContext.lastGem).toBeUndefined();
      expect(allContext.lastBattle).toBeUndefined();
      expect(allContext.language).toBe("vi");
    });
  });

  describe("Context Tracking for Follow-up Commands (Requirement 8.1)", () => {
    it("should enable follow-up commands by storing last referenced card", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Simulate: User creates a card
      useCommandContextStore.getState().setLastCard(mockCard);

      // Simulate: User issues follow-up command "equip weapon to it"
      const state = useCommandContextStore.getState();
      const contextCard = state.lastCard;

      expect(contextCard).toBeDefined();
      expect(contextCard?.id).toBe("card-1");
      // Follow-up command can now use contextCard instead of asking for card name
    });

    it("should enable follow-up commands by storing last referenced weapon", () => {
      const mockWeapon: Weapon = {
        id: "weapon-1",
        name: "Fire Sword",
        weaponType: "sword_shield",
        atk: 50,
        critChance: 5,
        critDamage: 25,
        armorPen: 10,
        lifesteal: 0,
        attackRange: 1,
        enhanceLevel: 0,
        enhanceHistory: [],
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Simulate: User creates a weapon
      useCommandContextStore.getState().setLastWeapon(mockWeapon);

      // Simulate: User issues follow-up command "equip it to Dragon"
      const state = useCommandContextStore.getState();
      const contextWeapon = state.lastWeapon;

      expect(contextWeapon).toBeDefined();
      expect(contextWeapon?.id).toBe("weapon-1");
    });
  });

  describe("Context Clearing on Category Switch (Requirement 8.5)", () => {
    it("should clear context when switching command categories", () => {
      const mockCard: Card = {
        id: "card-1",
        name: "Dragon",
        hp: 500,
        atk: 100,
        def: 80,
        spd: 60,
        critChance: 10,
        critDamage: 150,
        armorPen: 5,
        lifesteal: 0,
        imagePath: null,
        imageUrl: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // User is working with cards
      useCommandContextStore.getState().setLastCard(mockCard);
      let state = useCommandContextStore.getState();
      expect(state.lastCard).toBeDefined();

      // User switches to a different command category (e.g., battle)
      // Context should be cleared to avoid confusion
      useCommandContextStore.getState().clear();

      state = useCommandContextStore.getState();
      expect(state.lastCard).toBeUndefined();
      expect(selectHasContext(state)).toBe(false);
    });
  });
});
