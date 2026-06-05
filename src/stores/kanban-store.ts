import { create } from 'zustand';
import {
  getKanbanCards,
  updateCardColumn as dbUpdateCardColumn,
  addQuickCaptureNote,
} from '@/db/cards';
import { showErrorToast } from '@/utils/error-handler';
import type { KanbanCardEntity } from '@/types';

export interface KanbanState {
  kanbanCards: KanbanCardEntity[];
  quickCaptureText: string;
  error: string | null;

  loadKanbanCards: () => Promise<void>;
  updateCardColumn: (cardId: string, newColumnId: string) => Promise<void>;
  setQuickCaptureText: (text: string) => void;
  quickCaptureSubmit: (setStatus: (msg: string) => void) => Promise<void>;
  clearError: () => void;
}

export const useKanbanStore = create<KanbanState>()((set, get) => ({
  kanbanCards: [],
  quickCaptureText: '',
  error: null,

  loadKanbanCards: async () => {
    try {
      const cards = await getKanbanCards();
      set({ kanbanCards: cards });
    } catch (error) {
      const errorMsg = 'Failed to load cards. Please try again.';
      set({ error: errorMsg });
      showErrorToast(errorMsg);
    }
  },

  updateCardColumn: async (cardId, newColumnId) => {
    try {
      set({ error: null });
      const cards = await dbUpdateCardColumn(cardId, newColumnId);
      set({ kanbanCards: cards });
    } catch (err) {
      const errorMsg = 'Failed to update card position. Please try again.';
      set({ error: errorMsg });
      showErrorToast(errorMsg);
    }
  },

  setQuickCaptureText: (text) => set({ quickCaptureText: text }),

  quickCaptureSubmit: async (setStatus) => {
    try {
      set({ error: null });
      const text = get().quickCaptureText;
      const cards = await addQuickCaptureNote(text);
      set({ quickCaptureText: '', kanbanCards: cards });
      setStatus('Idea Captured as Fleeting Card.');
    } catch (err) {
      const errorMsg = 'Failed to save your note. Please try again.';
      set({ error: errorMsg });
      showErrorToast(errorMsg);
    }
  },

  clearError: () => set({ error: null }),
}));