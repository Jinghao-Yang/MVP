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
    handleSizeChange