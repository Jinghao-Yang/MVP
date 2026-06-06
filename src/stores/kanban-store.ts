import { create } from 'zustand';
import { documentService } from '@/services/document-service';
import { showErrorToast } from '@/utils/error-handler';

export interface KanbanState {
  quickCaptureText: string;
  error: string | null;

  setQuickCaptureText: (text: string) => void;
  quickCaptureSubmit: (setStatus: (msg: string) => void) => Promise<void>;
  clearError: () => void;
}

export const useKanbanStore = create<KanbanState>()((set, get) => ({
  quickCaptureText: '',
  error: null,

  setQuickCaptureText: (text) => set({ quickCaptureText: text }),

  quickCaptureSubmit: async (setStatus) => {
    try {
      set({ error: null });
      const text = get().quickCaptureText.trim();
      if (!text) return;

      // 生成唯一 ID
      const id = `fleeting-${Date.now()}`;

      // 创建 Fleeting 文档
      await documentService.createDocument({
        id,
        title: 'Fleeting Note',
        content: text,
        badge: 'Fleeting',
        badgeClass: 'tag-badge-yellow',
        updatedAt: Date.now(),
      });

      set({ quickCaptureText: '' });
      setStatus('Idea Captured as Fleeting Note.');
    } catch {
      const errorMsg = 'Failed to save your note. Please try again.';
      set({ error: errorMsg });
      showErrorToast(errorMsg);
    }
  },

  clearError: () => set({ error: null }),
}));
