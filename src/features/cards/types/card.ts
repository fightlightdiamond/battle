// Card entity stored in IndexedDB
export interface Card {
  id: string;
  name: string;
  atk: number;
  hp: number;
  imagePath: string | null; // Path to image in OPFS
  imageUrl: string | null; // Object URL for display (generated at runtime)
  createdAt: number;
  updatedAt: number;
}

// Form input (without id and timestamps)
export interface CardFormInput {
  name: string;
  atk: number;
  hp: number;
  image: File | null;
}
