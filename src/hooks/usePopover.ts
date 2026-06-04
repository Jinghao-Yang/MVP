/* ================================================
   FILE: src/hooks/usePopover.ts
   ================================================ */
import { usePopoverContext } from '@/context/PopoverContext';

export function usePopover() {
  const context = usePopoverContext();
  return {
    popups: context.popups,
    loadingWikiId: context.loadingWikiId,
    handleMouseEnter: context.handleMouseEnter,
    handleMouseLeave: context.handleMouseLeave,
    handlePopoverMouseEnter: context.handlePopoverMouseEnter,
    handlePopoverMouseLeave: context.handlePopoverMouseLeave,
    handlePositionChange: context.handlePositionChange,
    handleSizeChange: context.handleSizeChange,
    togglePin: context.togglePin,
    toggleMinimize: context.toggleMinimize,
    closePopup: context.closePopup,
    navigatePopover: context.navigatePopover,
    handleDragStart: () => context.setIsUserDragging(true),
    handleDragEnd: () => context.setIsUserDragging(false),
  };
}
