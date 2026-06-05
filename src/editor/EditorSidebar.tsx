/* ================================================
   FILE: src/editor/EditorSidebar.tsx
   ================================================ */
import { memo } from 'react';
import { MessageSquare } from 'lucide-react';
import type { EditorSidebarProps } from '@/types';

export const EditorSidebar = memo(function EditorSidebar({ isZenMode }: EditorSidebarProps) {
  return (
    <aside
      id="editor-context-panel"
      style={{
        width: isZenMode ? '0px' : '320px',
        padding: isZenMode ? '0px' : '1.5rem',
        opacity: isZenMode ? 0 : 1,
        borderLeft: isZenMode ? '0px solid transparent' : '1px solid rgba(28, 28, 26, 0.08)',
        pointerEvents: isZenMode ? 'none' : 'auto',
      }}
      className="bg-white/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-500 overflow-hidden h-full"
    >
      <div className="space-y-6 animate-in fade-in duration-300 font-sys text-xs w-full overflow-y-auto scroll-hide">
        <div className="sidebar-label text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-1 px-1">
          Marginalia & Comments
        </div>

        <div className="bg-white/50 border border-neutral-200/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-bh-red font-bold">
            <MessageSquare className="w-3.5 h-3.5" /> Line 3 / Closeness
          </div>
          <p className="font-human italic text-neutral-600 leading-relaxed text-sm">
            "bridges the intuitive notion of closeness..."
          </p>
          <p className="font-sys text-neutral-500 leading-relaxed text-xs">
            Note: Closeness is modeled strictly via topology neighborhoods, distinct from metric
            distance bounds.
          </p>
        </div>

        <div className="bg-white/50 border border-neutral-200/50 p-4 rounded-xl space-y-2">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase text-bh-blue font-bold">
            <MessageSquare className="w-3.5 h-3.5" /> Heine–Borel Ext.
          </div>
          <p className="font-human italic text-neutral-600 leading-relaxed text-sm">
            "Generalizing the Heine–Borel theorem..."
          </p>
          <p className="font-sys text-neutral-500 leading-relaxed text-xs">
            Closed and bounded in general topological vector spaces fails to imply compactness
            without metric completeness.
          </p>
        </div>
      </div>
    </aside>
  );
});
