import { StateCreator } from 'zustand';
import { wikiDb } from '@/data/wikiDb';

export interface EditorSlice {
  quickCaptureText: string;
  documentText: string;
  documentHistory: string[];
  historyIndex: number;
  currentWikiId: string | null;

  setQuickCaptureText: (text: string) => void;
  setDocumentText: (text: string) => void;
  loadWikiContent: (wikiId: string) => void;
  goBack: () => void;
  goForward: () => void;
  canGoBack: () => boolean;
  canGoForward: () => boolean;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set, get) => ({
  quickCaptureText: '',
  documentText: '',
  documentHistory: [],
  historyIndex: -1,
  currentWikiId: null,

  setQuickCaptureText: (text) => set({ quickCaptureText: text }),
  setDocumentText: (text) => set({ documentText: text }),

  loadWikiContent: (wikiId) => {
    const state = get();
    const data = wikiDb[wikiId];

    if (data) {
      // 生成文档内容
      const content = `# ${data.title}\n\n${data.excerpt}\n\n---\n\n*Badge: ${data.badge}*`;

      // 更新历史记录
      const newHistory = state.documentHistory.slice(0, state.historyIndex + 1);
      newHistory.push(wikiId);

      set({
        documentText: content,
        documentHistory: newHistory,
        historyIndex: newHistory.length - 1,
        currentWikiId: wikiId,
      });
    }
  },

  goBack: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      const wikiId = state.documentHistory[newIndex];
      const data = wikiDb[wikiId];

      if (data) {
        const content = `# ${data.title}\n\n${data.excerpt}\n\n---\n\n*Badge: ${data.badge}*`;
        set({
          documentText: content,
          historyIndex: newIndex,
          currentWikiId: wikiId,
        });
      }
    }
  },

  goForward: () => {
    const state = get();
    if (state.historyIndex < state.documentHistory.length - 1) {
      const newIndex = state.historyIndex + 1;
      const wikiId = state.documentHistory[newIndex];
      const data = wikiDb[wikiId];

      if (data) {
        const content = `# ${data.title}\n\n${data.excerpt}\n\n---\n\n*Badge: ${data.badge}*`;
        set({
          documentText: content,
          historyIndex: newIndex,
          currentWikiId: wikiId,
        });
      }
    }
  },

  canGoBack: () => get().historyIndex > 0,
  canGoForward: () => get().historyIndex < get().documentHistory.length - 1,
});
