/**
 * Command Handlers - Execute commands by calling game services
 *
 * Each handler function takes parameters and context, calls the appropriate
 * game service, and returns an ExecutionResult with success/error status.
 *
 * Requirements: 4.1-4.5, 5.1-5.3, 6.1-6.5, 7.1-7.4, 9.1-9.4
 */

import type { CommandHandler } from "../types";
import { CardService } from "@/features/cards/services/cardService";
import { WeaponService } from "@/features/weapons/services/weaponService";
import { GemService } from "@/features/gems/services/gemService";
import { EquipmentService } from "@/features/weapons/services/equipmentService";
import { GemEquipmentService } from "@/features/gems/services/gemEquipmentService";
import { getImageUrl } from "@/features/cards/services/imageStorage";
import { useBattleStore } from "@/features/battle/store/battleStore";
import type { Card } from "@/features/cards/types/card";
import type { Weapon } from "@/features/weapons/types/weapon";
import type { Gem } from "@/features/gems/types/gem";
import { DEFAULT_STATS } from "@/features/cards/types/constants";

// ============================================================================
// Help Command Handlers
// ============================================================================

/**
 * Handle general help command
 * Requirements: 9.1
 */
export const helpHandler: CommandHandler = async () => {
  return {
    success: true,
    message: "Help information",
    data: {
      commandType: "help",
    },
  };
};

/**
 * Handle category-specific help command
 * Requirements: 9.2, 9.3, 9.4
 */
export const helpCategoryHandler: CommandHandler = async (params) => {
  const category = params.category as string | undefined;

  return {
    success: true,
    message: `Help for category: ${category || "general"}`,
    data: {
      commandType: "help_category",
      category: category || "general",
    },
  };
};

// ============================================================================
// Card Command Handlers
// ============================================================================

/**
 * Handle create card command
 * Requirements: 4.1
 */
