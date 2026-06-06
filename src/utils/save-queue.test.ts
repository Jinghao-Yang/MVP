/**
 * SaveQueue 测试
 * 验证保存队列机制的正确性
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SaveQueue, createSaveQueue } from './save-queue';

// Mock db
vi.mock('@/db/dexie', () => ({
  db: {
    documents: {
      update: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

describe('SaveQueue', () => {
  let saveQueue: SaveQueue;
  let mockOnSave: (docId: string, content: string) => void;
  let mockOnError: (docId: string, error: Error) => void;

  beforeEach(() => {
    vi.useFakeTimers();
    mockOnSave = vi.fn() as (docId: string, content: string) => void;
    mockOnError = vi.fn() as (docId: string, error: Error) => void;
    saveQueue = createSaveQueue({
      debounceMs: 500,
      onSave: mockOnSave,
      onError: mockOnError,
    });
  });

  afterEach(() => {
    saveQueue.destroy();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('enqueue', () => {
    it('should add task to queue', () => {
      saveQueue.enqueue('doc-1', 'content-1');
      expect(saveQueue.getPendingCount()).toBe(1);
    });

    it('should update existing task for same docId', () => {
      saveQueue.enqueue('doc-1', 'content-1');
      saveQueue.enqueue('doc-1', 'content-2');
      expect(saveQueue.getPendingCount()).toBe(1);
    });

    it('should handle multiple documents', () => {
      saveQueue.enqueue('doc-1', 'content-1');
      saveQueue.enqueue('doc-2', 'content-2');
      expect(saveQueue.getPendingCount()).toBe(2);
    });
  });

  describe('flush', () => {
    it('should flush tasks after debounce delay', async () => {
      saveQueue.enqueue('doc-1', 'content-1');

      // 快进到防抖延迟之后
      await vi.advanceTimersByTimeAsync(500);

      expect(mockOnSave).toHaveBeenCalledWith('doc-1', 'content-1');
    });

    it('should debounce rapid consecutive calls', async () => {
      // 快速连续调用
      saveQueue.enqueue('doc-1', 'content-1');
      await vi.advanceTimersByTimeAsync(100);

      saveQueue.enqueue('doc-1', 'content-2');
      await vi.advanceTimersByTimeAsync(100);

      saveQueue.enqueue('doc-1', 'content-3');
      await vi.advanceTimersByTimeAsync(500);

      // 应该只保存最后一次的内容
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith('doc-1', 'content-3');
    });

    it('should flush all pending tasks immediately', async () => {
      saveQueue.enqueue('doc-1', 'content-1');
      saveQueue.enqueue('doc-2', 'content-2');

      await saveQueue.flush();

      expect(mockOnSave).toHaveBeenCalledTimes(2);
      expect(saveQueue.hasPendingTasks()).toBe(false);
    });

    it('should handle concurrent flushes safely', async () => {
      saveQueue.enqueue('doc-1', 'content-1');

      // 同时触发多个 flush
      const flushPromises = [saveQueue.flush(), saveQueue.flush(), saveQueue.flush()];

      await Promise.all(flushPromises);

      // 应该只保存一次
      expect(mockOnSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('cancel', () => {
    it('should cancel all pending tasks', () => {
      saveQueue.enqueue('doc-1', 'content-1');
      saveQueue.enqueue('doc-2', 'content-2');

      saveQueue.cancel();

      expect(saveQueue.hasPendingTasks()).toBe(false);
      expect(saveQueue.getPendingCount()).toBe(0);
    });

    it('should prevent flush after cancel', async () => {
      saveQueue.enqueue('doc-1', 'content-1');
      saveQueue.cancel();

      await vi.advanceTimersByTimeAsync(500);

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should flush pending tasks on destroy', async () => {
      saveQueue.enqueue('doc-1', 'content-1');

      await saveQueue.destroy();

      expect(mockOnSave).toHaveBeenCalledWith('doc-1', 'content-1');
    });

    it('should clear all resources on destroy', async () => {
      saveQueue.enqueue('doc-1', 'content-1');

      await saveQueue.destroy();

      expect(saveQueue.hasPendingTasks()).toBe(false);
    });
  });

  describe('rapid consecutive input simulation', () => {
    it('should handle rapid typing simulation correctly', async () => {
      const docId = 'test-doc';
      const contents = Array.from({ length: 50 }, (_, i) => `content-${i}`);

      // 模拟快速连续输入
      for (const content of contents) {
        saveQueue.enqueue(docId, content);
        await vi.advanceTimersByTimeAsync(10); // 每次输入间隔 10ms
      }

      // 等待防抖延迟
      await vi.advanceTimersByTimeAsync(500);

      // 应该只保存最后一次的内容
      expect(mockOnSave).toHaveBeenCalledTimes(1);
      expect(mockOnSave).toHaveBeenCalledWith(docId, 'content-49');
    });

    it('should preserve data integrity during rapid changes', async () => {
      const docId = 'test-doc';
      const finalContent = 'final-content';

      // 快速连续更改
      for (let i = 0; i < 100; i++) {
        saveQueue.enqueue(docId, `content-${i}`);
      }
      saveQueue.enqueue(docId, finalContent);

      // 立即 flush
      await saveQueue.flush();

      // 最终保存的应该是最后一次的内容
      expect(mockOnSave).toHaveBeenCalledWith(docId, finalContent);
    });
  });
});
