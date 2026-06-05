/* ================================================
   FILE: src/stores/popup-store.ts
   ================================================ */
import { create } from 'zustand';
import type React from 'react';
import type { PopupData } from '@/types';
import { getDocument } from '@/services/document-service';
import { db } from '@/db/dexie';
import { truncateText } from '@/utils/sanitize';

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

export interface PopupState {
  popups: PopupData[];
  activePopupId: string | null;
  isUserDragging: boolean;
  recentlyClosedPopups: RecentlyClosedPopup[];

  // ================================================
  // 新增：专为 Floating UI 悬浮卡片服务的响应式状态
  // ================================================
  hoveredElement: VirtualElement | null;
  hoveredWikiId: string | null;

  setPopups: (popups: PopupData[]) => void;
  bringToFront: (id: string) => void;
  togglePin: (id: string) => void;
  toggleMinimize: (id: string) => void;
  closePopup: (id: string) => void;
  restorePopup: (id: string) => void;
  setIsUserDragging: (dragging: boolean) => void;

  // ================================================
  // 新增：极简的悬停状态控制动作
  // ================================================
  setHoveredLink: (element: HTMLElement | null, wikiId: string | null) => void;
  pinHoveredLink: () => Promise<void>;

  // 链接悬停处理
  handleMouseEnter: (
    event: MouseEvent | React.MouseEvent<Element>,
    wikiId: string,
    depth?: number
  ) => void;
  handleMouseLeave: (wikiId: string) => void;

  // Popover 卡片悬停处理
  handlePopoverMouseEnter: (id: string) => void;
  handlePopoverMouseLeave: (id: string) => void;

  // 链接点击处理
  handleClick: (wikiId: string, depth?: number) => void;

  // 桌面拖拽与缩放事件（仅更新内存状态）
  handlePositionChange: (id: string, x: number, y: number) => void;
  handleSizeChange: (id: string, width: number, height: number) => void;

  // 持久化到 IndexedDB（拖拽/调整大小结束时调用）
  savePopupPosition: (id: string) => Promise<void>;
  savePopupSize: (id: string) => Promise<void>;
}

export const usePopupStore = create<PopupState>()((set, get) => ({
  popups: [],
  activePopupId: null,
  isUserDragging: false,
  recentlyClosedPopups: [],

  // 临时悬停状态
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

    // 持久化到 IndexedDB
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

    // 持久化到 IndexedDB
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

    // 从 IndexedDB 删除状态
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

  // ================================================
  // 更新悬浮卡片引用，由 CodeMirror 驱动
  // ================================================
  setHoveredLink: (element, wikiId) => {
    if (get().isUserDragging) return;
    // 将 HTMLElement 转换为虚拟元素（包含 getBoundingClientRect 方法）
    const virtualElement = element
      ? { getBoundingClientRect: () => element.getBoundingClientRect() }
      : null;
    set({ hoveredElement: virtualElement, hoveredWikiId: wikiId });
  },

  // ================================================
  // 升格：将当前悬停卡片瞬间转化为永久的画布卡片
  // ================================================
  pinHoveredLink: async () => {
    const { hoveredWikiId, popups } = get();
    if (!hoveredWikiId) return;

    // 如果已经打开了，直接置顶
    if (popups.some((p) => p.id === hoveredWikiId)) {
      set({ activePopupId: hoveredWikiId, hoveredElement: null, hoveredWikiId: null });
      return;
    }

    const docData = await getDocument(hoveredWikiId);
    if (docData) {
      const newPopup: PopupData = {
        id: hoveredWikiId,
        title: docData.title,
        excerpt: truncateText(docData.content, 180),
        badge: docData.badge,
        badgeClass: docData.badgeClass,
        x: 150, // 默认升格弹窗位置
        y: 150,
        width: DEFAULT_POPUP_CONFIG.width,
        height: DEFAULT_POPUP_CONFIG.height,
        depth: popups.length + 1,
        isPinned: true, // 默认固定
        isMinimized: false,
      };

      set({
        popups: [...popups, newPopup],
        activePopupId: hoveredWikiId,
        hoveredElement: null, // 清空悬停引用，交给窗口系统接管
        hoveredWikiId: null,
      });

      // 持久化到 IndexedDB
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

  // 仅更新内存状态（拖拽过程中调用）
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

  // 仅更新内存状态（调整大小过程中调用）
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

  // 持久化位置到 IndexedDB（拖拽结束时调用）
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

  // 持久化尺寸到 IndexedDB（调整大小结束时调用）
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

    const docData = await getDocument(wikiId);
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
        depth: popups.length + 1,
        isPinned: true,
        isMinimized: false,
      };

      set({
        popups: [...popups, newPopup],
        activePopupId: wikiId,
        hoveredElement: null,
        hoveredWikiId: null,
      });

      // 持久化到 IndexedDB
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
