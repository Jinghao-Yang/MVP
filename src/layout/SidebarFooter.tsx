/* ================================================
   FILE: src/layout/SidebarFooter.tsx
   ================================================ */
import { Pin, PinOff } from 'lucide-react';

interface SidebarFooterProps {
  isSidebarPinned: boolean;
  onTogglePin: () => void;
}

export function SidebarFooter({ isSidebarPinned, onTogglePin }: SidebarFooterProps) {
  return (
    <div className="p-4 border-t border-neutral-200/50 flex-none bg-transparent">
      <button
        onClick={onTogglePin}
        className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-mono text-neutral-500 hover:text-black transition-colors cursor-pointer border-none bg-transparent select-none"
      >
        {isSidebarPinned ? (
          <>
            <PinOff className="w-3.5 h-3.5" /> Unpin Rail
          </>
        ) : (
          <>
            <Pin className="w-3.5 h-3.5" /> Pin Rail
          </>
        )}
      </button>
    </div>
  );
}
