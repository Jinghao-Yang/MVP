import { useState, useCallback, useEffect } from 'react';
import { showErrorToast } from '@/utils/error-handler';

interface ErrorRecord {
  id: string;
  timestamp: number;
  error: Error;
  context?: string;
  handled: boolean;
}

interface UseErrorHandlerReturn {
  errors: ErrorRecord[];
  hasUnhandledErrors: boolean;
  handleError: (error: Error, context?: string) => void;
  clearErrors: () => void;
  clearError: (id: string) => void;
  withErrorHandling: <T>(
    fn: () => Promise<T>,
    context?: string,
    options?: { showToast?: boolean; rethrow?: boolean }
  ) => Promise<T | undefined>;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errors, setErrors] = useState<ErrorRecord[]>([]);

  const hasUnhandledErrors = errors.some((e) => !e.handled);

  const handleError = useCallback((error: Error, context?: string) => {
    console.error('Error caught by useErrorHandler:', {
      error,
      context,
      timestamp: new Date().toISOString(),
    });

    const record: ErrorRecord = {
      id: generateId(),
      timestamp: Date.now(),
      error,
      context,
      handled: false,
    };

    setErrors((prev) => [...prev, record]);
    showErrorToast(error.message, { description: context });

    return record;
  }, []);

  const clearErrors = useCallback(() => {
    setErrors([]);
  }, []);

  const clearError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const withErrorHandling = useCallback(
    async <T>(
      fn: () => Promise<T>,
      context?: string,
      options: { showToast?: boolean; rethrow?: boolean } = {}
    ): Promise<T | undefined> => {
      const { showToast = true, rethrow = false } = options;
      try {
        return await fn();
      } catch (error) {
        if (error instanceof Error) {
          if (showToast) {
            handleError(error, context);
          } else {
            console.error('Error in withErrorHandling:', error, context);
            const record: ErrorRecord = {
              id: generateId(),
              timestamp: Date.now(),
              error,
              context,
              handled: false,
            };
            setErrors((prev) => [...prev, record]);
          }
        } else {
          const unknownError = new Error('Unknown error occurred');
          if (showToast) {
            handleError(unknownError, context);
          }
        }
        if (rethrow) {
          throw error;
        }
        return undefined;
      }
    },
    [handleError]
  );

  useEffect(() => {
    const handleWindowError = (event: ErrorEvent) => {
      event.preventDefault();
      handleError(event.error || new Error(event.message), 'window.onerror');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
      handleError(error, 'unhandledrejection');
    };

    window.addEventListener('error', handleWindowError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleWindowError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [handleError]);

  return {
    errors,
    hasUnhandledErrors,
    handleError,
    clearErrors,
    clearError,
    withErrorHandling,
  };
}
