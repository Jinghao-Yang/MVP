/**
 * 编辑器状态管理 Store
 * 管理文档内容、历史记录导航等编辑器相关状态
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { getDocument, updateDocumentContent, getBacklinks } from '@/db/documents';

export interface EditorState {
  // 当前 Wiki ID
  currentWikiId: string | null;
  // 右侧面板 Wiki 标题
  rightPaneWikiTitle: string;
  // 右侧面板 Wiki 内容
  rightPaneWikiContent: string;
  // 右侧面板反向链接
  rightPaneBacklinks: string[];
  // 文档文本
  documentText: string;
  // 文档历史记录
  documentHistory: string[];
  // 历史记录索引
  historyIndex: number;

  // 设置当前 Wiki ID
  setCurrentWikiId: (id: string | null) => void;
  // 设置文档文本（带防抖保存）
  setDocumentText: (text: string) => void;
  // 设置右侧面板内容（带防抖保存）
  setRightPaneWikiContent: (text: string) => void;
  // 加载 Wiki 内容
  loadWikiContent: (wikiId: string) => Promise<void>;
  // 后退
  goBack: () => Promise<void>;
  // 前进
  goForward: () => Promise<void>;
  // 是否可以后退
  canGoBack: () => boolean;
  // 是否可以前进
  canGoForward: () => boolean;
}

// 防抖定时器
let documentDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let rightPaneDebounceTimer: ReturnType<typeof setTimeout> | null = null;

export const useEditorStore = create<EditorState>()(
  persist(
    (set, get) => ({
      currentWikiId: null,
      rightPaneWikiTitle: '',
      rightPaneWikiContent: '',
      rightPaneBacklinks: [],
      documentText: '',
      documentHistory: [],
      historyIndex: -1,

      setCurrentWikiId: (id) => set({ currentWikiId: id }),

      setDocumentText: (text) => {
        set({ documentText: text });
        if (documentDebounceTimer) clearTimeout(documentDebounceTimer);
        documentDebounceTimer = setTimeout(async () => {
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
    }),
    {
      name: 'axiom-editor-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: EditorState) => ({
        currentWikiId: state.currentWikiId,
      }),
    }
  )
);
