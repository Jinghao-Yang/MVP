import React from 'react';
import { cn } from '@/utils/cn';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'danger' | 'success' | 'active';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: IconButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center rounded-lg border transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';

  const variantClasses = {
    default: 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700 text-zinc-300',
    ghost:
      'bg-transparent border-transparent hover:bg-zinc-800/50 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200',
    danger:
      'bg-red-950/20 border-red-900/30 text-red-400 hover:bg-red-950/35 hover:border-red-900/50',
    success:
      'bg-emerald-950/20 border-emerald-900/30 text-emerald-400 hover:bg-emerald-950/35 hover:border-emerald-900/50',
    active: 'bg-zinc-800 border-zinc-700 text-white',
  };

  const sizeClasses = {
    sm: 'p-1 h-7 w-7 text-xs',
    md: 'p-1.5 h-9 w-9 text-sm',
    lg: 'p-2 h-11 w-11 text-base',
  };

  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {children}
    </button>
  );
}
