/* ================================================
   FILE: src/stores/editor-store.ts
   ================================================ */
import { create } from 'zustand';
import type React from 'react';
import { documentService } from '@/services/document-service';
import { showErrorToast, setUnsavedChanges } from '@/utils/error-handler';
import { db } from '@/db/dexie';
import { truncateText } from '@/utils/sanitize';
import type { PopupData } from '@/types';

// ================================================
// CONSTANTS & HELPERS
// ================================================
const DEFAULT_POPUP_CONFIG = {
  width: 500,
  height: 320,
  offsetX: 20,
  offsetY: 20,
  minWidth: 300,
  minHeight: 200,
  maxWidth: 800,
  maxHeight: 600,
} as const;

function ensureWithinBounds(
  x: number,
  y: number,
  width: number,
  height: number
): { x: number; y: number } {
  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const maxX = viewportWidth - width;
    const boundedX = Math.max(0, Math.min(x, maxX));
    const maxY = viewportHeight - height;
    const boundedY = Math.max(0, Math.min(y, maxY));
    return { x: boundedX, y: boundedY };
  }
  return { x, y };
}

function constrainSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(DEFAULT_POPUP_CONFIG.minWidth, Math.min(width, DEFAULT_POPUP_CONFIG.maxWidth)),
    height: Math.max(
      DEFAULT_POPUP_CONFIG.minHeight,
      Math.min(height, DEFAULT_POPUP_CONFIG.maxHeight)
    ),
  };
}

export interface RecentlyClosedPopup {
  popup: PopupData;
  closedAt: number;
}

export interface VirtualElement {
  getBoundingClientRect: () => DOMRect;
}

export interface EditorState {
  // ================================================
  // 核心编辑器状态 (Formerly EditorState)
  // ================================================
  documentText: string;
  originalDocumentText: string;
  isDirty: boolean;
  isSaving: boolean;

  setDocumentText: (text: string) => void;
  resetDocumentText: () => void;
  markAsSaved: () => void;
  loadDocumentText: (documentId: string) => Promise<void>;
  clearDocument: () => void;
  setIsSaving: (isSaving: boolean) => void;

  // ================================================
  // 核心窗口/弹窗管理状态 (Formerly PopupState)
  // ================================================
  popups: PopupData[];
  activePopupId: string | null;
  isUserDragging: boolean;
  recentlyClosedPopups: RecentlyClosedPopup[];

  hoveredElement: VirtualElement | null;
  hoveredWikiId: string | null;

  setPopups: (popups: PopupData[]) => void;
  bringToFront: (id: string) => void;
  togglePin: (id: string) => void;
  toggleMinimize: (id: string) => void;
  closePopup: (id: string) => void;
  restorePopup: (id: string) => void;
  setIsUserDragging: (dragging: boolean) => void;

  setHoveredLink: (element: HTMLElement | null, wikiId: string | null) => void;
  pinHoveredLink: () => Promise<void>;

  handleMouseEnter: (
    event: MouseEvent | React.MouseEvent<Element>,
    wikiId: string,
    stackIndex?: number
  ) => void;
  handleMouseLeave: (wikiId: string) => void;

  handlePopoverMouseEnter: (id: string) => void;
  handlePopoverMouseLeave: (id: string) => void;

  handleClick: (wikiId: string, stackIndex?: number) => void;

  handlePositionChange: (id: string, x: number, y: number) => void;
  handleSizeChange: (id: string, width: number, height: number) => void;

