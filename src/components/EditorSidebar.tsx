import { Maximize2, GitMerge, ArrowRight, Zap } from 'lucide-react';
import type { EditorSidebarProps } from '../types';

export function EditorSidebar({ isZenMode, activeTab, onTabChange, setStatus }: EditorSidebarProps) {
  return (
    <aside 
      id="editor-context-panel" 
      className={`absolute left-full top-0 ml-16 w-80 flex flex-col transition-all duration-500 ${
        isZenMode || activeTab === 'annotations' ? "opacity-0 pointer-events-none translate-x-12" : "opacity-100 translate-x-0"
      }`}
    >
      {activeTab === 'context' ? (
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

          <div>
            <div className="font-sys text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3">Local Graph</div>
            <div className="h-40 bg-white/20 border border-white/40 relative overflow-hidden group">
              <svg className="absolute inset-0 w-full h-full opacity-40" stroke="currentColor" strokeWidth="1">
                <line x1="180" y1="80" x2="100" y2="40" />
                <line x1="180" y1="80" x2="260" y2="40" />
                <line x1="180" y1="80" x2="180" y2="135" />
              </svg>
              <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click" onClick={() => setStatus('Focus: Compact Space')}>
                <div className="w-5 h-5 bg-[var(--bh-red)] border-2 border-white shadow-sm"></div>
              </div>
              <div className="absolute top-[20%] left-[25%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click">
                <div className="w-3.5 h-3.5 bg-[var(--bh-blue)] border border-white opacity-75 hover:opacity-100"></div>
              </div>
              <div className="absolute top-[20%] right-[25%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click">
                <div className="w-3.5 h-3.5 bg-[var(--bh-yellow)] border border-white opacity-75 hover:opacity-100"></div>
              </div>
              <div className="absolute bottom-4 left-[50%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click">
                <div className="w-3.5 h-3.5 bg-[var(--bh-green)] border border-white opacity-75 hover:opacity-100"></div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>

          <div>
            <ul className="space-y-1 font-sys text-xs text-[var(--text-secondary)]">
              <li className="spring-click flex justify-between items-center p-2 hover-ui group cursor-pointer rounded-none" onClick={() => setStatus('Tracing origin…')}>
                <span className="flex items-center gap-2"><GitMerge className="w-3.5 h-3.5 opacity-50" /> Trace Origin</span>
                <ArrowRight className="w-3 h-3 action-icon text-[var(--bh-red)]" />
              </li>
              <li className="spring-click flex justify-between items-center p-2 hover-ui group cursor-pointer rounded-none" onClick={() => setStatus('Finding counterexamples…')}>
                <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 opacity-50" /> Find Paradox</span>
                <ArrowRight className="w-3 h-3 action-icon text-[var(--bh-blue)]" />
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-[tab-pane-fade_0.25s_ease-out] font-sys">
          <div className="space-y-2">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-red)] font-bold">Ref. ¶ 1.1 / Line 3</div>
            <p className="prose-reading font-human italic leading-relaxed">"bridges the intuitive notion of closeness..."</p>
            <p className="prose-reading font-human text-neutral-500 leading-relaxed">Note: Closeness is modeled strictly via topology neighborhoods, distinct from metric distance bounds.</p>
          </div>
          <div className="w-full h-px bg-neutral-200/50"></div>
          <div className="space-y-2">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-blue)] font-bold">Ref. ¶ 1.2 / Heine–Borel</div>
            <p className="prose-reading font-human italic leading-relaxed">"Generalizing the Heine–Borel theorem..."</p>
            <p className="prose-reading font-human text-neutral-500 leading-relaxed">Closed and bounded in general topological vector spaces fails to imply compactness without metric completeness.</p>
          </div>
          <div className="w-full h-px bg-neutral-200/50"></div>
          <div className="space-y-2">
            <div className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-green)] font-bold">Ref. ¶ 1.3 / Tychonoff</div>
            <p className="prose-reading font-human italic leading-relaxed">"Tychonoff's Theorem... Axiom of Choice"</p>
            <p className="prose-reading font-human text-neutral-500 leading-relaxed">Kelley (1950) proved that Tychonoff's theorem actually implies the Axiom of Choice in standard ZF set theory.</p>
          </div>
        </div>
      )}
    </aside>
  );
}