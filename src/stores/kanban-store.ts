import { create } from 'zustand';
import type { KanbanCardEntity } from '@/types';
import {
  getKanbanCards,
  updateCardColumn as dbUpdateCardColumn,
  addQuickCaptureNote,
} from '@/db/cards';
import { useUiStore } from '@/stores/ui-store';

const showError = (message: string) => {
  useUiStore.getState().setStatus(message);
};

export interface KanbanState {
  kanbanCards: KanbanCardEntity[];
  quickCaptureText: string;
  error: string | null;
  loading: boolean;

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
  loading: false,

  loadKanbanCards: async () => {
    try {
      set({ loading: true, error: null });
      const cards = await getKanbanCards();
      set({ kanbanCards: cards, loading: false });
    } catch (err) {
      console.error('Failed to load kanban cards:', err);
      const errorMsg = 'Failed to load kanban cards. Please try again.';
      set({ error: errorMsg, loading: false });
      showError(errorMsg);
    }
  },

  updateCardColumn: async (cardId, newColumnId) => {
    try {
      set({ error: null });
      const cards = await dbUpdateCardColumn(cardId, newColumnId);
      set({ kanbanCards: cards });
    } catch (err) {
      console.error('Failed to update card column:', err);
      const errorMsg = 'Failed to update card position. Please try again.';
      set({ error: errorMsg });
      showError(errorMsg);
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
      console.error('Failed to submit quick capture:', err);
      const errorMsg = 'Failed to save your note. Please try again.';
      set({ error: errorMsg });
      showError(errorMsg);
    }
  },

  clearError: () => set({ error: null }),
}));
