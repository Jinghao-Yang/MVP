import { StateCreator } from 'zustand';

export interface UiSlice {
  activePage: string;
  isSidebarHovered: boolean;
  isZenMode: boolean;
  isCommandPaletteOpen: boolean;
  statusMsg: string;
  showStatus: boolean;
  isSidebarPinned: boolean;

  setActivePage: (page: string) => void;
  setSidebarHovered: (hovered: boolean) => void;
  setZenMode: (zen: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setStatus: (msg: string) => void;
  toggleSidebarPin: () => void;
}

let statusTimeout: NodeJS.Timeout | null = null;

export const createUiSlice: StateCreator<UiSlice> = (set, get) => ({
  activePage: 'project',
  isSidebarHovered: false,
  isZenMode: false,
  isCommandPaletteOpen: false,
  statusMsg: 'System active.',
  showStatus: true,
  isSidebarPinned: false,

  setActivePage: (page) => set({ activePage: page, isZenMode: false, isSidebarHovered: false }),

  setSidebarHovered: (hovered) => {
    if (get().isZenMode) return;
    set({ isSidebarHovered: hovered });
  },

  setZenMode: (zen) => set({ isZenMode: zen }),

  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),

  setStatus: (msg) => {
    set({ statusMsg: msg, showStatus: true });
    if (statusTimeout) clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      set({ showStatus: false });
    }, 2500);
  },

  toggleSidebarPin: () => {
    set((state) => ({ isSidebarPinned: !state.isSidebarPinned }));
  },
});
