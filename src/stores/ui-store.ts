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

  // ============================================
  // 跨组件共享状态
  // ============================================
  /** 当前打开的 Wiki ID */
  currentWikiId: string | null;
  /** 主编辑器文档文本 */
  documentText: string;

  // ============================================
  // 核心 UI Actions
  // ============================================
  /** 设置活动页面 */
  setActivePage: (page: string) => void;
  /** 设置侧边栏悬停状态 */
  setSidebarHovered: (hovered: boolean) => void;
  /** 设置禅模式 */
  setZenMode: (zen: boolean) => void;
  /** 设置命令面板打开状态 */
  setCommandPaletteOpen: (open: boolean) => void;
  /** 设置状态消息 */
  setStatus: (msg: string) => void;
  /** 切换侧边栏固定状态 */
  toggleSidebarPin: () => void;

  // ============================================
  // 跨组件共享 Actions
  // ============================================
  /** 设置当前 Wiki ID */
  setCurrentWikiId: (id: string | null) => void;
  /** 设置文档文本 */
  setDocumentText: (text: string) => void;
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
      isSidebarHovered: false,
      isZenMode: false,
      isCommandPaletteOpen: false,
      statusMsg: 'System active.',
      showStatus: true,
      isSidebarPinned: false,

      // ============================================
      // 跨组件共享状态初始值
      // ============================================
      currentWikiId: null,
      documentText: '',

      // ============================================
      // 核心 UI Actions 实现
      // ============================================
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

      toggleSidebarPin: () => set((state) => ({ isSidebarPinned: !state.isSidebarPinned })),

      // ============================================
      // 跨组件共享 Actions 实现
      // ============================================
      setCurrentWikiId: (id) => set({ currentWikiId: id }),

      setDocumentText: (text) => set({ documentText: text }),
    }),
    {
      name: 'axiom-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePage: state.activePage,
        isSidebarPinned: state.isSidebarPinned,
        isZenMode: state.isZenMode,
        currentWikiId: state.currentWikiId,
      }),
    }
  )
);
