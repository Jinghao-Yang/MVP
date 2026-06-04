/**
 * 弹窗状态管理 Store
 * 管理弹窗的打开、关闭、固定、最小化等状态
 */

import { create } from 'zustand';
import type React from 'react';
import type { PopupData } from '@/types';
import { db } from '@/db/dexie';
import { getDocument } from '@/db/documents';

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
  /** 弹窗位置变化处理 */
  handlePositionChange: (id: string, x: number, y: number) => Promise<void>;
  /** 弹窗尺寸变化处理 */
  handleSizeChange: (id: string, width: number, height: number) => Promise<void>;
}

// ============================================================================
// 定时器管理 Hook
// ============================================================================

/**
 * 悬停定时器管理器
 * 用于管理弹窗打开/关闭的延迟定时器，消除模块级变量
 */
class TimerManager {
  private timers = new Map<string, ReturnType<typeof setTimeout>>();

  /**
   * 设置定时器
   * @param key - 定时器键名
   * @param callback - 回调函数
   * @param delay - 延迟时间（毫秒）
   */
  setTimer(key: string, callback: () => void, delay: number): void {
    this.clearTimer(key);
    const timerId = setTimeout(() => {
      this.timers.delete(key);
      callback();
    }, delay);
    this.timers.set(key, timerId);
  }

  /**
   * 清除指定定时器
   * @param key - 定时器键名
   */
  clearTimer(key: string): void {
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  /**
   * 检查定时器是否存在
   * @param key - 定时器键名
   */
  hasTimer(key: string): boolean {
    return this.timers.has(key);
  }

  /**
   * 清除所有打开定时器（非关闭定时器）
   */
  clearAllOpenTimers(): void {
    this.timers.forEach((timer, key) => {
      if (!key.startsWith('close-')) {
        clearTimeout(timer);
        this.timers.delete(key);
      }
    });
  }

  /**
   * 清除所有定时器
   */
  clearAll(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}

// 全局定时器管理器实例
const timerManager = new TimerManager();

/**
 * 获取定时器管理器的 Hook
 * @returns 定时器管理器实例
 */
export function useTimerManager(): TimerManager {
  return timerManager;
}

// ============================================================================
// Popup Store 实现
// ============================================================================

export const usePopupStore = create<PopupState>()((set, get) => ({
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

    // 清除已存在的打开和关闭定时器
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
          const defaultWidth = savedState?.width ?? 500;
          const defaultHeight = savedState?.height ?? 320;

          if (!savedState) {
            adjustedX = adjustedX + depth * 25;
            adjustedY = adjustedY + depth * 25;

            if (adjustedX + defaultWidth > window.innerWidth) {
              adjustedX = window.innerWidth - defaultWidth - 24;
            }
            if (adjustedY + defaultHeight > window.innerHeight) {
              adjustedY = clientY + window.scrollY - defaultHeight - 20;
            }
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

    // 清除已存在的打开定时器
    timerManager.clearTimer(wikiId);

    // 特殊处理：关闭所有弹窗
    if (wikiId === 'any') {
      timerManager.clearAllOpenTimers();
      return;
    }

    // 设置关闭定时器
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
    // 清除关闭定时器，保持弹窗打开
    timerManager.clearTimer(`close-${wikiId}`);
  },

  handlePopoverMouseLeave: (wikiId: string) => {
    get().handleMouseLeave(wikiId);
  },

  handlePositionChange: async (id, x, y) => {
    set((state) => ({
      popups: state.popups.map((p) => (p.id === id ? { ...p, x, y, isPinned: true } : p)),
    }));
    await db.popoverStates.update(id, { x, y }).catch(async () => {
      await db.popoverStates.put({ id, x, y, width: 500, height: 320 });
    });
  },

  handleSizeChange: async (id, width, height) => {
    set((state) => ({
      popups: state.popups.map((p) => (p.id === id ? { ...p, width, height, isPinned: true } : p)),
    }));
    await db.popoverStates.update(id, { width, height }).catch(async () => {
      await db.popoverStates.put({ id, x: 100, y: 100, width, height });
    });
  },
}));
