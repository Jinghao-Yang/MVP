import { StateCreator } from 'zustand';

export interface EditorSlice {
  quickCaptureText: string;
  documentText: string;

  setQuickCaptureText: (text: string) => void;
  setDocumentText: (text: string) => void;
}

export const createEditorSlice: StateCreator<EditorSlice> = (set) => ({
  quickCaptureText: '',
  documentText: '',

  setQuickCaptureText: (text) => set({ quickCaptureText: text }),
  setDocumentText: (text) => set({ documentText: text }),
});
