/**
 * 错误处理工具测试
 * 验证错误处理流程的正确性
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  showErrorToast,
  showSuccessToast,
  showInfoToast,
  showWarningToast,
  withRetry,
  setUnsavedChanges,
  getHasUnsavedChanges,
} from './error-handler';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

describe('error-handler.ts - 错误处理工具测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 重置未保存更改状态
    setUnsavedChanges(false);
  });

  describe('Toast 显示函数', () => {
    it('应该调用 showErrorToast', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      showErrorToast('Test error');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test error');
      consoleErrorSpy.mockRestore();
    });

    it('应该调用 showSuccessToast', () => {
      showSuccessToast('Test success');
    });

    it('应该调用 showInfoToast', () => {
      showInfoToast('Test info');
    });

    it('应该调用 showWarningToast', () => {
      showWarningToast('Test warning');
    });
  });

  describe('未保存更改管理', () => {
    it('应该正确设置和获取未保存更改状态', () => {
      expect(getHasUnsavedChanges()).toBe(false);

      setUnsavedChanges(true);
      expect(getHasUnsavedChanges()).toBe(true);

      setUnsavedChanges(false);
      expect(getHasUnsavedChanges()).toBe(false);
    });

    it('应该在设置 true 时添加 beforeunload 事件监听', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      setUnsavedChanges(true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      addEventListenerSpy.mockRestore();
    });

    it('应该在设置 false 时移除 beforeunload 事件监听', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      setUnsavedChanges(true);
      setUnsavedChanges(false);
      expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('withRetry 重试机制', () => {
    it('应该在成功时直接返回结果，不重试', async () => {
      const mockFn = vi.fn().mockResolvedValue('success');
      const result = await withRetry(mockFn);
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('应该在失败时重试指定次数', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      await expect(withRetry(mockFn, { maxRetries: 2 })).rejects.toThrow('Test error');
      expect(mockFn).toHaveBeenCalledTimes(3); // 1 次初始 + 2 次重试
    });

    it('应该在重试过程中成功时停止重试', async () => {
      let callCount = 0;
      const mockFn = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          return Promise.reject(new Error('Fail'));
        }
        return Promise.resolve('Success at last');
      });

      const result = await withRetry(mockFn, { maxRetries: 3 });
      expect(result).toBe('Success at last');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('应该尊重 shouldRetry 回调', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const shouldRetry = vi.fn().mockReturnValue(false);

      await expect(withRetry(mockFn, { maxRetries: 3, shouldRetry })).rejects.toThrow('Test error');
      expect(mockFn).toHaveBeenCalledTimes(1); // 只调用一次，因为 shouldRetry 返回 false
    });

    it('应该使用指数退避延迟', async () => {
      const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      await expect(
        withRetry(mockFn, {
          maxRetries: 1,
          initialDelayMs: 10,
          maxDelayMs: 100,
        })
      ).rejects.toThrow('Test error');

      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('集成测试 - 错误处理流程', () => {
    it('应该组合多个错误处理功能', async () => {
      // 测试未保存更改
      setUnsavedChanges(true);
      expect(getHasUnsavedChanges()).toBe(true);

      // 测试重试机制成功场景
      let attempts = 0;
      const flakyFunction = async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('Temporary failure');
        }
        return 'Success!';
      };

      const result = await withRetry(flakyFunction, { maxRetries: 2 });
      expect(result).toBe('Success!');
      expect(attempts).toBe(2);

      // 重置未保存更改
      setUnsavedChanges(false);
      expect(getHasUnsavedChanges()).toBe(false);
    });
  });
});
