import { useSettingsStore } from '@/stores';
import { db } from '@/db/dexie';
import { toast } from 'sonner';
import { DownloadCloud, UploadCloud, RefreshCw } from 'lucide-react';

export function SettingsView() {
  const { theme, fontSize, setTheme, setFontSize } = useSettingsStore();

  const handleExportData = async () => {
    try {
      const documents = await db.documents.toArray();
      const kanbanCards = await db.kanbanCards.toArray();
      const links = await db.links.toArray();

      const data = {
        documents,
        kanbanCards,
        links,
        timestamp: Date.now(),
        version: '1.0',
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `axiom-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Database exported successfully!');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImportData = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'application/json';
    fileInput.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const data = JSON.parse(text);

        if (!data.documents || !data.kanbanCards || !data.links) {
          throw new Error('Invalid backup format');
        }

        await db.transaction('rw', db.documents, db.kanbanCards, db.links, async () => {
          await db.documents.clear();
          await db.kanbanCards.clear();
          await db.links.clear();

          await db.documents.bulkAdd(data.documents);
          await db.kanbanCards.bulkAdd(data.kanbanCards);
          await db.links.bulkAdd(data.links);
        });

        toast.success('Database imported successfully! Please refresh.');

        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } catch (err) {
        console.error(err);
        toast.error('Failed to import data: ' + (err as Error).message);
      }
    };
    fileInput.click();
  };

  const handleResetData = async () => {
    if (window.confirm('Are you sure you want to clear ALL data? This cannot be undone.')) {
      try {
        await db.transaction('rw', db.documents, db.kanbanCards, db.links, async () => {
          await db.documents.clear();
          await db.kanbanCards.clear();
          await db.links.clear();
        });
        toast.success('Database cleared. Reloading...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch {
        toast.error('Failed to reset data');
      }
    }
  };

  return (
    <div className="page-panel space-y-8 pane-active">
      <div>
        <h2 className="font-human text-4xl font-normal tracking-tight">System Settings</h2>
        <p className="text-[var(--text-muted)] font-sys text-sm mt-2">
          Manage application preferences and data persistence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-panel p-6 border border-white/50 space-y-6">
          <h3 className="font-sys text-lg font-bold">Preferences</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-neutral-700">
                Theme Preference
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                className="w-full bg-white/50 border border-neutral-200 p-2 text-sm outline-none focus:border-neutral-400 transition-colors"
              >
                <option value="system">System (Auto)</option>
                <option value="light">Light Bauhaus</option>
                <option value="dark">Dark Bauhaus</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-neutral-700">
                Editor Font Size
              </label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value as 'small' | 'medium' | 'large')}
                className="w-full bg-white/50 border border-neutral-200 p-2 text-sm outline-none focus:border-neutral-400 transition-colors"
              >
                <option value="small">Small (Compact)</option>
                <option value="medium">Medium (Standard)</option>
                <option value="large">Large (Reading)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6 border border-white/50 space-y-6">
          <h3 className="font-sys text-lg font-bold">Data Management</h3>

          <div className="space-y-4">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-3 bg-white/40 hover:bg-white/70 border border-white transition-colors text-left group"
            >
              <div>
                <div className="font-bold text-sm">Export Database</div>
                <div className="text-xs text-neutral-500">
                  Download your workspace as JSON backup
                </div>
              </div>
              <DownloadCloud className="w-4 h-4 text-neutral-400 group-hover:text-black" />
            </button>

            <button
              onClick={handleImportData}
              className="w-full flex items-center justify-between p-3 bg-white/40 hover:bg-white/70 border border-white transition-colors text-left group"
            >
              <div>
                <div className="font-bold text-sm">Import Database</div>
                <div className="text-xs text-neutral-500">
                  Restore your workspace from JSON backup
                </div>
              </div>
              <UploadCloud className="w-4 h-4 text-neutral-400 group-hover:text-black" />
            </button>

            <button
              onClick={handleResetData}
              className="w-full flex items-center justify-between p-3 bg-red-50 hover:bg-red-100 border border-red-100 transition-colors text-left group"
            >
              <div>
                <div className="font-bold text-sm text-red-700">Erase Workspace</div>
                <div className="text-xs text-red-500">Factory reset local database</div>
              </div>
              <RefreshCw className="w-4 h-4 text-red-400 group-hover:text-red-700" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
