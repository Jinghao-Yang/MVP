/**
 * UI Store - 管理 UI 状态（侧边栏、禅模式、命令面板等）
 * 使用 Zustand 创建，支持持久化
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ============================================
// UI 状态类型定义
// ============================================

/**
 * UI 状态接口
 */
export interface UiState {
  // ============================================
  // 核心 UI 状态
  // ============================================
  /** 当前活动页面 */
  activePage: string;
  /** 当前 Project 页面的活动 Tab */
  activeProjectTab: string;
  /** 侧边栏是否悬停 */
  isSidebarHovered: boolean;
  /** 是否禅模式 */
  isZenMode: boolean;
  /** 命令面板是否打开 */
  isCommandPaletteOpen: boolean;
  /** 状态消息 */
  statusMsg: string;
  /** 是否显示状态 */
  showStatus: boolean;
  /** 侧边栏是否固定 */
  isSidebarPinned: boolean;
  /** 移动端侧边栏是否打开 */
  isMobileSidebarOpen: boolean;

  // ============================================
  // 跨组件共享状态
  // ============================================
  /** 当前主干编辑器打开的 Wiki ID */
  mainWikiId: string;
  /** 当前打开的右侧 Wiki ID */
  currentWikiId: string | null;
  /** 当前数据库视图过滤的对象类型 */
  selectedTypeId: string | null;
  /** 当前数据库视图过滤的的标签 */
  selectedTag: string | null;

  // ============================================
  // 核心 UI Actions
  // ============================================
  /** 设置活动页面 */
  setActivePage: (page: string) => void;
  /** 设置 Project 页面 Tab */
  setActiveProjectTab: (tab: string) => void;
  /** 设置侧边栏悬停状态 */
  setSidebarHovered: (hovered: boolean) => void;
  /** 设置禅模式 */
  setZenMode: (zen: boolean) => void;
  /** 设置命令面板打开状态 */
  setCommandPaletteOpen: (open: boolean) => void;
  /** 设置状态消息 */
  setStatus: (status: string) => void;
  /** 切换侧边栏固定状态 */
  toggleSidebarPin: () => void;
  /** 设置移动端侧边栏打开状态 */
  setMobileSidebarOpen: (open: boolean) => void;

  // ============================================
  // 跨组件共享 Actions
  // ============================================
  /** 设置主干 Wiki ID */
  setMainWikiId: (id: string) => void;
  /** 设置侧边栏当前 Wiki ID */
  setCurrentWikiId: (id: string | null) => void;
  /** 设置选中的对象类型 */
  setSelectedTypeId: (id: string | null) => void;
  /** 设置选中的标签 */
  setSelectedTag: (tag: string | null) => void;
}

// ============================================
// 定时器管理
// ============================================

let statusTimeout: ReturnType<typeof setTimeout> | null = null;

// ============================================
// Store 实现
// ============================================

/**
 * UI Store
 * 管理全局 UI 状态
 */
export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      // ============================================
      // 核心 UI 状态初始值
      // ============================================
      activePage: 'project',
      activeProjectTab: 'kanban',
      isSidebarHovered: false,
      isZenMode: false,
      isCommandPaletteOpen: false,
      statusMsg: 'System active.',
      showStatus: true,
      isSidebarPinned: false,
      isMobileSidebarOpen: false,

      // ============================================
      // 跨组件共享状态初始值
      // ============================================
      mainWikiId: 'main-editor-doc',
      currentWikiId: null,
      selectedTypeId: null,
      selectedTag: null,

      // ============================================
      // 核心 UI Actions 实现
      // ============================================
      setActivePage: (page) =>
        set({
          activePage: page,
          isZenMode: false,
          isSidebarHovered: false,
          isMobileSidebarOpen: false,
        }),

      setActiveProjectTab: (tab) => set({ activeProjectTab: tab }),

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

      toggleSidebarPin: () => set((state) => ({ isSidebarPinned: !state.isSidebarPinned })),

      setMobileSidebarOpen: (open) => set({ isMobileSidebarOpen: open }),

      // ============================================
      // 跨组件共享 Actions 实现
      // ============================================
      setMainWikiId: (id) => set({ mainWikiId: id }),
      setCurrentWikiId: (id) => set({ currentWikiId: id }),
      setSelectedTypeId: (id) => set({ selectedTypeId: id }),
      setSelectedTag: (tag) => set({ selectedTag: tag }),
    }),
    {
      name: 'axiom-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePage: state.activePage,
        isSidebarPinned: state.isSidebarPinned,
        // isZenMode 不持久化 - 禅模式是临时专注状态，重启后不应自动进入
        mainWikiId: state.mainWikiId,
        currentWikiId: state.currentWikiId,
      }),
    }
  )
);
