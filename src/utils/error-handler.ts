import { toast } from 'sonner';

interface ErrorToastOptions {
  duration?: number;
  description?: string;
}

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export function showErrorToast(message: string, options: ErrorToastOptions = {}): void {
  console.error(message);
  toast.error(message, {
    duration: options.duration || 5000,
    description: options.description,
  });
}

export function showSuccessToast(message: string, options: ErrorToastOptions = {}): void {
  toast.success(message, {
    duration: options.duration || 3000,
    description: options.description,
  });
}

export function showInfoToast(message: string, options: ErrorToastOptions = {}): void {
  toast.info(message, {
    duration: options.duration || 4000,
    description: options.description,
  });
}

export function showWarningToast(message: string, options: ErrorToastOptions = {}): void {
  toast.warning(message, {
    duration: options.duration || 4000,
    description: options.description,
  });
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffFactor = 2,
    shouldRetry = () => true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      if (!shouldRetry(lastError, attempt)) {
        throw lastError;
      }

      const delayMs = Math.min(initialDelayMs * Math.pow(backoffFactor, attempt), maxDelayMs);

      console.warn(`Attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`, lastError);
      await delay(delayMs);
    }
  }

  throw lastError;
}

let hasUnsavedChanges = false;
let unsavedChangesHandler: ((e: BeforeUnloadEvent) => void) | null = null;

export function setUnsavedChanges(value: boolean): void {
  hasUnsavedChanges = value;

  if (value && !unsavedChangesHandler) {
    unsavedChangesHandler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', unsavedChangesHandler);
  } else if (!value && unsavedChangesHandler) {
    window.removeEventListener('beforeunload', unsavedChangesHandler);
    unsavedChangesHandler = null;
  }
}

export function getHasUnsavedChanges(): boolean {
  return hasUnsavedChanges;
}
