/* ================================================
   FILE: src/editor/EditorPage.tsx
   ================================================ */
import { memo, useMemo } from 'react';
import type { EditorPageProps } from '@/types';
import { useAppStore } from '@/store/useAppStore';
import { PopoverCard } from './components/PopoverCard';
import { EditorContent } from './EditorContent';
import { EditorSidebar } from './EditorSidebar';

export function EditorPageContent({ isZenMode, onToggleZen, openPage }: EditorPageProps) {
  const popups = useAppStore((state) => state.popups);
  const handleMouseEnter = useAppStore((state) => state.handleMouseEnter);
  const handleMouseLeave = useAppStore((state) => state.handleMouseLeave);
  const handlePopoverMouseEnter = useAppStore((state) => state.handlePopoverMouseEnter);
  const handlePopoverMouseLeave = useAppStore((state) => state.handlePopoverMouseLeave);
  const handlePositionChange = useAppStore((state) => state.handlePositionChange);
  const handleSizeChange = useAppStore((state) => state.handleSizeChange);
  const togglePin = useAppStore((state) => state.togglePin);
  const toggleMinimize = useAppStore((state) => state.toggleMinimize);
  const closePopup = useAppStore((state) => state.closePopup);
  const setIsUserDragging = useAppStore((state) => state.setIsUserDragging);

  const visiblePopups = useMemo(() => {
    return popups.filter((p) => !p.isMinimized);
  }, [popups]);

  const minimizedPopups = useMemo(() => {
    return popups.filter((p) => p.isMinimized);
  }, [popups]);

  return (
    <div className="page-panel flex-1 flex flex-row h-full overflow-hidden relative bg-transparent">
      {/* 左侧正文编辑器 */}
      <EditorContent isZenMode={isZenMode} onToggleZen={onToggleZen} onOpenPage={openPage} />

      {/* 右侧常驻批注边栏 */}
      <EditorSidebar isZenMode={isZenMode} />

      {visiblePopups.map((popup) => (
        <PopoverCard
          key={popup.id}
          popup={popup}
          onClose={() => closePopup(popup.id)}
          onPinToggle={() => togglePin(popup.id)}
          onMinimizeToggle={() => toggleMinimize(popup.id)}
          onPositionChange={(x: number, y: number) => handlePositionChange(popup.id, x, y)}
          onSizeChange={(w, h) => handleSizeChange(popup.id, w, h)}
          onMouseEnter={() => handlePopoverMouseEnter(popup.id)}
          onMouseLeave={() => handlePopoverMouseLeave(popup.id)}
          onLinkHover={handleMouseEnter}
          onLinkLeave={handleMouseLeave}
          onDragStart={() => setIsUserDragging(true)}
          onDragEnd={() => setIsUserDragging(false)}
        />
      ))}

      {minimizedPopups.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-wrap gap-2 items-center justify-end max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="font-mono text-xs uppercase text-neutral-400 mr-1 select-none">
            Minimized:
          </span>
          {minimizedPopups.map((p) => (
            <button
              key={p.id}
              onClick={() => toggleMinimize(p.id)}
              className="px-2.5 py-1.5 glass-panel text-xs font-bold uppercase tracking-wider shadow-md hover-ui cursor-pointer border-none flex items-center gap-1 bg-white/70"
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

export const EditorPage = memo(EditorPageContent);
