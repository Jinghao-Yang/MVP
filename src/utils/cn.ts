import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility to merge tailwind classes gracefully
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
