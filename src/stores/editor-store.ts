import { create } from 'zustand';
import { documentService } from '@/services/document-service';
import { showErrorToast } from '@/utils/error-handler';

export interface EditorState {
  /** 当前文档文本 */
  documentText: string;
  /** 原始文档文本（用于检测脏标记） */
  originalDocumentText: string;
  /** 文档是否有未保存的更改 */
  isDirty: boolean;

  /** 设置文档文本 */
  setDocumentText: (text: string) => void;
  /** 重置文档文本到原始状态 */
  resetDocumentText: () => void;
  /** 标记文档为已保存（更新原始文本） */
  markAsSaved: () => void;
  /** 加载文档文本 */
  loadDocumentText: (documentId: string) => Promise<void>;
  /** 清空文档状态 */
  clearDocument: () => void;
}

export const useEditorStore = create<EditorState>()((set, get) => ({
  documentText: '',
  originalDocumentText: '',
  isDirty: false,

  setDocumentText: (text) => {
    const originalText = get().originalDocumentText;
    set({
      documentText: text,
      isDirty: text !== originalText,
    });
  },

  resetDocumentText: () => {
    const originalText = get().originalDocumentText;
    set({
      documentText: originalText,
      isDirty: false,
    });
  },

  markAsSaved: () => {
    const currentText = get().documentText;
    set({
      originalDocumentText: currentText,
      isDirty: false,
    });
  },

  loadDocumentText: async (documentId) => {
    try {
      const doc = await documentService.getDocument(documentId);
      if (doc) {
        set({
          documentText: doc.content,
          originalDocumentText: doc.content,
          isDirty: false,
        });
      }
    } catch (error) {
      showErrorToast('Failed to load document');
    }
  },

  clearDocument: () => {
    set({
      documentText: '',
      originalDocumentText: '',
      isDirty: false,
    });
  },
}));
