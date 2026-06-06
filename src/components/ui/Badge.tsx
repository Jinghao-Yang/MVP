import React from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'purple' | 'default';
  children: React.ReactNode;
}

export function Badge({ variant = 'default', children, className, ...props }: BadgeProps) {
  const variantClasses = {
    blue: 'bg-[rgba(59,130,246,0.1)] text-blue-400 border-blue-500/20',
    green: 'bg-[rgba(34,197,94,0.1)] text-green-400 border-green-500/20',
    yellow: 'bg-[rgba(234,179,8,0.1)] text-yellow-400 border-yellow-500/20',
    red: 'bg-[rgba(239,68,68,0.1)] text-red-100 border-red-500/20 bg-red-950/20 text-red-400 border-red-900/30',
    purple: 'bg-[rgba(168,85,247,0.1)] text-purple-400 border-purple-500/20',
    gray: 'bg-zinc-800/50 text-zinc-400 border-zinc-700/30',
    default: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border tracking-wide select-none',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
