/**
 * useDebouncedCallback Hook
 * 封装防抖逻辑，延迟执行函数，在延迟期间再次调用会重新计时
 */
import { useRef } from 'react';

/**
 * 防抖回调 Hook
 * @param callback - 需要防抖的回调函数
 * @param delay - 防抖延迟时间（毫秒）
 * @returns 防抖后的回调函数
 *
 * @example
 * ```tsx
 * const debouncedSearch = useDebouncedCallback((query: string) => {
 *   fetchSearchResults(query);
 * }, 300);
 *
 * <input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */
export function useDebouncedCallback<T extends (...args: Parameters<T>) => unknown>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debounced = (...args: Parameters<T>) => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 设置新的定时器
    timeoutRef.current = setTimeout(() => {
      callback(...args);
      timeoutRef.current = null;
    }, delay);
  };

  return debounced as T;
}
