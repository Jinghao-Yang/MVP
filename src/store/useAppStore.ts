/* ================================================
   FILE: src/store/useAppStore.ts
   ================================================ */
import { create } from 'zustand';
import type React from 'react';
import type { PopupData } from '@/types';
import { wikiDb } from '@/data/wikiDb';

interface AppStore {
  activePage: string;
  isSidebarHovered: boolean;
  isZenMode: boolean;
  isCommandPaletteOpen: boolean;
  statusMsg: string;
  showStatus: boolean;
  quickCaptureText: string;
  documentText: string;

  // Popover State
  popups: PopupData[];
  loadingWikiId: string | null;
  activePopupId: string | null;
  isUserDragging: boolean;

  // Actions
  setActivePage: (page: string) => void;
  setSidebarHovered: (hovered: boolean) => void;
  setZenMode: (zen: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setStatus: (msg: string) => void;
  setQuickCaptureText: (text: string) => void;
  setDocumentText: (text: string) => void;
  setIsUserDragging: (dragging: boolean) => void;

  // Popover Actions
  // 修复：将参数签名调整为接收 MouseEvent，完美匹配 EditorPage 与 EditorContent 的调用
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

let statusTimeout: NodeJS.Timeout | null = null;
const hoverTimers = new Map<string, NodeJS.Timeout>();

export const useAppStore = create<AppStore>((set, get) => ({
  activePage: 'project',
  isSidebarHovered: false,
  isZenMode: false,
  isCommandPaletteOpen: false,
  statusMsg: 'System active.',
  showStatus: true,
  quickCaptureText: '',
  documentText: '',

  popups: [],
  loadingWikiId: null,
  activePopupId: null,
  isUserDragging: false,

  setActivePage: (page) => set({ activePage: page, isZenMode: false, isSidebarHovered: false }),
  setSidebarHovered: (hovered) => {
    if (get().isZenMode) return;
    set({ isSidebarHovered: hovered });
  },
  setZenMode: (zen) => set({ isZenMode: zen }),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  setStatus: (msg) => {
    set({ statusMsg: msg, showStatus: true });
    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      set({ showStatus: false });
    }, 2500);
  },

  setQuickCaptureText: (text) => set({ quickCaptureText: text }),
  setDocumentText: (text) => set({ documentText: text }),
  setIsUserDragging: (dragging) => set({ isUserDragging: dragging }),

  // 修复：在内部直接解构出 clientX & clientY，完美贴合 HTML5/React 事件体系
  handleMouseEnter: (e, wikiId, depth = 0) => {
    const state = get();
    if (state.isUserDragging) return;

    const closeTimerKey = `close-${wikiId}`;
    const existingCloseTimer = hoverTimers.get(closeTimerKey);
    if (existingCloseTimer) {
      clearTimeout(existingCloseTimer);
      hoverTimers.delete(closeTimerKey);
    }

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
        state.setStatus(`Rendered: ${data.title}`);
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
    get().setStatus('Pinned node to canvas.');
  },

  toggleMinimize: (id) => {
    set((prev) => ({
      popups: prev.popups.map((p) => (p.id === id ? { ...p, isMinimized: !p.isMinimized } : p)),
    }));
    get().setStatus('Minimized focus card.');
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

        // Truncate future forward history
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
}));
