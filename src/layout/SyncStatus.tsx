/* ================================================
   FILE: src/layout/SyncStatus.tsx
   ================================================ */
import { RotateCw } from 'lucide-react';

interface SyncStatusProps {
  syncStatus: string;
  lastSynced: number | null;
  onSyncNow: () => void;
}

export function SyncStatus({ syncStatus, lastSynced, onSyncNow }: SyncStatusProps) {
  return (
    <div className="p-4 border-t border-neutral-200/30 bg-neutral-50/40 space-y-2.5">
      <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 shrink-0">
        <span>Data Integrity</span>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold ${
            syncStatus === 'syncing'
              ? 'bg-bh-yellow/20 text-yellow-700 animate-pulse'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {syncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
        </span>
      </div>

      <button
        onClick={onSyncNow}
        disabled={syncStatus === 'syncing'}
        className="w-full h-8 flex items-center justify-center gap-2 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-white bg-white/65 text-xs text-neutral-800 font-bold transition-all cursor-pointer select-none shrink-0"
      >
        <RotateCw
          className={`w-3 h-3 text-neutral-500 ${syncStatus === 'syncing' ? 'animate-spin text-bh-yellow' : ''}`}
        />
        <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync'}</span>
      </button>

      {lastSynced && (
        <div className="text-[8px] font-mono text-center text-neutral-400 select-none shrink-0">
          Synced T: {new Date(lastSynced).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}
