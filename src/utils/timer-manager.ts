/**
 * TimerManager - 定时器管理器
 * 用于管理定时器的创建、清除和查询操作
 * 支持分组管理，便于批量操作
 */

/**
 * 定时器管理器类
 */
export class TimerManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * 设置定时器
   * @param key - 定时器键名，用于标识和后续操作
   * @param callback - 定时器触发时执行的回调函数
   * @param delay - 延迟时间（毫秒）
   */
  setTimer(key: string, callback: () => void, delay: number): void {
    this.clearTimer(key);
    const timerId = setTimeout(() => {
      this.timers.delete(key);
      callback();
    }, delay);
    this.timers.set(key, timerId);
  }

  /**
   * 清除指定的定时器
   * @param key - 定时器键名
   */
  clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * 检查指定的定时器是否存在
   * @param key - 定时器键名
   * @returns 如果定时器存在返回 true，否则返回 false
   */
  hasTimer(key: string): boolean {
    return this.timers.has(key);
  }

  /**
   * 清除所有打开定时器（非关闭定时器）
   * 关闭定时器的键名以 'close-' 开头
   */
  clearAllOpenTimers(): void {
    this.timers.forEach((timer, key) => {
      if (!key.startsWith('close-')) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    });
  }

  /**
   * 清除所有关闭定时器
   * 关闭定时器的键名以 'close-' 开头
   */
  clearAllCloseTimers(): void {
    this.timers.forEach((timer, key) => {
      if (key.startsWith('close-')) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    });
  }

  /**
   * 清除所有定时器
   */
  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }

  /**
   * 获取当前活跃的定时器数量
   * @returns 定时器数量
   */
  getActiveTimerCount(): number {
    return this.timers.size;
  }

  /**
   * 获取所有活跃定时器的键名
   * @returns 键名数组
   */
  getActiveTimerKeys(): string[] {
    return Array.from(this.timers.keys());
  }
}

/**
 * 全局定时器管理器实例
 * 用于全局共享的定时器管理
 */
export const timerManager = new TimerManager();

/**
 * 创建一个新的定时器管理器实例
 * @returns 新的 TimerManager 实例
 */
export function createTimerManager(): TimerManager {
  return new TimerManager();
}
