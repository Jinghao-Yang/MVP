/* ================================================
   FILE: src/editor/components/MinimizedPopups.tsx
   ================================================ */
import { useShallow } from 'zustand/react/shallow';
import type { PopupData } from '@/types';
import { usePopupStore, type PopupState } from '@/stores';

export function MinimizedPopups() {
  const { popups, recentlyClosedPopups, toggleMinimize, restorePopup } = usePopupStore(
    useShallow((state: PopupState) => ({
      popups: state.popups,
      recentlyClosedPopups: state.recentlyClosedPopups,
      toggleMinimize: state.toggleMinimize,
      restorePopup: state.restorePopup,
    }))
  );

  const minimizedPopups = popups.filter((p: PopupData) => p.isMinimized);

  return (
    <>
      {minimizedPopups.length > 0 && (
        <div className="fixed bottom-24 right-6 z-50 flex flex-wrap gap-2 items-center justify-end max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="font-mono text-xs uppercase text-neutral-400 mr-1 select-none">
            Minimized:
          </span>
          {minimizedPopups.map((p: PopupData) => (
            <button
              key={p.id}
              onClick={() => toggleMinimize(p.id)}
              className="px-2.5 py-1.5 glass-panel text-xs font-bold uppercase tracking-wider shadow-md hover-ui cursor-pointer border-none flex items-center gap-1 bg-white/70"
            >
              <span>📂</span>
              <span>{p.title}</span>
            </button>
          ))}
        </div>
      )}

      {recentlyClosedPopups.length > 0 && (
        <div className="fixed bottom-14 right-6 z-50 flex flex-wrap gap-2 items-center justify-end max-w-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="font-mono text-xs uppercase text-neutral-400 mr-1 select-none">
            Recently Closed:
          </span>
          {recentlyClosedPopups.map((rc) => (
            <button
              key={rc.popup.id}
              onClick={() => restorePopup(rc.popup.id)}
              className="px-2.5 py-1.5 glass-panel text-xs font-bold uppercase tracking-wider shadow-md hover-ui cursor-pointer border-none flex items-center gap-1 bg-neutral-800/80 text-white"
              title={`Click to restore "${rc.popup.title}"`}
            >
              <span>🗑️</span>
              <span>{rc.popup.title}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
