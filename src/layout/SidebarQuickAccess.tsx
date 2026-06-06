/* ================================================
   FILE: src/layout/SidebarQuickAccess.tsx
   ================================================ */
import { Search, Plus } from 'lucide-react';

interface SidebarQuickAccessProps {
  openCommandPalette: () => void;
  onCreateNewNode: () => void;
}

export function SidebarQuickAccess({
  openCommandPalette,
  onCreateNewNode,
}: SidebarQuickAccessProps) {
  return (
    <div className="space-y-1">
      <button
        onClick={openCommandPalette}
        className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent"
      >
        <Search className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
        <span className="nav-text flex-1 text-neutral-600 group-hover:text-black font-semibold">
          Search Node
        </span>
        <kbd className="font-mono text-[9px] text-neutral-400 opacity-60">⌘K</kbd>
      </button>
      <button
        onClick={onCreateNewNode}
        className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent"
      >
        <Plus className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
        <span className="nav-text flex-1 text-neutral-600 group-hover:text-black font-semibold">
          New Page Node
        </span>
      </button>
    </div>
  );
}
