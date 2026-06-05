/**
 * 编辑器状态管理 Store
 * 管理文档内容、历史记录导航等编辑器相关状态
 */

import { create } from 'zustand';
import { documentService } from '@/services/document-service';

export interface EditorState {
  currentWikiId: string | null;
  documentText: string;
  documentHistory: string[];
  historyIndex: number;

  setCurrentWikiId: (id: string | null) => void;
  setDocumentText: (text: string) => void;
  loadDocumentText: (documentId: string) => Promise<void>;
  loadWikiContent: (wikiId: string) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

const MAX_HISTORY_LENGTH = 50;

export const useEditorStore = create<EditorState>()((set, get) => ({
  currentWikiId: null,
  documentText: '',
  documentHistory: [],
  historyIndex: -1,

  setCurrentWikiId: (id: string | null) => set({ currentWikiId: id }),

  setDocumentText: (text: string) => set({ documentText: text }),

  loadDocumentText: async (documentId: string) => {
    try {
      const data = await documentService.getDocument(documentId);
      if (data) {
        set({
          documentText: data.content,
        });
      }
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  },

  loadWikiContent: (wikiId: string) => {
    const state = get();
    const newHistory = state.documentHistory.slice(0, state.historyIndex + 1);
    if (newHistory[newHistory.length - 1] !== wikiId) {
      newHistory.push(wikiId);
    }
    const trimmedHistory =
      newHistory.length > MAX_HISTORY_LENGTH ? newHistory.slice(-MAX_HISTORY_LENGTH) : newHistory;
    set({
      currentWikiId: wikiId,
      documentHistory: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  },

  goBack: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const wikiId = state.documentHistory[newIndex];
      set({
        currentWikiId: wikiId,
        historyIndex: newIndex,
      });
    }
  },

  goForward: () => {
    const state = get();
    if (state.historyIndex < state.documentHistory.length - 1) {
      const newIndex = state.historyIndex + 1;
      const wikiId = state.documentHistory[newIndex];
      set({
        currentWikiId: wikiId,
        historyIndex: newIndex,
      });
    }
  },

  canGoBack: () => {
    return get().historyIndex > 0;
  },

  canGoForward: () => {
    const state = get();
    return state.historyIndex < state.documentHistory.length - 1;
  },
}));
