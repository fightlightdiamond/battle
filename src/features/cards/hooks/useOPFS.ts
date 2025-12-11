import { useState, useEffect, useCallback } from "react";
import {
  saveImage,
  loadImage,
  deleteImage,
  getImageUrl,
  isOPFSSupported,
} from "../services/imageStorage";

/**
 * Hook to check if OPFS is supported
 */
export function useOPFSSupport() {
  // isOPFSSupported is synchronous, no need for effect
  return isOPFSSupported();
}

/**
 * Hook to load an image URL from OPFS
 * Automatically revokes the URL on cleanup
 */
export function useOPFSImage(imagePath: string | null) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!imagePath) {
      setImageUrl(null);
      return;
    }

    let isMounted = true;
    let url: string | null = null;

    const loadImageUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        url = await getImageUrl(imagePath);
        if (isMounted) {
          setImageUrl(url);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err : new Error("Failed to load image")
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadImageUrl();

    return () => {
      isMounted = false;
      // Revoke URL on cleanup to prevent memory leaks
      if (url) {
        URL.revokeObjectURL(url);
      }
    };
  }, [imagePath]);

  return { imageUrl, isLoading, error };
}

/**
 * Hook for OPFS image operations (save, load, delete)
 */
export function useOPFSOperations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const save = useCallback(async (cardId: string, file: File | Blob) => {
    setIsLoading(true);
    setError(null);

    try {
      const path = await saveImage(cardId, file);
      return path;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to save image");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const load = useCallback(async (filename: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await loadImage(filename);
      return blob;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to load image");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const remove = useCallback(async (filename: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await deleteImage(filename);
      return success;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to delete image");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getUrl = useCallback(async (filename: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const url = await getImageUrl(filename);
      return url;
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("Failed to get image URL");
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    save,
    load,
    remove,
    getUrl,
    isLoading,
    error,
  };
}
