/* ================================================
   FILE: src/components/EditorPage.tsx
   ================================================ */
import { useState, memo } from 'react';
import type { EditorPageProps } from '../types';
import { PopoverProvider, usePopoverContext } from './PopoverContext';
import { PopoverCard } from './PopoverCard';
import { EditorContent } from './EditorContent';

function EditorPageContent({ isZenMode, onToggleZen, openPage, setStatus }: EditorPageProps) {
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
    setIsUserDragging
  } = usePopoverContext();

  return (
    <div className="page-panel flex-1 flex flex-row h-full overflow-hidden relative bg-transparent">
      {/* 传递 setStatus */}
      <EditorContent
        isZenMode={isZenMode}
        onToggleZen={onToggleZen}
        onOpenPage={openPage}
        activeSidebarTab={activeSidebarTab}
        onSidebarTabChange={setActiveSidebarTab}
        onLinkHover={handleMouseEnter}
        onLinkLeave={handleMouseLeave}
      />

      {/* ⚡ 移除了此处的 EditorSidebar 冗余渲染，防止其超出视口边界 */}

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
          onDragStart={() => setIsUserDragging(true)}
          onDragEnd={() => setIsUserDragging(false)}
        />
      ))}

      {popups.some(p => p.isMinimized) && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-wrap gap-2 items-center justify-end max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="font-mono text-[11px] uppercase text-neutral-400 mr-1 select-none">Minimized:</span>
          {popups.filter(p => p.isMinimized).map(p => (
            <button 
              key={p.id} 
              onClick={() => toggleMinimize(p.id)}
              className="px-2.5 py-1.5 glass-panel text-[11px] font-bold uppercase tracking-wider shadow-md hover-ui cursor-pointer border-none flex items-center gap-1 bg-white/70"
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

function EditorPageComponent(props: EditorPageProps) {
  return (
    <PopoverProvider setStatus={props.setStatus}>
      <EditorPageContent {...props} />
    </PopoverProvider>
  );
}

export const EditorPage = memo(EditorPageComponent);