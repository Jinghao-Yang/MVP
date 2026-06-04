import { Eye, EyeOff } from 'lucide-react';
import type React from 'react';

interface EditorContentProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  onOpenPage: (page: string) => void;
  activeSidebarTab: 'context' | 'annotations';
  onSidebarTabChange: (tab: 'context' | 'annotations') => void;
  onLinkHover: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, wikiId: string, depth: number) => void;
  onLinkLeave: (wikiId: string) => void;
}

export function EditorContent({
  isZenMode,
  onToggleZen,
  onOpenPage,
  activeSidebarTab,
  onSidebarTabChange,
  onLinkHover,
  onLinkLeave
}: EditorContentProps) {
  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto scroll-hide">
      <header className="h-20 flex items-center justify-between px-12 z-10 shrink-0 sticky top-0 bg-gradient-to-b from-[var(--bg-canvas)] to-transparent">
        <div className="font-sys text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] flex items-center gap-3">
          <span className="hover:text-[var(--text-main)] cursor-pointer transition-colors" onClick={() => onOpenPage('project')}>Topology Math</span>
          <span className="font-serif italic text-sm opacity-50">/</span>
          <span className="text-[var(--text-main)] font-semibold font-sys">Focus Mode</span>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white/30 backdrop-blur-md border border-black/5">
          <button 
            onClick={() => onSidebarTabChange('context')} 
            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border-none cursor-pointer rounded-none transition-colors ${
              activeSidebarTab === 'context' ? 'text-black bg-white/60 shadow-sm' : 'text-neutral-500 hover:text-black'
            }`}
          >
            Context
          </button>
          <button 
            onClick={() => onSidebarTabChange('annotations')} 
            className={`px-3 py-1.5 text-[10px] uppercase tracking-widest font-bold border-none cursor-pointer rounded-none transition-colors flex items-center gap-1.5 ${
              activeSidebarTab === 'annotations' ? 'text-black bg-white/60 shadow-sm' : 'text-neutral-500 hover:text-black'
            }`}
          >
            Annotations <span className="bg-[var(--bh-red)] text-white px-1.5 py-0.5 rounded-full text-[8px] leading-none font-sans">3</span>
          </button>
          <div className="w-px h-3 bg-black/10 mx-1"></div>
          <button onClick={onToggleZen} className="hover-ui p-1.5 cursor-pointer border-none rounded-none" title="Zen Toggle">
            {isZenMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      <div className="px-12 lg:px-20 pt-16 pb-64 flex justify-center">
        <div className="w-full max-w-[680px] relative">
          
          <div className="mb-12">
            <span className="font-sys text-[10px] uppercase tracking-widest text-[var(--bh-red)] block mb-4">Document // 01</span>
            <h1 className="font-human text-6.5xl tracking-tight text-[var(--text-main)] leading-[1.05] outline-none" contentEditable suppressContentEditableWarning>
              Compactness in topological spaces
            </h1>
          </div>

          <div className="space-y-12 animate-in fade-in duration-150">
            <p className="prose-reading font-human outline-none" contentEditable suppressContentEditableWarning>
              This space maps the foundational structures of topological spaces. It bridges the intuitive notion of <span className="wiki-link font-bold" onMouseEnter={(e) => onLinkHover(e, 'compactness', 0)} onMouseLeave={() => onLinkLeave('compactness')}>closeness</span> without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.
            </p>
            <p className="prose-reading font-human outline-none" contentEditable suppressContentEditableWarning>
              A topological space is a set endowed with a structure, called a <em>topology</em>, which allows defining continuous deformation of subspaces. Generalizing the <span className="wiki-link font-bold" onMouseEnter={(e) => onLinkHover(e, 'heine-borel', 0)} onMouseLeave={() => onLinkLeave('heine-borel')}>Heine–Borel</span> theorem requires us to move beyond Euclidean constraints.
            </p>
            <p className="prose-reading font-human outline-none" contentEditable suppressContentEditableWarning>
              This brings us to <span className="wiki-link font-bold" onMouseEnter={(e) => onLinkHover(e, 'tychonoff', 0)} onMouseLeave={() => onLinkLeave('tychonoff')}>Tychonoff's Theorem</span>, which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.
            </p>
          </div>

          <EditorSidebar 
            isZenMode={isZenMode}
            activeTab={activeSidebarTab}
          />
        </div>
      </div>
    </main>
  );
}

function EditorSidebar({ isZenMode, activeTab }: { isZenMode: boolean; activeTab: 'context' | 'annotations' }) {
  return (
    <aside 
      id="editor-context-panel" 
      className={`absolute left-full top-0 ml-16 w-80 flex flex-col transition-all duration-500 ${
        isZenMode || activeTab === 'annotations' ? "opacity-0 pointer-events-none translate-x-12" : "opacity-100 translate-x-0"
      }`}
    >
      {activeTab === 'context' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <div className="font-sys text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3">Structure</div>
            <div className="font-mono text-[11px] space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-[var(--text-muted)] hover:text-black cursor-pointer group">
                <span className="group-hover:text-[var(--bh-red)] transition-colors">⊤</span> General Topology
              </div>
              <div className="flex items-center gap-2 text-black font-semibold ml-4">
                <span className="text-[var(--bh-red)] font-bold">·</span> Compact Space
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] ml-8 hover:text-black cursor-pointer group">
                <span className="group-hover:text-[var(--bh-blue)] transition-colors">⊢</span> Heine–Borel
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}