/* ================================================
   FILE: src/editor/components/PopupManager.tsx
   ================================================ */
import { useMemo, useCallback, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { PopupData } from '@/types';
import { usePopupStore, type PopupState } from '@/stores/popup-store';
import { PopoverCard } from './PopoverCard';

export function PopupManager() {
  const {
    popups,
    togglePin,
    toggleMinimize,
    closePopup,
    setIsUserDragging,
    handleMouseEnter,
    handleMouseLeave,
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    handleClick,
    handlePositionChange,
    handleSizeChange,
  } = usePopupStore(
    useShallow((state: PopupState) => ({
      popups: state.popups,
      togglePin: state.togglePin,
      toggleMinimize: state.toggleMinimize,
      closePopup: state.closePopup,
      setIsUserDragging: state.setIsUserDragging,
      handleMouseEnter: state.handleMouseEnter,
      handleMouseLeave: state.handleMouseLeave,
      handlePopoverMouseEnter: state.handlePopoverMouseEnter,
      handlePopoverMouseLeave: state.handlePopoverMouseLeave,
      handleClick: state.handleClick,
      handlePositionChange: state.handlePositionChange,
      handleSizeChange: state.handleSizeChange,
    }))
  );

  const visiblePopups = useMemo(() => {
    return popups.filter((p: PopupData) => !p.isMinimized);
  }, [popups]);

  const lastUpdateRef = useRef<Map<string, number>>(new Map());

  const throttledPositionChange = useCallback(
    (id: string, x: number, y: number) => {
      const now = performance.now();
      const lastUpdate = lastUpdateRef.current.get(id) || 0;
      if (now - lastUpdate >= 16) {
        lastUpdateRef.current.set(id, now);
        handlePositionChange(id, x, y);
      }
    },
    [handlePositionChange]
  );

  const throttledSizeChange = useCallback(
    (id: string, w: number, h: number) => {
      const now = performance.now();
      const lastUpdate = lastUpdateRef.current.get(id) || 0;
      if (now - lastUpdate >= 16) {
        lastUpdateRef.current.set(id, now);
        handleSizeChange(id, w, h);
      }
    },
    [handleSizeChange]
  );

  return (
    <>
      {visiblePopups.map((popup: PopupData) => (
        <PopoverCard
          key={popup.id}
          popup={popup}
          onClose={() => closePopup(popup.id)}
          onPinToggle={() => togglePin(popup.id)}
          onMinimizeToggle={() => toggleMinimize(popup.id)}
          onPositionChange={(x: number, y: number) => throttledPositionChange(popup.id, x, y)}
          onSizeChange={(w, h) => throttledSizeChange(popup.id, w, h)}
          onMouseEnter={() => handlePopoverMouseEnter(popup.id)}
          onMouseLeave={() => handlePopoverMouseLeave(popup.id)}
          onLinkHover={handleMouseEnter}
          onLinkLeave={handleMouseLeave}
          onLinkClick={(wikiId, depth) => handleClick(wikiId, depth)}
          onDragStart={() => setIsUserDragging(true)}
          onDragEnd={() => setIsUserDragging(false)}
        />
      ))}
    </>
  );
}
