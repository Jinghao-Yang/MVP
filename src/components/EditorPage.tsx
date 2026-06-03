import { Eye, Maximize2, GitMerge, ArrowRight, Zap } from "lucide-react";

interface EditorPageProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  openPage: (page: string) => void;
  setStatus: (status: string) => void;
}

export function EditorPage({ isZenMode, onToggleZen, openPage, setStatus }: EditorPageProps) {
  return (
    <div className="page-panel flex-1 flex h-full overflow-hidden relative">
      <main className="flex-1 flex flex-col h-full overflow-y-auto scroll-hide">
        <header className="h-20 flex items-center justify-between px-12 z-10 shrink-0 sticky top-0 bg-gradient-to-b from-[var(--bg-canvas)] to-transparent">
          <div className="font-sys text-[11px] uppercase tracking-[0.12em] text-[var(--text-muted)] flex items-center gap-3">
            <span className="hover:text-[var(--text-main)] cursor-pointer transition-colors" onClick={() => openPage('project')}>Topology Math</span>
            <span className="font-serif italic text-sm opacity-50">/</span>
            <span className="text-[var(--text-main)] font-semibold font-sys">Focus Mode</span>
          </div>
          <button onClick={onToggleZen} className="hover-ui px-3 py-1.5 text-[10px] font-bold text-black flex items-center gap-1.5">
            <Eye className="w-3 h-3" />
            <span>{isZenMode ? "Exit Zen" : "Zen Toggle"}</span>
          </button>
        </header>

        <div className="px-12 pt-16 pb-64 flex justify-start lg:justify-center">
          <div className="w-full max-w-[640px] pr-[10%] lg:pr-0">
            <div className="mb-12 relative group">
              <span className="font-sys text-[10px] uppercase tracking-widest text-[var(--bh-red)] block mb-4">Document // 01</span>
              <h1 className="font-human text-6xl tracking-tight text-[var(--text-main)] leading-[1.05] outline-none" contentEditable suppressContentEditableWarning>
                Compactness in topological spaces
              </h1>
            </div>

            <div className="prose-reading font-human outline-none" contentEditable suppressContentEditableWarning>
              <p>
                This space maps the foundational structures of topological spaces. It bridges the intuitive notion of <em>closeness</em> without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.
              </p>
              <p>
                A topological space is a set endowed with a structure, called a <em>topology</em>, which allows defining continuous deformation of subspaces. Generalizing the 
                <span className="wiki-link">[[Heine–Borel]]</span> theorem requires us to move beyond Euclidean constraints.
              </p>
              <p>
                This brings us to 
                <span className="wiki-link">[[Tychonoff's Theorem]]</span>, which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.
              </p>
              <p>
                <em>Scroll down to see the text flow elegantly beneath the Z-Axis frosted glass context panel...</em><br/><br/><br/><br/><br/><br/>
                More thoughts...<br/><br/><br/><br/><br/><br/>
                Even more depth...
              </p>
            </div>
          </div>
        </div>
      </main>

      <aside id="editor-context-panel" className="glass-panel-deep">
        <div className="h-16 px-6 flex items-center justify-between shrink-0">
          <span className="font-sys text-[10px] uppercase tracking-[0.15em] text-[var(--text-muted)]">Context Panel</span>
        </div>

        <div className="flex-1 px-6 py-4 overflow-y-auto space-y-10 scroll-hide relative z-10">
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
            <div className="h-32 bg-white/20 border border-white/40 relative overflow-hidden group">
              <svg className="absolute inset-0 w-full h-full opacity-40" stroke="currentColor" strokeWidth="1">
                <line x1="150" y1="60" x2="80" y2="30" />
                <line x1="150" y1="60" x2="220" y2="30" />
              </svg>
              <div className="absolute top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click" onClick={() => setStatus('Focus: Compact Space')}>
                <div className="w-4 h-4 bg-[var(--bh-red)] border border-white shadow-sm"></div>
              </div>
              <div className="absolute top-[15%] left-[20%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click">
                <div className="w-3 h-3 bg-[var(--bh-blue)] border border-white opacity-60 hover:opacity-100"></div>
              </div>
              <div className="absolute top-[15%] right-[20%] transform -translate-x-1/2 -translate-y-1/2 cursor-pointer spring-click">
                <div className="w-3 h-3 bg-[var(--bh-yellow)] border border-white opacity-60 hover:opacity-100"></div>
              </div>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3 h-3 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>

          <div>
            <ul className="space-y-1 font-sys text-xs text-[var(--text-secondary)]">
              <li className="spring-click flex justify-between items-center p-2 hover-ui group" onClick={() => setStatus('Tracing origin…')}>
                <span className="flex items-center gap-2"><GitMerge className="w-3 h-3 opacity-50" /> Trace Origin</span>
                <ArrowRight className="w-3 h-3 action-icon text-[var(--bh-red)]" />
              </li>
              <li className="spring-click flex justify-between items-center p-2 hover-ui group" onClick={() => setStatus('Finding counterexamples…')}>
                <span className="flex items-center gap-2"><Zap className="w-3 h-3 opacity-50" /> Find Paradox</span>
                <ArrowRight className="w-3 h-3 action-icon text-[var(--bh-blue)]" />
              </li>
            </ul>
          </div>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white/40 to-transparent pointer-events-none"></div>
      </aside>
    </div>
  );
}
