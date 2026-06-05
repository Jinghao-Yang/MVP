import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  zenModeOpacity: number;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (fontSize: 'small' | 'medium' | 'large') => void;
  setZenModeOpacity: (opacity: number) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      fontSize: 'medium',
      zenModeOpacity: 0.8,
      setTheme: (theme) => set({ theme }),
      setFontSize: (fontSize) => set({ fontSize }),
      setZenModeOpacity: (opacity) => set({ zenModeOpacity: opacity }),
    }),
    {
      name: 'axiom-settings', // item name in local storage
    }
  )
);
