/**
 * 编辑器状态管理 Store
 * 管理文档内容、历史记录导航等编辑器相关状态
 */

import { create } from 'zustand';
import { documentService } from '@/services/document-service';

export interface EditorState {
  currentWikiId: string | null;
  documentText: string;

  setCurrentWikiId: (id: string | null) => void;
  setDocumentText: (text: string) => void;
  loadDocumentText: (documentId: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>()((set) => ({
  currentWikiId: null,
  documentText: '',

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
}));
