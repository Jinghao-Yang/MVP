import { StateCreator } from 'zustand';
import type React from 'react';
import type { PopupData } from '@/types';
import { wikiDb } from '@/data/wikiDb';

export interface PopoverSlice {
  popups: PopupData[];
  loadingWikiId: string | null;
  activePopupId: string | null;
  isUserDragging: boolean;

  setIsUserDragging: (dragging: boolean) => void;
  handleMouseEnter: (
    e: MouseEvent | React.MouseEvent<Element>,
    wikiId: string,
    depth?: number
  ) => void;
  handleMouseLeave: (wikiId: string) => void;
  handlePopoverMouseEnter: (wikiId: string) => void;
  handlePopoverMouseLeave: (wikiId: string) => void;
  handlePositionChange: (id: string, x: number, y: number) => void;
  handleSizeChange: (id: string, width: number, height: number) => void;
  bringToFront: (id: string) => void;
  togglePin: (id: string) => void;
  toggleMinimize: (id: string) => void;
  closePopup: (id: string) => void;
  navigatePopover: (popupId: string, direction: 'forward' | 'backward') => void;
  openLinkInPopover: (popupId: string, targetWikiId: string) => void;
}

const hoverTimers = new Map<string, NodeJS.Timeout>();

export const createPopoverSlice: StateCreator<PopoverSlice, [], [], PopoverSlice> = (set, get) => ({
  popups: [],
  loadingWikiId: null,
  activePopupId: null,
  isUserDragging: false,

  setIsUserDragging: (dragging) => set({ isUserDragging: dragging }),

  handleMouseEnter: (e, wikiId, depth = 0) => {
    const state = get();
    if (state.isUserDragging) return;

    hoverTimers.forEach((timer, key) => {
      if (key.startsWith('close-')) {
        clearTimeout(timer);
        hoverTimers.delete(key);
      }
    });

    set({ loadingWikiId: wikiId });

    const clientX = e.clientX;
    const clientY = e.clientY;

    let adjustedX = clientX + window.scrollX;
    let adjustedY = clientY + window.scrollY + 20;
    const defaultWidth = 500;
    const defaultHeight = 320;

    if (adjustedX + defaultWidth > window.innerWidth) {
      adjustedX = window.innerWidth - defaultWidth - 24;
    }
    if (adjustedY + defaultHeight > window.innerHeight) {
      adjustedY = clientY + window.scrollY - defaultHeight - 20;
    }

    const timerId = setTimeout(() => {
      hoverTimers.delete(wikiId);
      set({ loadingWikiId: null });

      const currentPopups = get().popups;
      if (currentPopups.some((p) => p.id === wikiId)) {
        set({ activePopupId: wikiId });
        return;
      }

      const data = wikiDb[wikiId];
      if (data) {
        const newPopup: PopupData = {
          id: wikiId,
          title: data.title,
          excerpt: data.excerpt,
          badge: data.badge,
          badgeClass: data.badgeClass,
          x: adjustedX,
          y: adjustedY,
          width: defaultWidth,
          height: defaultHeight,
          depth: depth + 1,
          isPinned: false,
          isMinimized: false,
          history: [wikiId],
          historyIndex: 0,
        };
        set({
          popups: [...currentPopups.filter((p) => p.isPinned || p.depth <= depth), newPopup],
          activePopupId: wikiId,
        });
      }
    }, 300);

    hoverTimers.set(wikiId, timerId);
  },

  handleMouseLeave: (wikiId) => {
    set({ loadingWikiId: null });
    const state = get();
    if (state.isUserDragging) return;

    const existingTimer = hoverTimers.get(wikiId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      hoverTimers.delete(wikiId);
    }

    const closeTimerKey = `close-${wikiId}`;
    const timerId = setTimeout(() => {
      hoverTimers.delete(closeTimerKey);
      set((prev) => ({
        popups: prev.popups.filter((p) => (p.id === wikiId && p.isPinned ? true : p.id !== wikiId)),
      }));
    }, 600);

    hoverTimers.set(closeTimerKey, timerId);
  },

  handlePopoverMouseEnter: (wikiId) => {
    if (get().isUserDragging) return;
    const closeTimerKey = `close-${wikiId}`;
    const existingCloseTimer = hoverTimers.get(closeTimerKey);
    if (existingCloseTimer) {
      clearTimeout(existingCloseTimer);
      hoverTimers.delete(closeTimerKey);
    }
  },

  handlePopoverMouseLeave: (wikiId) => {
    get().handleMouseLeave(wikiId);
  },

  handlePositionChange: (id, x, y) => {
    set((prev) => ({
      popups: prev.popups.map((p) => (p.id === id ? { ...p, x, y, isPinned: true } : p)),
    }));
  },

  handleSizeChange: (id, width, height) => {
    set((prev) => ({
      popups: prev.popups.map((p) => (p.id === id ? { ...p, width, height, isPinned: true } : p)),
    }));
  },

  bringToFront: (id) => set({ activePopupId: id }),

  togglePin: (id) => {
    set((prev) => ({
      popups: prev.popups.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)),
    }));
  },

  toggleMinimize: (id) => {
    set((prev) => ({
      popups: prev.popups.map((p) => (p.id === id ? { ...p, isMinimized: !p.isMinimized } : p)),
    }));
  },

  closePopup: (id) =>
    set((prev) => ({
      popups: prev.popups.filter((p) => p.id !== id),
    })),

  navigatePopover: (popupId, direction) => {
    set((prev) => {
      const popups = prev.popups.map((p) => {
        if (p.id !== popupId) return p;

        let newHistory = [...(p.history || [p.id])];
        let newIndex = p.historyIndex ?? 0;

        if (direction === 'backward') {
          newIndex = Math.max(0, newIndex - 1);
        } else if (direction === 'forward') {
          newIndex = Math.min(newHistory.length - 1, newIndex + 1);
        }

        const activeId = newHistory[newIndex];
        const data = wikiDb[activeId] || {
          title: activeId,
          excerpt: 'Concept unmapped.',
          badge: 'Seedling',
          badgeClass: 'tag-badge-yellow',
        };

        return {
          ...p,
          title: data.title,
          excerpt: data.excerpt,
          badge: data.badge,
          badgeClass: data.badgeClass,
          history: newHistory,
          historyIndex: newIndex,
        };
      });
      return { popups };
    });
  },

  openLinkInPopover: (popupId, targetWikiId) => {
    set((prev) => {
      const popups = prev.popups.map((p) => {
        if (p.id !== popupId) return p;

        let newHistory = [...(p.history || [p.id])];
        let newIndex = p.historyIndex ?? 0;

        newHistory = newHistory.slice(0, newIndex + 1);
        newHistory.push(targetWikiId);
        newIndex = newHistory.length - 1;

        const data = wikiDb[targetWikiId] || {
          title: targetWikiId,
          excerpt: 'Concept unmapped.',
          badge: 'Seedling',
          badgeClass: 'tag-badge-yellow',
        };

        return {
          ...p,
          title: data.title,
          excerpt: data.excerpt,
          badge: data.badge,
          badgeClass: data.badgeClass,
          history: newHistory,
          historyIndex: newIndex,
        };
      });
      return { popups };
    });
  },
});
