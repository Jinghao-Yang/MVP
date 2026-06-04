/**
 * useThrottledCallback Hook
 * 封装节流逻辑，限制函数在指定时间间隔内只能执行一次
 */
import { useCallback, useRef } from 'react';

/**
 * 节流回调 Hook
 * @param callback - 需要节流的回调函数
 * @param delay - 节流延迟时间（毫秒）
 * @returns 节流后的回调函数
 *
 * @example
 * ```tsx
 * const throttledScroll = useThrottledCallback(() => {
 *   console.log('Scroll event');
 * }, 200);
 *
 * window.addEventListener('scroll', throttledScroll);
 * ```
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      // 如果距离上次执行时间超过延迟时间，立即执行
      if (timeSinceLastRun >= delay) {
        lastRunRef.current = now;
        callback(...args);
      } else {
        // 否则，设置定时器在剩余时间后执行
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
          lastRunRef.current = Date.now();
          callback(...args);
          timeoutRef.current = null;
        }, delay - timeSinceLastRun);
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
}
