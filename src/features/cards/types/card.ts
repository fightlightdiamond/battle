// Card entity stored in IndexedDB
export interface Card {
  id: string;
  name: string;

  // Core Stats (Tier 1)
  hp: number;
  atk: number;
  def: number;
  spd: number;

  // Combat Stats (Tier 2)
  critChance: number;
  critDamage: number;
  armorPen: number;
  lifesteal: number;

  // Metadata
  imagePath: string | null; // Path to image in OPFS
  imageUrl: string | null; // Object URL for display (generated at runtime)
  createdAt: number;
  updatedAt: number;
}

// Form input (without id and timestamps)
// New stat fields are optional - defaults will be applied by CardService
export interface CardFormInput {
  name: string;

  // Core Stats (Tier 1)
  hp?: number;
  atk?: number;
  def?: number;
  spd?: number;

  // Combat Stats (Tier 2)
  critChance?: number;
  critDamage?: number;
  armorPen?: number;
  lifesteal?: number;

  image: File | null;
}
