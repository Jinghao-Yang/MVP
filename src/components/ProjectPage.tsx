import { useState } from 'react';

export function ProjectPage({ openPage }: { openPage: (p: string) => void }) {
  const [activeTab, setActiveTab] = useState('kanban');

  return (
    <div className="page-panel flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="font-sys text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] flex items-center gap-2">
            <span>Space</span>
            <span className="font-serif italic text-sm opacity-50">/</span>
            <span className="text-[var(--text-main)] font-semibold">Topology Math</span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/30 backdrop-blur-md">
          <button
            onClick={() => setActiveTab('timeline')}
            className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${activeTab === 'timeline' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Gantt
          </button>
          <button
            onClick={() => setActiveTab('kanban')}
            className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${activeTab === 'kanban' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Pipeline
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${activeTab === 'gallery' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Gallery
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scroll-hide">
        <div className="max-w-6xl mx-auto space-y-12">
          {activeTab === 'kanban' && (
            <div className="page-panel space-y-8 animate-fade-in">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">
                  Zettelkasten Pipeline
                </h2>
                <p className="text-[var(--text-muted)] font-sys text-sm mt-2">
                  Visually manage notes through stages of conceptual confidence.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stage-column">
                  <div className="column-header">
                    <span className="indicator-dot dot-yellow"></span> 1. Fleeting
                  </div>
                  <div className="brutal-card p-4 mb-3" draggable>
                    Heine–Borel origins
                  </div>
                  <div className="brutal-card p-4 mb-3" draggable>
                    Non-Hausdorff products
                  </div>
                </div>
                <div className="stage-column">
                  <div className="column-header">
                    <span className="indicator-dot dot-blue"></span> 2. Seedling
                  </div>
                  <div className="brutal-card p-4 mb-3" draggable>
                    Compactness ↔ sequential
                  </div>
                </div>
                <div className="stage-column">
                  <div className="column-header">
                    <span className="indicator-dot dot-red"></span> 3. Evergreen
                  </div>
                  <div className="brutal-card p-4 mb-3" draggable>
                    Lemma 2.4: finite subcover
                  </div>
                </div>
                <div className="stage-column">
                  <div className="column-header">
                    <span className="indicator-dot dot-green"></span> 4. Synthesis
                  </div>
                  <div className="brutal-card p-4 mb-3 opacity-50" draggable>
                    Drop here to output
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="page-panel space-y-8 animate-fade-in">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Knowledge Base</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
                <div
                  onClick={() => openPage('editor')}
                  className="brutal-card card-theorem p-6 flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between pb-3 mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-blue)] font-bold">
                      Zettelkasten
                    </span>
                    <span className="tag-badge tag-badge-blue">Active</span>
                  </div>
                  <div className="py-2">
                    <h3 className="font-sys text-xl font-bold leading-snug group-hover:text-[var(--bh-blue)] transition-colors mb-2">
                      Compactness in Spaces
                    </h3>
                    <p className="font-sys text-xs text-neutral-500 leading-relaxed line-clamp-3">
                      A space is compact if every open cover has a finite subcover...
                    </p>
                  </div>
                </div>

                <div className="brutal-card col-span-1 md:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--bh-yellow)] opacity-10 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-yellow)] font-bold">
                      Thought
                    </span>
                  </div>
                  <p className="font-human text-2xl text-neutral-800 italic leading-relaxed my-4 relative z-10">
                    "Productivity is not about getting more things done. It is about having a quiet
                    room to think."
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="page-panel space-y-8 animate-fade-in">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Timeline</h2>
              </div>
              <div className="text-neutral-400 font-mono text-sm">
                (Gantt visualization rendering...)
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
