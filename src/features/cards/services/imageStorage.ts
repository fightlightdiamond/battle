/**
 * Image Storage Service using Origin Private File System (OPFS)
 * Stores images as files in the browser's private file system
 * and returns file paths for reference in IndexedDB
 */

const IMAGES_DIR = "card-images";

/**
 * Get the OPFS root directory
 */
async function getRoot(): Promise<FileSystemDirectoryHandle> {
  return await navigator.storage.getDirectory();
}

/**
 * Get or create the images directory
 */
async function getImagesDir(): Promise<FileSystemDirectoryHandle> {
  const root = await getRoot();
  return await root.getDirectoryHandle(IMAGES_DIR, { create: true });
}

/**
 * Generate a unique filename for an image
 */
function generateImageFilename(cardId: string, mimeType: string): string {
  const ext = mimeType.split("/")[1] || "png";
  return `${cardId}.${ext}`;
}

/**
 * Save an image file to OPFS
 * @returns The filename (path) of the saved image
 */
export async function saveImage(
  cardId: string,
  file: File | Blob
): Promise<string> {
  const imagesDir = await getImagesDir();
  const filename = generateImageFilename(cardId, file.type);

  const fileHandle = await imagesDir.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();

  await writable.write(file);
  await writable.close();

  return filename;
}

/**
 * Load an image from OPFS
 * @returns A Blob of the image, or null if not found
 */
export async function loadImage(filename: string): Promise<Blob | null> {
  try {
    const imagesDir = await getImagesDir();
    const fileHandle = await imagesDir.getFileHandle(filename);
    const file = await fileHandle.getFile();
    return file;
  } catch {
    // File not found or other error
    return null;
  }
}

/**
 * Delete an image from OPFS
 */
export async function deleteImage(filename: string): Promise<boolean> {
  try {
    const imagesDir = await getImagesDir();
    await imagesDir.removeEntry(filename);
    return true;
  } catch {
    // File not found or other error
    return false;
  }
}

/**
 * Create an object URL for an image stored in OPFS
 * Remember to revoke the URL when done using URL.revokeObjectURL()
 */
export async function getImageUrl(filename: string): Promise<string | null> {
  const blob = await loadImage(filename);
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
