import React from 'react';
import { cn } from '@/utils/cn';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function GlassPanel({
  hoverEffect = false,
  className,
  children,
  ...props
}: GlassPanelProps) {
  return (
    <div
      className={cn(
        'bg-zinc-900/60 backdrop-blur-md border border-zinc-800/40 rounded-xl overflow-hidden transition-all duration-300',
        hoverEffect &&
          'hover:border-zinc-700/60 hover:bg-zinc-900/80 hover:shadow-lg hover:shadow-black/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
