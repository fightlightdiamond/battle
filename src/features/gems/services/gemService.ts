import type { Gem, GemFormInput } from "../types/gem";
import { gemFormSchema } from "../types/schemas";
import {
  saveGemImage,
  deleteGemImage,
  getGemImageUrl,
} from "./gemImageStorage";

// API base URL from environment variable with fallback
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

/**
 * Handle API response errors
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorText}`);
  }
  return response.json();
}

/**
 * Generate a UUID v4
 */
function generateId(): string {
  return crypto.randomUUID();
}

/**
 * Get current ISO timestamp
 */
function getTimestamp(): string {
  return new Date().toISOString();
}

/**
 * GemService - CRUD operations for gems using json-server REST API
 *
 * Requirements:
 * - 1.1: Create gems with unique id, name, description, skill type, trigger type,
 *        activation chance, cooldown, and effect parameters
 * - 1.2: View all available gems with their properties
 * - 1.3: Edit gem properties and persist changes
 * - 1.4: Delete gems and unequip from all cards
 */
export const GemService = {
  /**
   * Get all gems from the database
   * Requirement: 1.2
   */
  async getAll(): Promise<Gem[]> {
    const response = await fetch(`${API_BASE_URL}/gems`);
    const gems = await handleResponse<Gem[]>(response);

    // Load image URLs for gems with images
    const gemsWithImages = await Promise.all(
      gems.map(async (gem) => {
        if (gem.imagePath) {
          const imageUrl = await getGemImageUrl(gem.imagePath);
          return { ...gem, imageUrl };
        }
        return gem;
      }),
    );

    return gemsWithImages;
  },

  /**
   * Get a single gem by ID
   */
  async getById(id: string): Promise<Gem | null> {
    const response = await fetch(`${API_BASE_URL}/gems/${id}`);
    if (response.status === 404) {
      return null;
    }
    const gem = await handleResponse<Gem>(response);

    // Load image URL if gem has an image
    if (gem.imagePath) {
      const imageUrl = await getGemImageUrl(gem.imagePath);
      return { ...gem, imageUrl };
    }

    return gem;
  },

  /**
   * Create a new gem
   * Validates input against schema before creating
   * Generates unique ID and timestamps
   *
   * Requirement: 1.1
   */
  async create(input: GemFormInput): Promise<Gem> {
    // Validate input (excluding image field)
    const { image, ...dataToValidate } = input;
    const validationResult = gemFormSchema.safeParse(dataToValidate);
    if (!validationResult.success) {
      throw new Error(
        `Validation error: ${validationResult.error.issues.map((e) => e.message).join(", ")}`,
      );
    }

    const now = getTimestamp();
    const gemId = generateId();

    // Handle image upload
    let imagePath: string | null = null;
    let imageUrl: string | null = null;
    if (image) {
      imagePath = await saveGemImage(gemId, image);
      imageUrl = await getGemImageUrl(imagePath);
    }

    const newGem: Gem = {
      id: gemId,
      name: input.name,
      description: input.description,
      skillType: input.skillType,
      trigger: input.trigger,
      activationChance: input.activationChance,
      cooldown: input.cooldown,
      effectParams: input.effectParams,
      imagePath,
      imageUrl,
      createdAt: now,
      updatedAt: now,
    };

    const response = await fetch(`${API_BASE_URL}/gems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newGem),
    });

    return handleResponse<Gem>(response);
  },

  /**
   * Update an existing gem
   * Validates input and updates timestamp
   *
   * Requirement: 1.3
   */
  async update(id: string, input: Partial<GemFormInput>): Promise<Gem | null> {
    // Get existing gem
    const existing = await GemService.getById(id);
    if (!existing) {
      return null;
    }

    // Handle image update
    let imagePath = existing.imagePath;
    let imageUrl = existing.imageUrl;

    if (input.image !== undefined) {
      // Delete old image if exists
      if (existing.imagePath) {
        await deleteGemImage(existing.imagePath);
      }

      if (input.image) {
        // Save new image
        imagePath = await saveGemImage(id, input.image);
        imageUrl = await getGemImageUrl(imagePath);
      } else {
        // Clear image
        imagePath = null;
        imageUrl = null;
      }
    }

    // Merge with existing data (excluding image from validation)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { image: _unusedImage, ...inputWithoutImage } = input;
    const mergedInput: Omit<GemFormInput, "image"> = {
      name: inputWithoutImage.name ?? existing.name,
      description: inputWithoutImage.description ?? existing.description,
      skillType: inputWithoutImage.skillType ?? existing.skillType,
      trigger: inputWithoutImage.trigger ?? existing.trigger,
      activationChance:
        inputWithoutImage.activationChance ?? existing.activationChance,
      cooldown: inputWithoutImage.cooldown ?? existing.cooldown,
      effectParams: inputWithoutImage.effectParams ?? existing.effectParams,
    };

    // Validate merged input
    const validationResult = gemFormSchema.safeParse(mergedInput);
    if (!validationResult.success) {
      throw new Error(
        `Validation error: ${validationResult.error.issues.map((e) => e.message).join(", ")}`,
      );
    }

    const updatedGem: Gem = {
      ...existing,
      ...mergedInput,
      imagePath,
      imageUrl,
      updatedAt: getTimestamp(),
    };

    const response = await fetch(`${API_BASE_URL}/gems/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedGem),
    });

    return handleResponse<Gem>(response);
  },

  /**
   * Delete a gem by ID
   * Note: Caller should handle unequipping from cards before deletion
   *
   * Requirement: 1.4
   */
  async delete(id: string): Promise<boolean> {
    const existing = await GemService.getById(id);
    if (!existing) {
      return false;
    }

    // Delete image if exists
    if (existing.imagePath) {
      await deleteGemImage(existing.imagePath);
    }

    const response = await fetch(`${API_BASE_URL}/gems/${id}`, {
      method: "DELETE",
    });

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    return true;
  },

  /**
   * Clear all gems from the database (useful for testing)
   */
  async clear(): Promise<void> {
    const gems = await GemService.getAll();
    await Promise.all(gems.map((gem) => GemService.delete(gem.id)));
  },
};
