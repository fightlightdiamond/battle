/**
 * Mock Image Storage for testing
 * Uses in-memory Map instead of OPFS
 */

const imageStore = new Map<string, Blob>();

export async function saveImage(
  cardId: string,
  file: File | Blob
): Promise<string> {
  const ext = file.type.split("/")[1] || "png";
  const filename = `${cardId}.${ext}`;
  imageStore.set(filename, file);
  return filename;
}

export async function loadImage(filename: string): Promise<Blob | null> {
  return imageStore.get(filename) || null;
}

export async function deleteImage(filename: string): Promise<boolean> {
  return imageStore.delete(filename);
}

export async function getImageUrl(filename: string): Promise<string | null> {
  const blob = imageStore.get(filename);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

export function isOPFSSupported(): boolean {
  return true;
}

// Helper for tests to clear the store
export function clearImageStore(): void {
  imageStore.clear();
}
