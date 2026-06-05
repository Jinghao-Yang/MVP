import { toast } from 'sonner';

interface ErrorToastOptions {
  duration?: number;
  description?: string;
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
