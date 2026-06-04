import { useState, memo } from 'react';
import type { EditorPageProps } from '../types';
import { usePopover } from '../hooks/usePopover';
import { PopoverCard } from './PopoverCard';
import { EditorContent } from './EditorContent';

function EditorPageComponent({ isZenMode, onToggleZen, openPage, setStatus }: EditorPageProps) {
  const [activeSidebarTab, setActiveSidebarTab] = useState<'context' | 'annotations'>('context');

  const {
    popups,
    handleMouseEnter,
    handleMouseLeave,
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    handlePositionChange,
    handleSizeChange,
    togglePin,
    toggleMinimize,
    closePopup,
    handleDragStart,
    handleDragEnd
  } = usePopover(setStatus);

  return (
    <div className="page-panel flex-1 flex flex-row h-full overflow-hidden relative bg-transparent">
      <EditorContent
        isZenMode={isZenMode}
        onToggleZen={onToggleZen}
        onOpenPage={openPage}
        activeSidebarTab={activeSidebarTab}
        onSidebarTabChange={setActiveSidebarTab}
        onLinkHover={handleMouseEnter}
        onLinkLeave={handleMouseLeave}
      />

      {popups.filter(p => !p.isMinimized).map(popup => (
        <PopoverCard 
          key={popup.id}
          popup={popup}
          onClose={() => closePopup(popup.id)}
          onPinToggle={() => togglePin(popup.id)}
          onMinimizeToggle={() => toggleMinimize(popup.id)}
          onPositionChange={(x, y) => handlePositionChange(popup.id, x, y)}
          onSizeChange={(w, h) => handleSizeChange(popup.id, w, h)}
          onMouseEnter={() => handlePopoverMouseEnter(popup.id)}
          onMouseLeave={() => handlePopoverMouseLeave(popup.id)}
          onLinkHover={handleMouseEnter}
          onLinkLeave={handleMouseLeave}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        />
      ))}

      {popups.some(p => p.isMinimized) && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-wrap gap-2 items-center justify-end max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="font-mono text-[9px] uppercase text-neutral-400 mr-1 select-none">Minimized:</span>
          {popups.filter(p => p.isMinimized).map(p => (
            <button 
              key={p.id} 
              onClick={() => toggleMinimize(p.id)}
              className="px-2.5 py-1.5 glass-panel text-[10px] font-bold uppercase tracking-wider shadow-md hover-ui cursor-pointer border-none flex items-center gap-1 bg-white/70"
            >
              <span>📂</span>
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const EditorPage = memo(EditorPageComponent);