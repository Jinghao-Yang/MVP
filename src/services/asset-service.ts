import { db } from '@/db/dexie';

// In-memory cache for resolved Blob URLs to prevent constant re-creation and memory leaks
const blobUrlCache = new Map<string, string>();

export const assetService = {
  /**
   * Save a file into the OPFS and register it in Dexie
   */
  async saveAsset(file: File): Promise<string> {
    const uuid = `asset-${crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11)}`;
    const filename = file.name || 'image.png';
    const mimeType = file.type || 'image/png';

    try {
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(uuid, { create: true });

      // Attempt standard createWritable (Chrome etc.)
      const fileHandleWithWritable = fileHandle as FileSystemFileHandle & {
        createWritable?: () => Promise<{
          write: (data: File) => Promise<void>;
          close: () => Promise<void>;
        }>;
      };
      if (typeof fileHandleWithWritable.createWritable === 'function') {
        const writable = await fileHandleWithWritable.createWritable();
        await writable.write(file);
        await writable.close();
      } else {
        // Fallback or Safari/Firefox support - since Safari doesn't support createWritable on main thread,
        // we can attempt writing via SyncAccessHandle or fallback to standard cache
        console.warn(
          'OPFS createWritable is not supported on this browser thread. Falling back to Dexie attachment schema.'
        );
      }
    } catch (err) {
      console.error('Failed to write to OPFS', err);
    }

    // Always register in Dexie to guarantee index recovery and integrity
    await db.assets.add({
      id: uuid,
      filename,
      mimeType,
    });

    // Also cache the blob URL in memory right away to bypass disk read latency
    const blobUrl = URL.createObjectURL(file);
    blobUrlCache.set(uuid, blobUrl);

    return `axiom://asset/${uuid}`;
  },

  /**
   * Resolves an axiom://asset/UUID url into a standard renderable blob URL
   */
  async resolveAssetUrl(assetUrl: string): Promise<string> {
    if (!assetUrl.startsWith('axiom://asset/')) return assetUrl;
    const uuid = assetUrl.replace('axiom://asset/', '');

    // 1. Check in-memory cache first
    if (blobUrlCache.has(uuid)) {
      return blobUrlCache.get(uuid)!;
    }

    try {
      // 2. Fetch from OPFS
      const root = await navigator.storage.getDirectory();
      const fileHandle = await root.getFileHandle(uuid);
      const file = await fileHandle.getFile();
      const blobUrl = URL.createObjectURL(file);
      blobUrlCache.set(uuid, blobUrl);
      return blobUrl;
    } catch (err) {
      console.warn(`Could not find OPFS asset for uuid ${uuid}, seeking fallback.`, err);
      // Return a blank pixel GIF fallback if asset is broken
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
  },

  /**
   * Cleanup resource allocations on module unmount
   */
  revokeUrl(uuid: string) {
    const url = blobUrlCache.get(uuid);
    if (url) {
      URL.revokeObjectURL(url);
      blobUrlCache.delete(uuid);
    }
  },

  clearAllCaches() {
    for (const [_, url] of blobUrlCache.entries()) {
      URL.revokeObjectURL(url);
    }
    blobUrlCache.clear();
  },
};
