/**
 * useErrorHandler hook 测试
 * 验证全局错误监控和处理功能
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorHandler } from './useErrorHandler';

// Mock error-handler utils
vi.mock('@/utils/error-handler', () => ({
  showErrorToast: vi.fn(),
}));

describe('useErrorHandler hook 测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化状态管理', () => {
    it('应该正确初始化错误状态', () => {
      const { result } = renderHook(() => useErrorHandler());
      expect(result.current.errors).toEqual([]);
      expect(result.current.hasUnhandledErrors).toBe(false);
    });
  });

  describe('错误处理功能', () => {
    it('应该能够处理并记录错误', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');

      act(() => {
        result.current.handleError(testError, 'test context');
      });

      expect(result.current.errors.length).toBe(1);
      expect(result.current.errors[0].error).toBe(testError);
      expect(result.current.errors[0].context).toBe('test context');
      expect(result.current.hasUnhandledErrors).toBe(true);
    });

    it('应该能够清除单个错误', () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test error');

      act(() => {
        result.current.handleError(testError);
      });

      const errorId = result.current.errors[0].id;

      act(() => {
        result.current.clearError(errorId);
      });

      expect(result.current.errors.length).toBe(0);
      expect(result.current.hasUnhandledErrors).toBe(false);
    });

    it('应该能够清除所有错误', () => {
      const { result } = renderHook(() => useErrorHandler());

      act(() => {
        result.current.handleError(new Error('Error 1'));
        result.current.handleError(new Error('Error 2'));
      });

      expect(result.current.errors.length).toBe(2);

      act(() => {
        result.current.clearErrors();
      });

      expect(result.current.errors.length).toBe(0);
      expect(result.current.hasUnhandledErrors).toBe(false);
    });
  });

  describe('withErrorHandling 包装函数', () => {
    it('应该成功执行成功的 Promise', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const successFn = vi.fn().mockResolvedValue('success result');

      let resultValue;
      await act(async () => {
        resultValue = await result.current.withErrorHandling(successFn, 'test operation');
      });

      expect(successFn).toHaveBeenCalled();
      expect(resultValue).toBe('success result');
      expect(result.current.errors.length).toBe(0);
    });

    it('应该捕获和处理 Promise 错误', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const errorFn = vi.fn().mockRejectedValue(new Error('Test failure'));

      let resultValue;
      await act(async () => {
        resultValue = await result.current.withErrorHandling(errorFn, 'test failing operation');
      });

      expect(errorFn).toHaveBeenCalled();
      expect(resultValue).toBeUndefined();
      expect(result.current.errors.length).toBe(1);
      expect(result.current.hasUnhandledErrors).toBe(true);
    });

    it('应该在 rethrow=true 时重新抛出错误', async () => {
      const { result } = renderHook(() => useErrorHandler());
      const testError = new Error('Test rethrow');
      const errorFn = vi.fn().mockRejectedValue(testError);

      await expect(
        act(async () => {
          await result.current.withErrorHandling(errorFn, 'test', { rethrow: true });
        })
      ).rejects.toThrow('Test rethrow');
    });
  });

  describe('全局错误监听', () => {
    it('应该监听 window 错误事件', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      renderHook(() => useErrorHandler());

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));

      addEventListenerSpy.mockRestore();
    });

    it('应该在组件卸载时移除事件监听', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = renderHook(() => useErrorHandler());

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });
  });
});
