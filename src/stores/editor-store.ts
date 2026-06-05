import { create } from 'zustand';
import { documentService } from '@/services/document-service';

export interface EditorState {
  documentText: string;
  setDocumentText: (text: string) => void;
  loadDocumentText: (documentId: string) => Promise<void>;
}

export const useEditorStore = create<EditorState>()((set) => ({
  documentText: '',

  setDocumentText: (text) => set({ documentText: text }),

  loadDocumentText: async (documentId) => {
    try {
      const doc = await documentService.getDocument(documentId);
      if (doc) {
        set({ documentText: doc.content });
      }
    } catch (error) {
      console.error('Failed to load document text:', error);
    }
  },
}));