export const createCardHandler: CommandHandler = async (params, context) => {
  try {
    const cardName = params.cardName as string;

    if (!cardName || !cardName.trim()) {
      return {
        success: false,
        message: "Card name is required",
        error: "Missing card name",
      };
    }

    // Create card with default stats
    const card = await CardService.create({
      name: cardName.trim(),
      image: null,
      ...DEFAULT_STATS,
    });

    // Update context
    context.setLastCard(card);

    return {
      success: true,
      message: `Created card "${card.name}" (ID: ${card.id})`,
      data: {
        commandType: "create_card",
        name: card.name,
        id: card.id,
        card,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create card",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle list cards command
 * Requirements: 4.2
 */
export const listCardsHandler: CommandHandler = async () => {
  try {
    const cards = await CardService.getAll();

    return {
      success: true,
      message: `Found ${cards.length} card(s)`,
      data: {
        commandType: "list_cards",
        count: cards.length,
        cards,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to list cards",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle show card command
 * Requirements: 4.3, 7.1
 */
export const showCardHandler: CommandHandler = async (params, context) => {
  try {
    const card = params.card as Card;

    if (!card) {
      return {
        success: false,
        message: "Card not found",
        error: "Card parameter missing",
      };
    }

    // Refresh imageUrl from OPFS (blob URLs from previous sessions are invalid)
    let freshImageUrl: string | null = null;
    if (card.imagePath) {
      freshImageUrl = await getImageUrl(card.imagePath);
    }
    const cardWithFreshImage: Card = {
      ...card,
      imageUrl: freshImageUrl ?? card.imageUrl,
    };

    // Load equipment for the card
    const equipment = await EquipmentService.getEquipment(card.id);
    let weapon: Weapon | null = null;

    if (equipment?.weaponId) {
      weapon = await WeaponService.getById(equipment.weaponId);
    }

    // Load gems for the card
    const gemEquipment = await GemEquipmentService.getCardGems(card.id);
    const gems: Gem[] = [];

    if (gemEquipment && gemEquipment.gemIds.length > 0) {
      const gemPromises = gemEquipment.gemIds.map((id) =>
        GemService.getById(id),
      );
      const loadedGems = await Promise.all(gemPromises);
      gems.push(...loadedGems.filter((g): g is Gem => g !== null));
    }

    // Update context
    context.setLastCard(cardWithFreshImage);

    return {
      success: true,
      message: `Card: ${cardWithFreshImage.name}`,
      data: {
        commandType: "show_card",
        name: cardWithFreshImage.name,
        id: cardWithFreshImage.id,
        hp: cardWithFreshImage.hp,
        atk: cardWithFreshImage.atk,
        def: cardWithFreshImage.def,
        spd: cardWithFreshImage.spd,
        card: cardWithFreshImage,
        weapon,
        gems,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to show card",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle delete card command
 * Requirements: 4.4
 */
export const deleteCardHandler: CommandHandler = async (params) => {
  try {
    const card = params.card as Card;

    if (!card) {
      return {
        success: false,
        message: "Card not found",
        error: "Card parameter missing",
      };
    }

    const deleted = await CardService.delete(card.id);

    if (!deleted) {
      return {
        success: false,
        message: `Failed to delete card "${card.name}"`,
        error: "Card not found in database",
      };
    }

    return {
      success: true,
      message: `Deleted card "${card.name}"`,
      data: {
        commandType: "delete_card",
        name: card.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to delete card",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// ============================================================================
// Battle Command Handlers
// ============================================================================

/**
 * Handle start battle command
 * Requirements: 5.1
 */
export const startBattleHandler: CommandHandler = async (params) => {
  try {
    const card1 = params.card1 as Card;
    const card2 = params.card2 as Card;

    if (!card1 || !card2) {
      return {
        success: false,
        message: "Two cards are required for battle",
        error: "Missing card parameters",
      };
    }

    // Select cards in battle store
    const store = useBattleStore.getState();
    await store.selectChallenger(card1);
    await store.selectOpponent(card2);

    // Start the battle
    store.startBattle();

    return {
      success: true,
      message: `Battle started: ${card1.name} vs ${card2.name}`,
      data: {
        commandType: "start_battle",
        card1: card1.name,
        card2: card2.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to start battle",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle battle history command
 * Requirements: 5.2
 */
export const battleHistoryHandler: CommandHandler = async () => {
  try {
    // TODO: Implement battle history service integration
    // For now, return a placeholder
    return {
      success: true,
      message: "Battle history feature coming soon",
      data: {
        commandType: "battle_history",
        count: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to get battle history",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle replay battle command
 * Requirements: 5.3
 */
export const replayBattleHandler: CommandHandler = async (params) => {
  try {
    const battleId = params.battleId as string;

    if (!battleId) {
      return {
        success: false,
        message: "Battle ID is required",
        error: "Missing battle ID",
      };
    }

    // TODO: Implement navigation to replay page
    // For now, return a placeholder
    return {
      success: true,
      message: `Opening battle replay (ID: ${battleId})`,
      data: {
        commandType: "replay_battle",
        id: battleId,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to replay battle",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// ============================================================================
// Equipment Command Handlers
// ============================================================================

/**
 * Handle equip weapon command
 * Requirements: 6.1
 */
export const equipWeaponHandler: CommandHandler = async (params, context) => {
  try {
    const weapon = params.weapon as Weapon;
    const card = params.card as Card;

    if (!weapon || !card) {
      return {
        success: false,
        message: "Weapon and card are required",
        error: "Missing parameters",
      };
    }

    await EquipmentService.equipWeapon(card.id, weapon.id);

    // Update context
    context.setLastWeapon(weapon);
    context.setLastCard(card);

    return {
      success: true,
      message: `Equipped weapon "${weapon.name}" to card "${card.name}"`,
      data: {
        commandType: "equip_weapon",
        weapon: weapon.name,
        card: card.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to equip weapon",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle unequip weapon command
 * Requirements: 6.2
 */
export const unequipWeaponHandler: CommandHandler = async (params, context) => {
  try {
    const card = params.card as Card;

    if (!card) {
      return {
        success: false,
        message: "Card is required",
        error: "Missing card parameter",
      };
    }

    await EquipmentService.unequipWeapon(card.id);

    // Update context
    context.setLastCard(card);

    return {
      success: true,
      message: `Unequipped weapon from card "${card.name}"`,
      data: {
        commandType: "unequip_weapon",
        card: card.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to unequip weapon",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle equip gem command
 * Requirements: 6.3
 */
export const equipGemHandler: CommandHandler = async (params, context) => {
  try {
    const gem = params.gem as Gem;
    const card = params.card as Card;

    if (!gem || !card) {
      return {
        success: false,
        message: "Gem and card are required",
        error: "Missing parameters",
      };
    }

    await GemEquipmentService.equipGem(card.id, gem.id);

    // Update context
    context.setLastGem(gem);
    context.setLastCard(card);

    return {
      success: true,
      message: `Equipped gem "${gem.name}" to card "${card.name}"`,
      data: {
        commandType: "equip_gem",
        gem: gem.name,
        card: card.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to equip gem",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle unequip gem command
 * Requirements: 6.4
 */
export const unequipGemHandler: CommandHandler = async (params, context) => {
  try {
    const card = params.card as Card;
    const gem = params.gem as Gem;

    if (!card || !gem) {
      return {
        success: false,
        message: "Card and gem are required",
        error: "Missing parameters",
      };
    }

    await GemEquipmentService.unequipGem(card.id, gem.id);

    // Update context
    context.setLastCard(card);

    return {
      success: true,
      message: `Unequipped gem from card "${card.name}"`,
      data: {
        commandType: "unequip_gem",
        card: card.name,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to unequip gem",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// ============================================================================
// Query Command Handlers
// ============================================================================

/**
 * Handle list weapons command
 * Requirements: 7.2
 */
export const listWeaponsHandler: CommandHandler = async () => {
  try {
    const weapons = await WeaponService.getAll();

    return {
      success: true,
      message: `Found ${weapons.length} weapon(s)`,
      data: {
        commandType: "list_weapons",
        count: weapons.length,
        weapons,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to list weapons",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle list gems command
 * Requirements: 7.3
 */
export const listGemsHandler: CommandHandler = async () => {
  try {
    const gems = await GemService.getAll();

    return {
      success: true,
      message: `Found ${gems.length} gem(s)`,
      data: {
        commandType: "list_gems",
        count: gems.length,
        gems,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to list gems",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Handle show stats command
 * Requirements: 7.4
 */
export const showStatsHandler: CommandHandler = async () => {
  try {
    const [cards, weapons, gems] = await Promise.all([
      CardService.getAll(),
      WeaponService.getAll(),
      GemService.getAll(),
    ]);

    return {
      success: true,
      message: `Game Stats: Cards: ${cards.length} | Weapons: ${weapons.length} | Gems: ${gems.length}`,
      data: {
        commandType: "show_stats",
        cards: cards.length,
        weapons: weapons.length,
        gems: gems.length,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to get stats",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

// ============================================================================
// Handler Registry
// ============================================================================

/**
 * Map of command types to handler functions
 */
export const commandHandlers: Record<string, CommandHandler> = {
  // Help commands
  help: helpHandler,
  help_category: helpCategoryHandler,

  // Card commands
  create_card: createCardHandler,
  list_cards: listCardsHandler,
  show_card: showCardHandler,
  delete_card: deleteCardHandler,

  // Battle commands
  start_battle: startBattleHandler,
  battle_history: battleHistoryHandler,
  replay_battle: replayBattleHandler,

  // Equipment commands
  equip_weapon: equipWeaponHandler,
  unequip_weapon: unequipWeaponHandler,
  equip_gem: equipGemHandler,
  unequip_gem: unequipGemHandler,

  // Query commands
  list_weapons: listWeaponsHandler,
  list_gems: listGemsHandler,
  show_stats: showStatsHandler,
};
