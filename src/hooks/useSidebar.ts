/**
 * useSidebar Hook
 * 封装侧边栏交互逻辑，提供完整的侧边栏控制接口
 * 基于 useSidebarState 扩展更多交互功能
 */
import { useCallback, useEffect } from 'react';
import { useSidebarState, type SidebarState } from './useSidebarState';
import { useUiStore } from '@/stores/ui-store';

/**
 * 侧边栏交互 Hook 返回值
 * 扩展自 SidebarState，添加更多交互方法
 */
export interface SidebarInteraction extends SidebarState {
  /** 切换侧边栏展开/收起状态 */
  toggle: () => void;
  /** 强制展开侧边栏（忽略固定和禅模式状态） */
  forceExpand: () => void;
  /** 强制收起侧边栏（忽略固定状态） */
  forceCollapse: () => void;
  /** 设置侧边栏展开状态 */
  setExpanded: (expanded: boolean) => void;
  /** 是否为触摸设备 */
  isTouchDevice: boolean;
}

/**
 * 侧边栏交互管理 Hook
 * 提供完整的侧边栏控制接口，包括悬停、固定、禅模式等交互
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const {
 *     isExpanded,
 *     isPinned,
 *     handleMouseEnter,
 *     handleMouseLeave,
 *     togglePin
 *   } = useSidebar();
 *
 *   return (
 *     <aside
 *       onMouseEnter={handleMouseEnter}
 *       onMouseLeave={handleMouseLeave}
 *       className={isExpanded ? 'expanded' : 'collapsed'}
 *     >
 *       <button onClick={togglePin}>
 *         {isPinned ? '取消固定' : '固定'}
 *       </button>
 *     </aside>
 *   );
 * }
 * ```
 */
export function useSidebar(): SidebarInteraction {
  const baseState = useSidebarState();

  const isSidebarPinned = useUiStore((state) => state.isSidebarPinned);
  const isSidebarHovered = useUiStore((state) => state.isSidebarHovered);
  const isZenMode = useUiStore((state) => state.isZenMode);
  const setSidebarHovered = useUiStore((state) => state.setSidebarHovered);
  const toggleSidebarPin = useUiStore((state) => state.toggleSidebarPin);

  // 检测是否为触摸设备
  const isTouchDevice =
    typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // 切换侧边栏展开/收起状态
  const toggle = useCallback(() => {
    if (isZenMode) return;
    if (isSidebarPinned) {
      toggleSidebarPin();
    } else {
      setSidebarHovered(!isSidebarHovered);
    }
  }, [isZenMode, isSidebarPinned, isSidebarHovered, toggleSidebarPin, setSidebarHovered]);

  // 强制展开侧边栏（忽略固定和禅模式状态）
  const forceExpand = useCallback(() => {
    setSidebarHovered(true);
  }, [setSidebarHovered]);

  // 强制收起侧边栏（忽略固定状态）
  const forceCollapse = useCallback(() => {
    setSidebarHovered(false);
  }, [setSidebarHovered]);

  // 设置侧边栏展开状态
  const setExpanded = useCallback(
    (expanded: boolean) => {
      if (expanded) {
        baseState.expand();
      } else {
        baseState.collapse();
      }
    },
    [baseState]
  );

  // 在禅模式下自动收起侧边栏
  useEffect(() => {
    if (isZenMode && !isSidebarPinned) {
      setSidebarHovered(false);
    }
  }, [isZenMode, isSidebarPinned, setSidebarHovered]);

  return {
    ...baseState,
    toggle,
    forceExpand,
    forceCollapse,
    setExpanded,
    isTouchDevice,
  };
}
