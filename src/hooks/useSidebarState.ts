/**
 * useSidebarState Hook
 * 封装侧边栏展开/收起逻辑
 */
import { useRef, useEffect, useCallback } from 'react';
import { useUiStore } from '@/stores/ui-store';

/**
 * 侧边栏状态 Hook 返回值
 */
export interface SidebarState {
  /** 侧边栏是否展开 */
  isExpanded: boolean;
  /** 侧边栏是否固定 */
  isPinned: boolean;
  /** 是否为禅模式 */
  isZenMode: boolean;
  /** 展开侧边栏 */
  expand: () => void;
  /** 收起侧边栏 */
  collapse: () => void;
  /** 切换固定状态 */
  togglePin: () => void;
  /** 鼠标进入处理 */
  handleMouseEnter: () => void;
  /** 鼠标离开处理 */
  handleMouseLeave: () => void;
}

/** 收起延迟时间（毫秒） */
const COLLAPSE_DELAY = 250;

/**
 * 侧边栏状态管理 Hook
 * 封装侧边栏展开/收起逻辑，处理悬停延迟和固定状态
 */
export function useSidebarState(): SidebarState {
  const isSidebarPinned = useUiStore((state) => state.isSidebarPinned);
  const isSidebarHovered = useUiStore((state) => state.isSidebarHovered);
  const isZenMode = useUiStore((state) => state.isZenMode);
  const setSidebarHovered = useUiStore((state) => state.setSidebarHovered);
  const toggleSidebarPin = useUiStore((state) => state.toggleSidebarPin);

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 检测是否为触摸设备
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // 统一由 store 驱动展开状态
  const isExpanded = isSidebarPinned || isSidebarHovered;

  // 清除收起定时器
  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  // 展开侧边栏
  const expand = useCallback(() => {
    if (isSidebarPinned || isZenMode || isTouch) return;
    clearCloseTimer();
    setSidebarHovered(true);
  }, [isSidebarPinned, isZenMode, isTouch, clearCloseTimer, setSidebarHovered]);

  // 收起侧边栏（带延迟）
  const collapse = useCallback(() => {
    if (isSidebarPinned || isZenMode || isTouch) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setSidebarHovered(false);
    }, COLLAPSE_DELAY);
  }, [isSidebarPinned, isZenMode, isTouch, clearCloseTimer, setSidebarHovered]);

  // 鼠标进入处理
  const handleMouseEnter = useCallback(() => {
    expand();
  }, [expand]);

  // 鼠标离开处理
  const handleMouseLeave = useCallback(() => {
    collapse();
  }, [collapse]);

  // 切换固定状态
  const togglePin = useCallback(() => {
    toggleSidebarPin();
  }, [toggleSidebarPin]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  return {
    isExpanded,
    isPinned: isSidebarPinned,
    isZenMode,
    expand,
    collapse,
    togglePin,
    handleMouseEnter,
    handleMouseLeave,
  };
}
