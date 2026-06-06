/* ================================================
   FILE: src/editor/components/PopupManager.tsx
   ================================================ */
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
    savePopupPosition,
    savePopupSize,
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
      savePopupPosition: state.savePopupPosition,
      savePopupSize: state.savePopupSize,
    }))
  );

  const visiblePopups = popups.filter((p: PopupData) => !p.isMinimized);

  return (
    <>
      {visiblePopups.map((popup: PopupData) => (
        <PopoverCard
          key={popup.id}
          popup={popup}
          onClose={() => closePopup(popup.id)}
          onPinToggle={() => togglePin(popup.id)}
          onMinimizeToggle={() => toggleMinimize(popup.id)}
          onPositionChange={(x: number, y: number) => handlePositionChange(popup.id, x, y)}
          onSizeChange={(w, h) => handleSizeChange(popup.id, w, h)}
          onPositionSave={() => savePopupPosition(popup.id)}
          onSizeSave={() => savePopupSize(popup.id)}
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
