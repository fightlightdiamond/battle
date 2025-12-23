/**
 * Image Storage Service for Gems using Origin Private File System (OPFS)
 * Stores gem images as files in the browser's private file system
 */

const IMAGES_DIR = "gem-images";

/**
 * Get the OPFS root directory
 */
async function getRoot(): Promise<FileSystemDirectoryHandle> {
  return await navigator.storage.getDirectory();
}

/**
 * Get or create the gem images directory
 */
async function getImagesDir(): Promise<FileSystemDirectoryHandle> {
  const root = await getRoot();
  return await root.getDirectoryHandle(IMAGES_DIR, { create: true });
}

/**
 * Generate a unique filename for a gem image
 */
function generateImageFilename(gemId: string, mimeType: string): string {
  const ext = mimeType.split("/")[1] || "png";
  return `${gemId}.${ext}`;
}

/**
 * Save a gem image file to OPFS
 * @returns The filename (path) of the saved image
 */
export async function saveGemImage(
  gemId: string,
  file: File | Blob,
): Promise<string> {
  const imagesDir = await getImagesDir();
  const filename = generateImageFilename(gemId, file.type);

  const fileHandle = await imagesDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(file);
  await writable.close();

  return filename;
}

/**
 * Load a gem image from OPFS
 * @returns A Blob of the image, or null if not found
 */
export async function loadGemImage(filename: string): Promise<Blob | null> {
  try {
    const imagesDir = await getImagesDir();
    const fileHandle = await imagesDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file;
  } catch {
    return null;
  }
}

/**
 * Delete a gem image from OPFS
 */
export async function deleteGemImage(filename: string): Promise<boolean> {
  try {
    const imagesDir = await getImagesDir();
    await imagesDir.removeEntry(filename);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create an object URL for a gem image stored in OPFS
 * Remember to revoke the URL when done using URL.revokeObjectURL()
 */
export async function getGemImageUrl(filename: string): Promise<string | null> {
  const blob = await loadGemImage(filename);
  if (!blob) return null;
  return URL.createObjectURL(blob);
}

/**
 * Check if OPFS is supported in the current browser
 */
export function isOPFSSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    "getDirectory" in navigator.storage
  );
}
