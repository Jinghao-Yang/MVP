/**
 * UI Store - 管理 UI 状态（侧边栏、禅模式、命令面板等）
 * 使用 Zustand 创建，支持持久化
 */
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type React from 'react';
import type { PopupData } from '@/types';
import { db, seedDatabase } from '@/db/dexie';
import { getDocument, updateDocumentContent, getBacklinks } from '@/db/documents';

// ============================================
// UI 状态类型定义
// ============================================

/**
 * 已关闭弹窗记录
 */
export interface RecentlyClosedPopup {
  popup: PopupData;
  closedAt: number;
}

/**
 * 固定弹窗元数据
 */
export interface PinnedPopoverMetadata {
  id: string;
  isPinned: boolean;
  isMinimized: boolean;
}

/**
 * UI 状态接口
 */
export interface UiState {
  // ============================================
  // 核心 UI 状态（任务要求提取的状态）
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
  // 核心 UI Actions（任务要求提取的方法）
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
  // 文档编辑状态（保持向后兼容）
  // ============================================
  currentWikiId: string | null;
  rightPaneWikiTitle: string;
  rightPaneWikiContent: string;
  rightPaneBacklinks: string[];
  documentText: string;
  documentHistory: string[];
  historyIndex: number;

  // ============================================
  // 弹窗状态（保持向后兼容）
  // ============================================
  popups: PopupData[];
  loadingWikiId: string | null;
  activePopupId: string | null;
  isUserDragging: boolean;
  recentlyClosedPopups: RecentlyClosedPopup[];

  // ============================================
  // 文档编辑 Actions（保持向后兼容）
  // ============================================
  setCurrentWikiId: (id: string | null) => void;
  setDocumentText: (text: string) => void;
  setRightPaneWikiContent: (text: string) => void;
  loadWikiContent: (wikiId: string) => Promise<void>;
  goBack: () => Promise<void>;
  goForward: () => Promise<void>;
  canGoBack: () => boolean;
  canGoForward: () => boolean;

  // ============================================
  // 弹窗 Actions（保持向后兼容）
  // ============================================
  setIsUserDragging: (dragging: boolean) => void;
  setPopups: (popups: PopupData[]) => void;
  bringToFront: (id: string) => void;
  togglePin: (id: string) => void;
  toggleMinimize: (id: string) => void;
  closePopup: (id: string) => void;
  restorePopup: (id: string) => void;
  setLoadingWikiId: (id: string | null) => void;
  navigatePopover: (id: string, direction: 'backward' | 'forward') => void;
  handleMouseEnter: (
    e: MouseEvent | React.MouseEvent<Element>,
    wikiId: string,
    depth?: number
  ) => void;
  handleMouseLeave: (wikiId: string) => void;
  handlePopoverMouseEnter: (wikiId: string) => void;
  handlePopoverMouseLeave: (wikiId: string) => void;
  handlePositionChange: (id: string, x: number, y: number) => Promise<void>;
  handleSizeChange: (id: string, width: number, height: number) => Promise<void>;

  // ============================================
  // 初始化方法（保持向后兼容）
  // ============================================
  initializeWorkspace: () => Promise<void>;
}

// ============================================
// 状态持久化配置
// ============================================

// ============================================
// 定时器管理
// ============================================

