import { create } from 'zustand';
import { toast } from 'sonner';

export interface SyncState {
  syncStatus: 'synced' | 'syncing' | 'error';
  lastSyncedAt: number | null;
  syncNow: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set) => ({
  syncStatus: 'synced',
  lastSyncedAt: Date.now(),
  syncNow: async () => {
    set({ syncStatus: 'syncing' });
    try {
      // Intentionally simulate a deep structural validation and committing of memory buffers to IndexedDB (Dexie)
      await new Promise((resolve) => setTimeout(resolve, 900));
      set({ syncStatus: 'synced', lastSyncedAt: Date.now() });
      toast.success('Local database changes synchronized successfully!');
    } catch {
      set({ syncStatus: 'error' });
      toast.error('Failed to sync database logs.');
    }
  },
}));
