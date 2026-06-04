/**
 * usePopupHover Hook
 * 封装弹窗悬停交互逻辑，提供简化的弹窗控制接口
 */
import { useCallback } from 'react';
import type React from 'react';
import { usePopupStore, useTimerManager } from '@/stores/popup-store';

/**
 * 弹窗悬停 Hook 返回值
 */
export interface PopupHoverHandlers {
  /** 鼠标进入触发器元素（如链接）时调用 */
  handleTriggerEnter: (e: React.MouseEvent<Element>, wikiId: string, depth?: number) => void;
  /** 鼠标离开触发器元素时调用 */
  handleTriggerLeave: (wikiId: string) => void;
  /** 鼠标进入弹窗时调用 */
  handlePopupEnter: (wikiId: string) => void;
  /** 鼠标离开弹窗时调用 */
  handlePopupLeave: (wikiId: string) => void;
  /** 关闭指定弹窗 */
  closePopup: (wikiId: string) => void;
  /** 关闭所有非固定弹窗 */
  closeAllUnpinned: () => void;
  /** 切换弹窗固定状态 */
  togglePin: (wikiId: string) => void;
  /** 切换弹窗最小化状态 */
  toggleMinimize: (wikiId: string) => void;
  /** 将弹窗置顶 */
  bringToFront: (wikiId: string) => void;
}

/**
 * 弹窗悬停交互 Hook
 * 封装弹窗悬停的复杂逻辑，使用 usePopupStore 和 useTimerManager
 *
 * @example
 * ```tsx
 * function WikiLink({ wikiId }: { wikiId: string }) {
 *   const {
 *     handleTriggerEnter,
 *     handleTriggerLeave,
 *     handlePopupEnter,
 *     handlePopupLeave
 *   } = usePopupHover();
 *
 *   return (
 *     <a
 *       onMouseEnter={(e) => handleTriggerEnter(e, wikiId)}
 *       onMouseLeave={() => handleTriggerLeave(wikiId)}
 *     >
 *       Wiki Link
 *     </a>
 *   );
 * }
 * ```
 */
export function usePopupHover(): PopupHoverHandlers {
  const store = usePopupStore();
  const timerManager = useTimerManager();

  // 鼠标进入触发器元素（如链接）时调用
  const handleTriggerEnter = useCallback(
    (e: React.MouseEvent<Element>, wikiId: string, depth = 0) => {
      store.handleMouseEnter(e, wikiId, depth);
    },
    [store]
  );

  // 鼠标离开触发器元素时调用
  const handleTriggerLeave = useCallback(
    (wikiId: string) => {
      store.handleMouseLeave(wikiId);
    },
    [store]
  );

  // 鼠标进入弹窗时调用
  const handlePopupEnter = useCallback(
    (wikiId: string) => {
      store.handlePopoverMouseEnter(wikiId);
    },
    [store]
  );

  // 鼠标离开弹窗时调用
  const handlePopupLeave = useCallback(
    (wikiId: string) => {
      store.handlePopoverMouseLeave(wikiId);
    },
    [store]
  );

  // 关闭指定弹窗
  const closePopup = useCallback(
    (wikiId: string) => {
      timerManager.clearTimer(wikiId);
      timerManager.clearTimer(`close-${wikiId}`);
      store.closePopup(wikiId);
    },
    [store, timerManager]
  );

  // 关闭所有非固定弹窗
  const closeAllUnpinned = useCallback(() => {
    const unpinnedPopups = store.popups.filter((p) => !p.isPinned);
    unpinnedPopups.forEach((p) => {
      timerManager.clearTimer(p.id);
      timerManager.clearTimer(`close-${p.id}`);
    });
    store.setPopups(store.popups.filter((p) => p.isPinned));
  }, [store, timerManager]);

  // 切换弹窗固定状态
  const togglePin = useCallback(
    (wikiId: string) => {
      store.togglePin(wikiId);
    },
    [store]
  );

  // 切换弹窗最小化状态
  const toggleMinimize = useCallback(
    (wikiId: string) => {
      store.toggleMinimize(wikiId);
    },
    [store]
  );

  // 将弹窗置顶
  const bringToFront = useCallback(
    (wikiId: string) => {
      store.bringToFront(wikiId);
    },
    [store]
  );

  return {
    handleTriggerEnter,
    handleTriggerLeave,
    handlePopupEnter,
    handlePopupLeave,
    closePopup,
    closeAllUnpinned,
    togglePin,
    toggleMinimize,
    bringToFront,
  };
}