const hoverTimers = new Map<string, ReturnType<typeof setTimeout>>();
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let rightPaneDebounceTimer: ReturnType<typeof setTimeout> | null = null;
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
      // 文档编辑状态初始值
      // ============================================
      currentWikiId: null,
      rightPaneWikiTitle: '',
      rightPaneWikiContent: '',
      rightPaneBacklinks: [],
      documentText: '',
      documentHistory: [],
      historyIndex: -1,

      // ============================================
      // 弹窗状态初始值
      // ============================================
      popups: [],
      loadingWikiId: null,
      activePopupId: null,
      isUserDragging: false,
      recentlyClosedPopups: [],

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
      // 文档编辑 Actions 实现
      // ============================================
      setCurrentWikiId: (id) => set({ currentWikiId: id }),

      setDocumentText: (text) => {
        set({ documentText: text });
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          await updateDocumentContent('main-editor-doc', text);
        }, 450);
      },

      setRightPaneWikiContent: (text) => {
        set({ rightPaneWikiContent: text });
        if (rightPaneDebounceTimer) clearTimeout(rightPaneDebounceTimer);
        rightPaneDebounceTimer = setTimeout(async () => {
          const wikiId = get().currentWikiId;
          if (wikiId) {
            await updateDocumentContent(wikiId, text);
          }
        }, 450);
      },

      loadWikiContent: async (wikiId) => {
        const state = get();
        const data = await getDocument(wikiId);
        if (data) {
          const backlinks = await getBacklinks(wikiId);
          const newHistory = state.documentHistory.slice(0, state.historyIndex + 1);
          newHistory.push(wikiId);
          set({
            rightPaneWikiTitle: data.title,
            rightPaneWikiContent: data.content,
            rightPaneBacklinks: backlinks,
            documentHistory: newHistory,
            historyIndex: newHistory.length - 1,
            currentWikiId: wikiId,
          });
        }
      },

      goBack: async () => {
        const state = get();
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          const wikiId = state.documentHistory[newIndex];
          const data = await getDocument(wikiId);
          if (data) {
            const backlinks = await getBacklinks(wikiId);
            set({
              rightPaneWikiTitle: data.title,
              rightPaneWikiContent: data.content,
              rightPaneBacklinks: backlinks,
              historyIndex: newIndex,
              currentWikiId: wikiId,
            });
          }
        }
      },

      goForward: async () => {
        const state = get();
        if (state.historyIndex < state.documentHistory.length - 1) {
          const newIndex = state.historyIndex + 1;
          const wikiId = state.documentHistory[newIndex];
          const data = await getDocument(wikiId);
          if (data) {
            const backlinks = await getBacklinks(wikiId);
            set({
              rightPaneWikiTitle: data.title,
              rightPaneWikiContent: data.content,
              rightPaneBacklinks: backlinks,
              historyIndex: newIndex,
              currentWikiId: wikiId,
            });
          }
        }
      },

      canGoBack: () => get().historyIndex > 0,
      canGoForward: () => get().historyIndex < get().documentHistory.length - 1,

      // ============================================
      // 弹窗 Actions 实现
      // ============================================
      setIsUserDragging: (dragging) => set({ isUserDragging: dragging }),

      setPopups: (popups) => set({ popups }),

      bringToFront: (id) => set({ activePopupId: id }),

      togglePin: (id) =>
        set((prev) => ({
          popups: prev.popups.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)),
        })),

      toggleMinimize: (id) =>
        set((prev) => ({
          popups: prev.popups.map((p) => (p.id === id ? { ...p, isMinimized: !p.isMinimized } : p)),
        })),

      closePopup: (id) =>
        set((prev) => {
          const popupToClose = prev.popups.find((p) => p.id === id);
          if (!popupToClose) {
            return { popups: prev.popups.filter((p) => p.id !== id) };
          }
          const newRecentlyClosed = [
            { popup: popupToClose, closedAt: Date.now() },
            ...prev.recentlyClosedPopups.filter((rc) => rc.popup.id !== id),
          ].slice(0, 5);

          return {
            popups: prev.popups.filter((p) => p.id !== id),
            recentlyClosedPopups: newRecentlyClosed,
          };
        }),

      restorePopup: (id) =>
        set((prev) => {
          const closedPopup = prev.recentlyClosedPopups.find((rc) => rc.popup.id === id);
          if (!closedPopup) return prev;
          return {
            popups: [...prev.popups, { ...closedPopup.popup, isMinimized: false }],
            recentlyClosedPopups: prev.recentlyClosedPopups.filter((rc) => rc.popup.id !== id),
            activePopupId: id,
          };
        }),

      setLoadingWikiId: (id) => set({ loadingWikiId: id }),

      navigatePopover: (_id, _direction) => {
        // Stub implementation
      },

      handleMouseEnter: (e: MouseEvent | React.MouseEvent<Element>, wikiId: string, depth = 0) => {
        if (get().isUserDragging) return;

        const existingOpen = hoverTimers.get(wikiId);
        if (existingOpen) {
          clearTimeout(existingOpen);
          hoverTimers.delete(wikiId);
        }
        const existingClose = hoverTimers.get(`close-${wikiId}`);
        if (existingClose) {
          clearTimeout(existingClose);
          hoverTimers.delete(`close-${wikiId}`);
        }

        set({ loadingWikiId: wikiId });

        const clientX = e.clientX;
        const clientY = e.clientY;

        const timerId = setTimeout(async () => {
          hoverTimers.delete(wikiId);
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
        }, 220);

        hoverTimers.set(wikiId, timerId);
      },

      handleMouseLeave: (wikiId: string) => {
        set({ loadingWikiId: null });
        if (get().isUserDragging) return;

        const existingOpen = hoverTimers.get(wikiId);
        if (existingOpen) {
          clearTimeout(existingOpen);
          hoverTimers.delete(wikiId);
        }

        if (wikiId === 'any') {
          hoverTimers.forEach((timer, key) => {
            if (!key.startsWith('close-')) {
              clearTimeout(timer);
              hoverTimers.delete(key);
            }
          });
          return;
        }

        const closeTimerKey = `close-${wikiId}`;
        const existingClose = hoverTimers.get(closeTimerKey);
        if (existingClose) clearTimeout(existingClose);

        const timerId = setTimeout(() => {
          hoverTimers.delete(closeTimerKey);
          set((prev) => ({
            popups: prev.popups.filter((p) =>
              p.id === wikiId && p.isPinned ? true : p.id !== wikiId
            ),
          }));
        }, 320);

        hoverTimers.set(closeTimerKey, timerId);
      },

      handlePopoverMouseEnter: (wikiId: string) => {
        if (get().isUserDragging) return;
        const closeTimerKey = `close-${wikiId}`;
        const existingCloseTimer = hoverTimers.get(closeTimerKey);
        if (existingCloseTimer) {
          clearTimeout(existingCloseTimer);
          hoverTimers.delete(closeTimerKey);
        }
      },

      handlePopoverMouseLeave: (wikiId: string) => {
        get().handleMouseLeave(wikiId);
      },

      handlePositionChange: async (id, x, y) => {
        set((prev) => ({
          popups: prev.popups.map((p) => (p.id === id ? { ...p, x, y, isPinned: true } : p)),
        }));
        await db.popoverStates.update(id, { x, y }).catch(async () => {
          await db.popoverStates.put({ id, x, y, width: 500, height: 320 });
        });
      },

      handleSizeChange: async (id, width, height) => {
        set((prev) => ({
          popups: prev.popups.map((p) =>
            p.id === id ? { ...p, width, height, isPinned: true } : p
          ),
        }));
        await db.popoverStates.update(id, { width, height }).catch(async () => {
          await db.popoverStates.put({ id, x: 100, y: 100, width, height });
        });
      },

      // ============================================
      // 初始化方法
      // ============================================
      initializeWorkspace: async () => {
        await seedDatabase();

        let leftDoc = await getDocument('main-editor-doc');
        if (!leftDoc) {
          leftDoc = {
            id: 'main-editor-doc',
            title: 'Topology Math',
            content: `# Compactness in topological spaces\n\nThis space maps the foundational structures of topological spaces. It bridges the intuitive notion of [closeness](compactness) without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.\n\nA topological space is a set endowed with a structure, called a topology, which allows defining continuous deformation of subspaces. Generalizing the [Heine–Borel](heine-borel) theorem requires us to move beyond Euclidean constraints.\n\nThis brings us to [Tychonoff's Theorem](tychonoff), which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.`,
            badge: 'Active Draft',
            badgeClass: 'tag-badge-blue',
            updatedAt: Date.now(),
          };
          await db.documents.add(leftDoc);
        }

        set({ documentText: leftDoc.content });

        const activeId = get().currentWikiId;
        if (activeId) {
          const doc = await getDocument(activeId);
          if (doc) {
            const backlinks = await getBacklinks(activeId);
            set({
              rightPaneWikiTitle: doc.title,
              rightPaneWikiContent: doc.content,
              rightPaneBacklinks: backlinks,
              currentWikiId: activeId,
            });
          }
        }

        const state = get();
        const storedMetadata =
          ('pinnedPopoverMetadata' in state
            ? (state as unknown as { pinnedPopoverMetadata: PinnedPopoverMetadata[] })
                .pinnedPopoverMetadata
            : []) || [];
        const restoredPopups: PopupData[] = [];
        for (const meta of storedMetadata) {
          const docData = await getDocument(meta.id);
          const popoverPos = await db.popoverStates.get(meta.id);
          if (docData) {
            restoredPopups.push({
              id: meta.id,
              title: docData.title,
              excerpt: docData.content.substring(0, 180) + '...',
              badge: docData.badge,
              badgeClass: docData.badgeClass,
              x: popoverPos?.x ?? 120,
              y: popoverPos?.y ?? 120,
              width: popoverPos?.width ?? 500,
              height: popoverPos?.height ?? 320,
              isPinned: meta.isPinned,
              isMinimized: meta.isMinimized,
              depth: 1,
              history: [meta.id],
              historyIndex: 0,
            });
          }
        }
        set({ popups: restoredPopups });
      },
    }),
    {
      name: 'axiom-ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        activePage: state.activePage,
        isSidebarPinned: state.isSidebarPinned,
        isZenMode: state.isZenMode,
        currentWikiId: state.currentWikiId,
        pinnedPopoverMetadata: state.popups.map((p) => ({
          id: p.id,
          isPinned: p.isPinned,
          isMinimized: p.isMinimized,
        })),
      }),
    }
  )
);

// ============================================
// 向后兼容别名
// ============================================

/** @deprecated 使用 useUiStore 代替 */
export type AppStore = UiState;
/** @deprecated 使用 useUiStore 代替 */
export const useAppStore = useUiStore;
