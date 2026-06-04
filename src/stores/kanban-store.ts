import { create } from 'zustand';
import type { KanbanCardEntity } from '@/types';
import {
  getKanbanCards,
  updateCardColumn as dbUpdateCardColumn,
  addQuickCaptureNote,
} from '@/db/cards';

export interface KanbanState {
  kanbanCards: KanbanCardEntity[];
  quickCaptureText: string;

  loadKanbanCards: () => Promise<void>;
  updateCardColumn: (cardId: string, newColumnId: string) => Promise<void>;
  setQuickCaptureText: (text: string) => void;
  quickCaptureSubmit: (setStatus: (msg: string) => void) => Promise<void>;
}

export const useKanbanStore = create<KanbanState>()((set, get) => ({
  kanbanCards: [],
  quickCaptureText: '',

  loadKanbanCards: async () => {
    const cards = await getKanbanCards();
    set({ kanbanCards: cards });
  },

  updateCardColumn: async (cardId, newColumnId) => {
    const cards = await dbUpdateCardColumn(cardId, newColumnId);
    set({ kanbanCards: cards });
  },

  setQuickCaptureText: (text) => set({ quickCaptureText: text }),

  quickCaptureSubmit: async (setStatus) => {
    const text = get().quickCaptureText;
    const cards = await addQuickCaptureNote(text);
    set({ quickCaptureText: '', kanbanCards: cards });
    setStatus('Idea Captured as Fleeting Card.');
  },
}));
