/**
 * 弹窗状态管理 Store
 * 管理弹窗的打开、关闭、固定、最小化等状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type React from 'react';
import type { PopupData } from '@/types';
import { getDocument } from '@/services/document-service';
import { db } from '@/db/dexie';
import { timerManager } from '@/utils/timer-manager';

// ============================================================================
// 弹窗配置常量
// ============================================================================

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

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 确保位置在屏幕边界内
 */
function ensureWithinBounds(x: number, y: number): { x: number; y: number } {
  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const maxX = viewportWidth - DEFAULT_POPUP_CONFIG.minWidth;
    const boundedX = Math.max(0, Math.min(x, maxX));

    const maxY = viewportHeight - DEFAULT_POPUP_CONFIG.minHeight;
    const boundedY = Math.max(0, Math.min(y, maxY));

    return { x: boundedX, y: boundedY };
  }
  return { x, y };
}

/**
 * 限制尺寸在最小和最大范围内
 */
function constrainSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(DEFAULT_POPUP_CONFIG.minWidth, Math.min(width, DEFAULT_POPUP_CONFIG.maxWidth)),
    height: Math.max(
      DEFAULT_POPUP_CONFIG.minHeight,
      Math.min(height, DEFAULT_POPUP_CONFIG.maxHeight)
    ),
  };
}

/**
 * 计算默认弹窗位置
 */
function _calculateDefaultPosition(depth: number): { x: number; y: number } {
  const offset = depth * 30;
  return {
    x: DEFAULT_POPUP_CONFIG.offsetX + offset,
    y: DEFAULT_POPUP_CONFIG.offsetY + offset,
  };
}

// ============================================================================
// 类型定义
// ============================================================================

/** 最近关闭的弹窗记录 */
export interface RecentlyClosedPopup {
  popup: PopupData;
  closedAt: number;
}

/** 弹窗 Store 状态接口 */
export interface PopupState {
  /** 弹窗列表 */
  popups: PopupData[];
  /** 正在加载的 Wiki ID */
  loadingWikiId: string | null;
  /** 当前活动的弹窗 ID */
  activePopupId: string | null;
  /** 用户是否正在拖拽 */
  isUserDragging: boolean;
  /** 最近关闭的弹窗 */
  recentlyClosedPopups: RecentlyClosedPopup[];

  // Actions
  /** 设置弹窗列表 */
  setPopups: (popups: PopupData[]) => void;
  /** 将弹窗置顶 */
  bringToFront: (id: string) => void;
  /** 切换弹窗固定状态 */
  togglePin: (id: string) => void;
  /** 切换弹窗最小化状态 */
  toggleMinimize: (id: string) => void;
  /** 关闭弹窗 */
  closePopup: (id: string) => void;
  /** 恢复弹窗 */
  restorePopup: (id: string) => void;
  /** 设置加载中的 Wiki ID */
  setLoadingWikiId: (id: string | null) => void;
  /** 设置拖拽状态 */
  setIsUserDragging: (dragging: boolean) => void;

  // 弹窗交互方法
  /** 鼠标进入处理（打开弹窗） */
  handleMouseEnter: (
    e: MouseEvent | React.MouseEvent<Element>,
    wikiId: string,
    depth?: number
  ) => void;
  /** 鼠标离开处理（关闭弹窗） */
  handleMouseLeave: (wikiId: string) => void;
  /** 弹窗鼠标进入处理 */
  handlePopoverMouseEnter: (wikiId: string) => void;
  /** 弹窗鼠标离开处理 */
  handlePopoverMouseLeave: (wikiId: string) => void;
  /** 点击触发弹窗（触摸设备使用） */
  handleClick: (wikiId: string, depth?: number) => void;
  /** 弹窗位置变化处理 */
  handlePositionChange: (id: string, x: number, y: number) => Promise<void>;
  /** 弹窗尺寸变化处理 */
  handleSizeChange: (id: string, width: number, height: number) => Promise<void>;
}

// ============================================================================
// 弹窗固定元数据类型
// ============================================================================

export interface PinnedPopoverMetadata {
  id: string;
  isPinned: boolean;
  isMinimized: boolean;
}

// ============================================================================
// Popup Store 实现
// ============================================================================