  savePopupPosition: (id: string) => Promise<void>;
  savePopupSize: (id: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  // ================================================
  // 核心编辑器状态初始值
  // ================================================
  documentText: '',
  originalDocumentText: '',
  isDirty: false,
  isSaving: false,

  setDocumentText: (text) => {
    const originalText = get().originalDocumentText;
    const isDirty = text !== originalText;
    set({
      documentText: text,
      isDirty,
    });
    setUnsavedChanges(isDirty);
  },

  resetDocumentText: () => {
    const originalText = get().originalDocumentText;
    set({
      documentText: originalText,
      isDirty: false,
    });
    setUnsavedChanges(false);
  },

  markAsSaved: () => {
    const currentText = get().documentText;
    set({
      originalDocumentText: currentText,
      isDirty: false,
    });
    setUnsavedChanges(false);
  },

  loadDocumentText: async (documentId) => {
    try {
      const doc = await documentService.getDocument(documentId);
      if (doc) {
        set({
          documentText: doc.content,
          originalDocumentText: doc.content,
          isDirty: false,
        });
        setUnsavedChanges(false);
      }
    } catch {
      showErrorToast('Failed to load document');
    }
  },

  clearDocument: () => {
    set({
      documentText: '',
      originalDocumentText: '',
      isDirty: false,
    });
    setUnsavedChanges(false);
  },

  setIsSaving: (isSaving) => set({ isSaving }),

  // ================================================
  // 核心窗口/弹窗状态初始值
  // ================================================
  popups: [],
  activePopupId: null,
  isUserDragging: false,
  recentlyClosedPopups: [],

  hoveredElement: null,
  hoveredWikiId: null,

  setPopups: (popups) => set({ popups }),
  bringToFront: (id) => set({ activePopupId: id }),

  togglePin: async (id) => {
    const popup = get().popups.find((p) => p.id === id);
    if (!popup) return;

    const newIsPinned = !popup.isPinned;
    set((state) => ({
      popups: state.popups.map((p) => (p.id === id ? { ...p, isPinned: newIsPinned } : p)),
    }));

    await db.popoverStates.put({
      id,
      x: popup.x,
      y: popup.y,
      width: popup.width,
      height: popup.height,
      isPinned: newIsPinned,
      isMinimized: popup.isMinimized,
    });
  },

  toggleMinimize: async (id) => {
    const popup = get().popups.find((p) => p.id === id);
    if (!popup) return;

    const newIsMinimized = !popup.isMinimized;
    set((state) => ({
      popups: state.popups.map((p) => (p.id === id ? { ...p, isMinimized: newIsMinimized } : p)),
    }));

    await db.popoverStates.put({
      id,
      x: popup.x,
      y: popup.y,
      width: popup.width,
      height: popup.height,
      isPinned: popup.isPinned,
      isMinimized: newIsMinimized,
    });
  },

  closePopup: async (id) => {
    const popupToClose = get().popups.find((p) => p.id === id);

    set((state) => {
      if (!popupToClose) {
        return { popups: state.popups.filter((p) => p.id !== id) };
      }
      const newRecentlyClosed = [
        { popup: popupToClose, closedAt: Date.now() },
        ...state.recentlyClosedPopups.filter((rc) => rc.popup.id !== id),
      ].slice(0, 5);

      return {
        popups: state.popups.filter((p) => p.id !== id),
        recentlyClosedPopups: newRecentlyClosed,
      };
    });

    await db.popoverStates.delete(id);
  },

  restorePopup: (id) =>
    set((state) => {
      const closedPopup = state.recentlyClosedPopups.find((rc) => rc.popup.id === id);
      if (!closedPopup) return state;
      return {
        popups: [...state.popups, { ...closedPopup.popup, isMinimized: false }],
        recentlyClosedPopups: state.recentlyClosedPopups.filter((rc) => rc.popup.id !== id),
        activePopupId: id,
      };
    }),

  setIsUserDragging: (dragging) => set({ isUserDragging: dragging }),

  setHoveredLink: (element, wikiId) => {
    if (get().isUserDragging) return;
    const virtualElement = element
      ? { getBoundingClientRect: () => element.getBoundingClientRect() }
      : null;
    set({ hoveredElement: virtualElement, hoveredWikiId: wikiId });
  },

  pinHoveredLink: async () => {
    const { hoveredWikiId, popups } = get();
    if (!hoveredWikiId) return;

    if (popups.some((p) => p.id === hoveredWikiId)) {
      set({ activePopupId: hoveredWikiId, hoveredElement: null, hoveredWikiId: null });
      return;
    }

    const docData = await documentService.getDocument(hoveredWikiId);
    if (docData) {
      const newPopup: PopupData = {
        id: hoveredWikiId,
        title: docData.title,
        excerpt: truncateText(docData.content, 180),
        badge: docData.badge,
        badgeClass: docData.badgeClass,
        x: 150,
        y: 150,
        width: DEFAULT_POPUP_CONFIG.width,
        height: DEFAULT_POPUP_CONFIG.height,
        stackIndex: popups.length + 1,
        isPinned: true,
        isMinimized: false,
      };

      set({
        popups: [...popups, newPopup],
        activePopupId: hoveredWikiId,
        hoveredElement: null,
        hoveredWikiId: null,
      });

      await db.popoverStates.put({
        id: hoveredWikiId,
        x: 150,
        y: 150,
        width: DEFAULT_POPUP_CONFIG.width,
        height: DEFAULT_POPUP_CONFIG.height,
        isPinned: true,
        isMinimized: false,
      });
    }
  },

  handlePositionChange: (id, x, y) => {
    const currentPopup = get().popups.find((p) => p.id === id);
    const width = currentPopup?.width ?? DEFAULT_POPUP_CONFIG.width;
    const height = currentPopup?.height ?? DEFAULT_POPUP_CONFIG.height;
    const boundedPosition = ensureWithinBounds(x, y, width, height);

    set((state) => ({
      popups: state.popups.map((p) =>
        p.id === id ? { ...p, x: boundedPosition.x, y: boundedPosition.y, isPinned: true } : p
      ),
    }));
  },

  handleSizeChange: (id, width, height) => {
    const constrainedSize = constrainSize(width, height);

    set((state) => ({
      popups: state.popups.map((p) =>
        p.id === id
          ? {
              ...p,
              width: constrainedSize.width,
              height: constrainedSize.height,
              isPinned: true,
            }
          : p
      ),
    }));
  },

  savePopupPosition: async (id) => {
    const popup = get().popups.find((p) => p.id === id);
    if (popup) {
      await db.popoverStates.put({
        id,
        x: popup.x,
        y: popup.y,
        width: popup.width,
        height: popup.height,
        isPinned: popup.isPinned,
        isMinimized: popup.isMinimized,
      });
    }
  },

  savePopupSize: async (id) => {
    const popup = get().popups.find((p) => p.id === id);
    if (popup) {
      await db.popoverStates.put({
        id,
        x: popup.x,
        y: popup.y,
        width: popup.width,
        height: popup.height,
        isPinned: popup.isPinned,
        isMinimized: popup.isMinimized,
      });
    }
  },

  handleMouseEnter: (event, wikiId) => {
    if (get().isUserDragging) return;
    if (window.getSelection()?.toString().trim().length) return;
    const element = event.currentTarget as HTMLElement;
    const virtualElement = { getBoundingClientRect: () => element.getBoundingClientRect() };
    set({ hoveredElement: virtualElement, hoveredWikiId: wikiId });
  },

  handleMouseLeave: () => {
    set({ hoveredElement: null, hoveredWikiId: null });
  },

  handlePopoverMouseEnter: (id) => {
    set({ activePopupId: id });
  },

  handlePopoverMouseLeave: () => {},

  handleClick: async (wikiId) => {
    const { popups } = get();
    if (popups.some((p) => p.id === wikiId)) {
      set({ activePopupId: wikiId, hoveredElement: null, hoveredWikiId: null });
      return;
    }

    const docData = await documentService.getDocument(wikiId);
    if (docData) {
      const newPopup: PopupData = {
        id: wikiId,
        title: docData.title,
        excerpt: docData.content.substring(0, 180) + '...',
        badge: docData.badge,
        badgeClass: docData.badgeClass,
        x: 150,
        y: 150,
        width: DEFAULT_POPUP_CONFIG.width,
        height: DEFAULT_POPUP_CONFIG.height,
        stackIndex: popups.length + 1,
        isPinned: true,
        isMinimized: false,
      };

      set({
        popups: [...popups, newPopup],
        activePopupId: wikiId,
        hoveredElement: null,
        hoveredWikiId: null,
      });

      await db.popoverStates.put({
        id: wikiId,
        x: 150,
        y: 150,
        width: DEFAULT_POPUP_CONFIG.width,
        height: DEFAULT_POPUP_CONFIG.height,
        isPinned: true,
        isMinimized: false,
      });
    }
  },
}));

// 兼容别名导出，确保无缝迁移而不引起全局组件消费报错
export const usePopupStore = useEditorStore;
export type PopupState = EditorState;
export type RecentlyClosedPopupFromPopupStore = RecentlyClosedPopup;
