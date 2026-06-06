/**
 * App Store - 整合 UI 及设置状态
 * 使用 Zustand 管理并对重要设置进行持久化处理
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface AppState {
  // ============================================
  // 设置状态（Settings-store）
  // ============================================
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  zenModeOpacity: number;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (fontSize: 'small' | 'medium' | 'large') => void;
  setZenModeOpacity: (opacity: number) => void;

  // ============================================
  // 核心 UI 状态（Ui-store）
  // ============================================
  activePage: string;
  activeProjectTab: string;
  isSidebarHovered: boolean;
  isZenMode: boolean;
  isCommandPaletteOpen: boolean;
  isKeyboardShortcutsOpen: boolean;
  statusMsg: string;
  showStatus: boolean;
  isSidebarPinned: boolean;
  isMobileSidebarOpen: boolean;

  // ============================================
  // 跨组件共享状态
  // ============================================
  mainWikiId: string;
  currentWikiId: string | null;
  selectedTypeId: string | null;
  selectedTag: string | null;

  // ============================================
  // 核心 UI Actions
  // ============================================
  setActivePage: (page: string) => void;
  setActiveProjectTab: (tab: string) => void;
  setSidebarHovered: (hovered: boolean) => void;
  setZenMode: (zen: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setKeyboardShortcutsOpen: (open: boolean) => void;
  setStatus: (status: string) => void;
  toggleSidebarPin: () => void;
  setMobileSidebarOpen: (open: boolean) => void;

  // ============================================
  // 跨组件共享 Actions
  // ============================================
  setMainWikiId: (id: string) => void;
  setCurrentWikiId: (id: string | null) => void;
  setSelectedTypeId: (id: string | null) => void;
  setSelectedTag: (tag: string | null) => void;
}

let statusTimeout: ReturnType<typeof setTimeout> | null = null;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ============================================
      // 设置状态初始值
      // ============================================
      theme: 'system',
      fontSize: 'medium',
      zenModeOpacity: 0.8,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setZenModeOpacity: (opacity) => set({ zenModeOpacity: opacity }),

      // ============================================
      // 核心 UI 状态初始值
      // ============================================
      activePage: 'project',
      activeProjectTab: 'kanban',
      isSidebarHovered: false,
      isZenMode: false,
      isCommandPaletteOpen: false,
      isKeyboardShortcutsOpen: false,
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

      setKeyboardShortcutsOpen: (open) => set({ isKeyboardShortcutsOpen: open }),

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
      name: 'axiom-app-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        zenModeOpacity: state.zenModeOpacity,
        activePage: state.activePage,
        isSidebarPinned: state.isSidebarPinned,
        mainWikiId: state.mainWikiId,
        currentWikiId: state.currentWikiId,
      }),
    }
  )
);

// 兼容别名导出，确保无缝迁移而不引起全局重构编译报错
export const useUiStore = useAppStore;
export const useSettingsStore = useAppStore;
export type UiState = AppState;
export type SettingsState = AppState;
