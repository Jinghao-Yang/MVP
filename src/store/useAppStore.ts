import { create } from 'zustand';
import { createUiSlice, type UiSlice } from './slices/uiSlice';
import { createEditorSlice, type EditorSlice } from './slices/editorSlice';
import { createPopoverSlice, type PopoverSlice } from './slices/popoverSlice';

export type AppStore = UiSlice & EditorSlice & PopoverSlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createUiSlice(...a),
  ...createEditorSlice(...a),
  ...createPopoverSlice(...a),
}));
