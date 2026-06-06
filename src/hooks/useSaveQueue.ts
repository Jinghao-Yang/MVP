/**
 * useSaveQueue Hook
 * 封装保存队列逻辑，提供组件级别的保存管理
 */
import { useEffect, useRef, useCallback } from 'react';
import { SaveQueue, createSaveQueue } from '@/utils/save-queue';

interface UseSaveQueueOptions {
  /** 防抖延迟时间（毫秒） */
  debounceMs?: number;
  /** 保存成功回调 */
  onSave?: (docId: string, content: string) => void;
  /** 保存失败回调 */
  onError?: (docId: string, error: Error) => void;
}

interface UseSaveQueueReturn {
  /** 入队保存任务 */
  enqueueSave: (docId: string, content: string) => void;
  /** 立即执行所有待处理的保存任务 */
  flush: () => Promise<void>;
  /** 检查是否有待处理的任务 */
  hasPendingTasks: () => boolean;
  /** 获取待处理任务数量 */
  getPendingCount: () => number;
  /** 取消所有待处理的任务 */
  cancel: () => void;
}

/**
 * 保存队列 Hook
 * 管理文档保存的队列，确保所有变更最终被保存
 * 组件卸载时自动执行 flush
 */
export function useSaveQueue(options: UseSaveQueueOptions = {}): UseSaveQueueReturn {
  const { debounceMs = 500, onSave, onError } = options;

  // 使用 ref 保存 SaveQueue 实例，避免重新创建
  const saveQueueRef = useRef<SaveQueue | null>(null);

  // 使用 ref 保存回调，避免依赖变化导致重新创建
  const onSaveRef = useRef(onSave);
  const onErrorRef = useRef(onError);

  // 更新 ref
  onSaveRef.current = onSave;
  onErrorRef.current = onError;

  // 初始化 SaveQueue
  if (saveQueueRef.current === null) {
    saveQueueRef.current = createSaveQueue({
      debounceMs,
      onSave: (docId, content) => {
        onSaveRef.current?.(docId, content);
      },
      onError: (docId, error) => {
        onErrorRef.current?.(docId, error);
      },
    });
  }

  // 入队保存任务
  const enqueueSave = useCallback((docId: string, content: string) => {
    saveQueueRef.current?.enqueue(docId, content);
  }, []);

  // 立即执行所有待处理的保存任务
  const flush = useCallback(async () => {
    await saveQueueRef.current?.flush();
  }, []);

  // 检查是否有待处理的任务
  const hasPendingTasks = useCallback(() => {
    return saveQueueRef.current?.hasPendingTasks() ?? false;
  }, []);

  // 获取待处理任务数量
  const getPendingCount = useCallback(() => {
    return saveQueueRef.current?.getPendingCount() ?? 0;
  }, []);

  // 取消所有待处理的任务
  const cancel = useCallback(() => {
    saveQueueRef.current?.cancel();
  }, []);

  // 组件卸载时强制 flush
  useEffect(() => {
    return () => {
      // 使用同步方式尝试保存（在 beforeunload 场景下）
      if (saveQueueRef.current?.hasPendingTasks()) {
        // 在组件卸载时立即执行 flush
        saveQueueRef.current.flush().catch((error) => {
          console.error('Failed to flush save queue on unmount:', error);
        });
      }
    };
  }, []);

  return {
    enqueueSave,
    flush,
    hasPendingTasks,
    getPendingCount,
    cancel,
  };
}