export const usePopupStore = create<PopupState>()(
  persist(
    (set, get) => ({
      // 初始状态
      popups: [],
      loadingWikiId: null,
      activePopupId: null,
      isUserDragging: false,
      recentlyClosedPopups: [],

      // Actions
      setPopups: (popups) => set({ popups }),

      bringToFront: (id) => set({ activePopupId: id }),

      togglePin: (id) =>
        set((state) => ({
          popups: state.popups.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)),
        })),

      toggleMinimize: (id) =>
        set((state) => ({
          popups: state.popups.map((p) => (p.id === id ? { ...p, isMinimized: !p.isMinimized } : p)),
        })),

      closePopup: (id) =>
        set((state) => {
          const popupToClose = state.popups.find((p) => p.id === id);
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
        }),

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

      setLoadingWikiId: (id) => set({ loadingWikiId: id }),

      setIsUserDragging: (dragging) => set({ isUserDragging: dragging }),

      // 弹窗交互方法
      handleMouseEnter: (e: MouseEvent | React.MouseEvent<Element>, wikiId: string, depth = 0) => {
        const state = get();
        if (state.isUserDragging) return;

        const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
        if (isTouch) return;

        timerManager.clearTimer(wikiId);
        timerManager.clearTimer(`close-${wikiId}`);

        set({ loadingWikiId: wikiId });

        const clientX = e.clientX;
        const clientY = e.clientY;

        timerManager.setTimer(
          wikiId,
          async () => {
            set({ loadingWikiId: null });

            const currentPopups = get().popups;
            if (currentPopups.some((p) => p.id === wikiId)) {
              set({ activePopupId: wikiId });
              return;
            }

            const docData = await getDocument(wikiId);
            const savedState = await db.popoverStates.get(wikiId);

            if (docData) {
              let adjustedX = savedState?.x ?? clientX + window.scrollX;
              let adjustedY = savedState?.y ?? clientY + window.scrollY + 20;
              const defaultWidth = savedState?.width ?? DEFAULT_POPUP_CONFIG.width;
              const defaultHeight = savedState?.height ?? DEFAULT_POPUP_CONFIG.height;

              if (!savedState) {
                adjustedX = adjustedX + depth * 25;
                adjustedY = adjustedY + depth * 25;

                if (adjustedX + defaultWidth > window.innerWidth) {
                  adjustedX = window.innerWidth - defaultWidth - 24;
                }
                if (adjustedY + defaultHeight > window.innerHeight) {
                  adjustedY = clientY + window.scrollY - defaultHeight - 20;
                }
              } else {
                const boundedPosition = ensureWithinBounds(adjustedX, adjustedY);
                adjustedX = boundedPosition.x;
                adjustedY = boundedPosition.y;
              }

              const newPopup: PopupData = {
                id: wikiId,
                title: docData.title,
                excerpt: docData.content.substring(0, 180) + '...',
                badge: docData.badge,
                badgeClass: docData.badgeClass,
                x: adjustedX,
                y: adjustedY,
                width: defaultWidth,
                height: defaultHeight,
                depth: Math.min(depth + 1, 5),
                isPinned: false,
                isMinimized: false,
                history: [wikiId],
                historyIndex: 0,
              };

              set({
                popups: [...currentPopups.filter((p) => p.isPinned || p.depth <= depth), newPopup],
                activePopupId: wikiId,
              });

              if (!savedState) {
                await db.popoverStates.put({
                  id: wikiId,
                  x: adjustedX,
                  y: adjustedY,
                  width: defaultWidth,
                  height: defaultHeight,
                });
              }
            }
          },
          220
        );
      },

      handleMouseLeave: (wikiId: string) => {
        set({ loadingWikiId: null });
        const state = get();
        if (state.isUserDragging) return;

        timerManager.clearTimer(wikiId);

        if (wikiId === 'any') {
          timerManager.clearAllOpenTimers();
          return;
        }

        timerManager.setTimer(
          `close-${wikiId}`,
          () => {
            set((state) => ({
              popups: state.popups.filter((p) =>
                p.id === wikiId && p.isPinned ? true : p.id !== wikiId
              ),
            }));
          },
          320
        );
      },

      handlePopoverMouseEnter: (wikiId: string) => {
        const state = get();
        if (state.isUserDragging) return;
        timerManager.clearTimer(`close-${wikiId}`);
      },

      handlePopoverMouseLeave: (wikiId: string) => {
        get().handleMouseLeave(wikiId);
      },

      handleClick: async (wikiId: string, depth = 0) => {
        const state = get();
        if (state.isUserDragging) return;

        timerManager.clearTimer(wikiId);
        timerManager.clearTimer(`close-${wikiId}`);

        set({ loadingWikiId: wikiId });

        const currentPopups = get().popups;
        const existingPopup = currentPopups.find((p) => p.id === wikiId);

        if (existingPopup) {
          set({ loadingWikiId: null, activePopupId: wikiId });
          return;
        }

        const docData = await getDocument(wikiId);
        const savedState = await db.popoverStates.get(wikiId);

        if (docData) {
          const defaultWidth = savedState?.width ?? DEFAULT_POPUP_CONFIG.width;
          const defaultHeight = savedState?.height ?? DEFAULT_POPUP_CONFIG.height;

          let adjustedX = savedState?.x ?? DEFAULT_POPUP_CONFIG.offsetX + depth * 30;
          let adjustedY = savedState?.y ?? DEFAULT_POPUP_CONFIG.offsetY + depth * 30;

          if (!savedState) {
            adjustedX = adjustedX + depth * 25;
            adjustedY = adjustedY + depth * 25;

            if (adjustedX + defaultWidth > window.innerWidth) {
              adjustedX = window.innerWidth - defaultWidth - 24;
            }
            if (adjustedY + defaultHeight > window.innerHeight) {
              adjustedY = window.innerHeight - defaultHeight - 24;
            }
          } else {
            const boundedPosition = ensureWithinBounds(adjustedX, adjustedY);
            adjustedX = boundedPosition.x;
            adjustedY = boundedPosition.y;
          }

          const newPopup: PopupData = {
            id: wikiId,
            title: docData.title,
            excerpt: docData.content.substring(0, 180) + '...',
            badge: docData.badge,
            badgeClass: docData.badgeClass,
            x: adjustedX,
            y: adjustedY,
            width: defaultWidth,
            height: defaultHeight,
            depth: Math.min(depth + 1, 5),
            isPinned: false,
            isMinimized: false,
            history: [wikiId],
            historyIndex: 0,
          };

          set({
            popups: [...currentPopups.filter((p) => p.isPinned || p.depth <= depth), newPopup],
            activePopupId: wikiId,
            loadingWikiId: null,
          });

          if (!savedState) {
            await db.popoverStates.put({
              id: wikiId,
              x: adjustedX,
              y: adjustedY,
              width: defaultWidth,
              height: defaultHeight,
            });
          }
        } else {
          set({ loadingWikiId: null });
        }
      },

      handlePositionChange: async (id, x, y) => {
        const boundedPosition = ensureWithinBounds(x, y);
        set((state) => ({
          popups: state.popups.map((p) =>
            p.id === id ? { ...p, x: boundedPosition.x, y: boundedPosition.y, isPinned: true } : p
          ),
        }));
        const popup = get().popups.find((p) => p.id === id);
        if (popup) {
          await db.popoverStates.put({
            id,
            x: boundedPosition.x,
            y: boundedPosition.y,
            width: popup.width,
            height: popup.height,
          });
        }
      },

      handleSizeChange: async (id, width, height) => {
        const constrainedSize = constrainSize(width, height);
        set((state) => ({
          popups: state.popups.map((p) =>
            p.id === id
              ? { ...p, width: constrainedSize.width, height: constrainedSize.height, isPinned: true }
              : p
          ),
        }));
        const popup = get().popups.find((p) => p.id === id);
        if (popup) {
          await db.popoverStates.put({
            id,
            x: popup.x,
            y: popup.y,
            width: constrainedSize.width,
            height: constrainedSize.height,
          });
        }
      },
    }),
    {
      name: 'axiom-popup-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pinnedPopoverMetadata: state.popups.map((p) => ({
          id: p.id,
          isPinned: p.isPinned,
          isMinimized: p.isMinimized,
        })),
      }),
    }
  )
);
