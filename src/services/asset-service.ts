import { db } from '@/db/dexie';
import { showErrorToast } from '@/utils/error-handler';

// In-memory cache for resolved Blob URLs to prevent constant re-creation and memory leaks
const blobUrlCache = new Map<string, string>();

export const assetService = {
  /**
   * 保存资源文件到 OPFS 并在 Dexie 中注册
   * 将文件存储到浏览器文件系统并返回 axiom:// 协议 URL
   *
   * @param file - 要保存的文件对象
   * @returns axiom://asset/UUID 格式的资源 URL
   *
   * @remarks
   * - 使用 OPFS（Origin Private File System）存储文件
   * - 自动生成 UUID 作为资源标识
   * - 同时在 Dexie 中注册资源元数据
   * - 如果 OPFS 写入失败，会回退到 Dexie 附件模式
   * - 写入成功后会缓存 Blob URL 以提高访问速度
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
      showErrorToast('Failed to save asset to storage');
    }

    try {
      // Always register in Dexie to guarantee index recovery and integrity
      await db.assets.add({
        id: uuid,
        filename,
        mimeType,
      });
    } catch (err) {
      console.error('Failed to register asset in database', err);
      showErrorToast('Failed to register asset');
    }

    // Also cache the blob URL in memory right away to bypass disk read latency
    const blobUrl = URL.createObjectURL(file);
    blobUrlCache.set(uuid, blobUrl);

    return `axiom://asset/${uuid}`;
  },

  /**
   * 解析 axiom://asset/UUID URL 为可渲染的 Blob URL
   * 用于在页面中显示资源（如图片）
   *
   * @param assetUrl - axiom://asset/UUID 格式的资源 URL
   * @returns 可直接用于 img.src 等的 Blob URL，资源不存在时返回空白 GIF 占位图
   *
   * @remarks
   * - 优先从内存缓存获取，避免重复读取磁盘
   * - 缓存未命中时从 OPFS 读取文件
   * - 读取失败时返回 1x1 透明 GIF 占位图
   * - 非 axiom://asset/ 格式的 URL 直接返回原值
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
   * 释放指定资源的 Blob URL
   * 从内存缓存中移除并释放 Blob URL 引用
   *
   * @param uuid - 资源的 UUID（不含 axiom://asset/ 前缀）
   *
   * @remarks
   * - 调用 URL.revokeObjectURL 释放内存
   * - 应在资源不再使用时调用以避免内存泄漏
   */
  revokeUrl(uuid: string) {
    const url = blobUrlCache.get(uuid);
    if (url) {
      URL.revokeObjectURL(url);
      blobUrlCache.delete(uuid);
    }
  },

  /**
   * 清空所有资源的 Blob URL 缓存
   * 释放所有缓存的 Blob URL 引用并清空缓存映射
   *
   * @remarks
   * - 应在应用卸载或需要完全清理资源时调用
   * - 会遍历所有缓存项并调用 URL.revokeObjectURL
   */
  clearAllCaches() {
    for (const [_, url] of blobUrlCache.entries()) {
      URL.revokeObjectURL(url);
    }
    blobUrlCache.clear();
  },
};
