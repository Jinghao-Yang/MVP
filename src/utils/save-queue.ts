/**
 * SaveQueue - 保存队列机制
 *
 * 解决的问题：
 * 1. 避免竞态条件：快速连续输入时，确保所有变更最终被保存
 * 2. 数据丢失防护：组件卸载时强制 flush，确保未保存数据不丢失
 * 3. 保存与解析解耦：保存操作独立于解析操作
 */

import { db } from '@/db/dexie';

interface SaveTask {
  docId: string;
  content: string;
  timestamp: number;
}

export interface SaveQueueOptions {
  /** 防抖延迟时间（毫秒） */
  debounceMs: number;
  /** 保存成功回调 */
  onSave?: (docId: string, content: string) => void;
  /** 保存失败回调 */
  onError?: (docId: string, error: Error) => void;
}

/**
 * 保存队列类
 * 管理文档保存的队列，确保所有变更最终被保存
 */
export class SaveQueue {
  private queue: Map<string, SaveTask> = new Map();
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;
  private readonly options: SaveQueueOptions;

  constructor(options: Partial<SaveQueueOptions> = {}) {
    this.options = {
      debounceMs: 500,
      ...options,
    };
  }

  /**
   * 入队一个保存任务
   * @param docId - 文档 ID
   * @param content - 文档内容
   */
  enqueue(docId: string, content: string): void {
    // 添加或更新任务
    this.queue.set(docId, {
      docId,
      content,
      timestamp: Date.now(),
    });

    // 重置防抖定时器
    this.scheduleFlush();
  }

  /**
   * 安排 flush 操作
   */
  private scheduleFlush(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.flush();
    }, this.options.debounceMs);
  }

  /**
   * 立即执行所有待处理的保存任务
   * 用于组件卸载时强制保存
   */
  async flush(): Promise<void> {
    if (this.isFlushing || this.queue.size === 0) {
      return;
    }

    // 清除定时器
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    this.isFlushing = true;

    // 获取所有待处理的任务
    const tasks = Array.from(this.queue.values());
    this.queue.clear();

    try {
      // 批量保存所有任务
      await Promise.all(
        tasks.map(async (task) => {
          try {
            await db.documents.update(task.docId, {
              content: task.content,
              updatedAt: Date.now(),
            });
            this.options.onSave?.(task.docId, task.content);
          } catch (error) {
            this.options.onError?.(
              task.docId,
              error instanceof Error ? error : new Error(String(error))
            );
            // 保存失败时重新入队
            this.queue.set(task.docId, task);
          }
        })
      );
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * 检查是否有待处理的任务
   */
  hasPendingTasks(): boolean {
    return this.queue.size > 0;
  }

  /**
   * 获取待处理任务数量
   */
  getPendingCount(): number {
    return this.queue.size;
  }

  /**
   * 取消所有待处理的任务
   */
  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.queue.clear();
  }

  /**
   * 销毁队列，执行最后一次 flush
   */
  async destroy(): Promise<void> {
    await this.flush();
    this.cancel();
  }
}

/**
 * 创建全局保存队列实例
 */
export function createSaveQueue(options?: Partial<SaveQueueOptions>): SaveQueue {
  return new SaveQueue(options);
}
