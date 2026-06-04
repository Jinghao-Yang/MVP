import { useState } from "react";

export function ProjectPage({ openPage }: { openPage: (p: string) => void }) {
  const [activeTab, setActiveTab] = useState("kanban");

  return (
    <div className="page-panel flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 flex items-center justify-between px-8 shrink-0 z-10 bg-transparent">
        <div className="flex items-center gap-4">
          <div className="font-sys text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] flex items-center gap-2">
            <span>Space</span>
            <span className="font-serif italic text-sm opacity-50">/</span>
            <span className="text-[var(--text-main)] font-semibold">Topology Math</span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/30 backdrop-blur-md border border-black/5">
          <button 
            onClick={() => setActiveTab("changelog")} 
            className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border-none cursor-pointer ${activeTab === 'changelog' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Changelog
          </button>
          <button 
            onClick={() => setActiveTab("timeline")} 
            className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border-none cursor-pointer ${activeTab === 'timeline' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Gantt
          </button>
          <button 
            onClick={() => setActiveTab("kanban")} 
             className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border-none cursor-pointer ${activeTab === 'kanban' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Pipeline
          </button>
          <button 
            onClick={() => setActiveTab("gallery")} 
             className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border-none cursor-pointer ${activeTab === 'gallery' ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
          >
            Gallery
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 scroll-hide">
        <div className="max-w-6xl mx-auto space-y-12">

          {/* Changelog 视图 */}
          {activeTab === 'changelog' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Conceptual Changelog</h2>
                <p className="text-[var(--text-muted)] font-sys text-sm mt-2">A sequence of breakthroughs and axiomatic updates.</p>
              </div>
              <div className="glass-panel p-8 relative rounded-none border border-white/50 mt-8 overflow-hidden">
                <div className="absolute top-[48px] left-8 right-8 h-[1px] bg-black/10"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
                    <div className="absolute top-[-3px] left-0 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 border border-black bg-[var(--bg-canvas)] group-hover:bg-black transition-colors duration-[1000ms]"></div>
                      <div className="w-[1px] h-6 bg-black/20"></div>
                    </div>
                    <div className="font-mono text-[10px] text-neutral-400">APR 05</div>
                    <div className="brutal-card p-5 border border-white">
                      <span className="tag-badge tag-badge-yellow mb-2">Stage I</span>
                      <h4 className="font-human text-lg font-bold mb-1">Conjecture</h4>
                      <p className="font-sys text-xs text-neutral-600 leading-relaxed">Formulated the first draft of compactness equivalence in metric environments.</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
                    <div className="absolute top-[-3px] left-0 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 border-2 border-black bg-[var(--bg-canvas)] group-hover:bg-black transition-colors duration-[1000ms]"></div>
                      <div className="w-[1px] h-6 bg-black/20"></div>
                    </div>
                    <div className="font-mono text-[10px] text-neutral-400">MAY 17</div>
                    <div className="brutal-card p-5 border border-white">
                      <span className="tag-badge tag-badge-blue mb-2">Stage II</span>
                      <h4 className="font-human text-lg font-bold mb-1">Contradiction</h4>
                      <p className="font-sys text-xs text-neutral-600 leading-relaxed">Discovered a critical counterexample regarding non-Hausdorff infinite products.</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
                    <div className="absolute top-[-3px] left-0 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 bg-[var(--bh-red)] border border-white shadow-sm"></div>
                      <div className="w-[1px] h-6 bg-[var(--bh-red)]"></div>
                    </div>
                    <div className="font-mono text-[10px] text-[var(--bh-red)] font-bold">JUN 03</div>
                    <div className="brutal-card p-5 bg-white border-t-2 border-t-[var(--bh-red)]">
                      <span className="tag-badge tag-badge-red mb-2">Current</span>
                      <h4 className="font-human text-lg font-bold mb-1">Axiomatic Pivot</h4>
                      <p className="font-sys text-xs text-black leading-relaxed">Restricted the domain using ZFC axioms. Proof is now fully self-consistent.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gantt Timeline 视图 */}
          {activeTab === 'timeline' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Lines of Research</h2>
                <p className="text-[var(--text-muted)] font-sys text-sm mt-2">Gantt tracks of active research directions and papers.</p>
              </div>
              <div className="glass-panel p-6 rounded-none border border-white/50 overflow-x-auto">
                <div className="grid grid-cols-6 text-[10px] font-mono text-neutral-400 border-b border-black/10 pb-3 mb-6 tracking-widest uppercase">
                  <div>APR 05</div><div>APR 19</div><div>MAY 03</div><div>MAY 17</div><div>JUN 07</div><div>JUN 21</div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 items-center gap-4">
                    <div className="col-span-2 font-bold text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full dot-blue"></span> Topology Foundations</div>
                    <div className="col-span-3 col-start-3 brutal-card p-3 flex justify-between border border-white">
                      <span className="text-[10px] font-mono uppercase text-gray-500">Axiomatic Setup</span>
                      <span className="text-[10px] text-[var(--bh-red)] font-bold">◆ Public Beta</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 items-center gap-4">
                    <div className="col-span-2 font-bold text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full dot-green"></span> Heine–Borel Ext.</div>
                    <div className="col-span-2 col-start-4 brutal-card p-3 flex justify-between border border-white">
                      <span className="text-[10px] font-mono uppercase text-gray-500">Euclidean Map</span>
                      <span className="text-[10px] text-[var(--bh-green)] font-bold">◇ Unify</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline 看板 视图：应用 kanban-column 与 kanban-card 进行高频 180ms 极速响应，干练清爽 */}
          {activeTab === 'kanban' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Zettelkasten Pipeline</h2>
                <p className="text-[var(--text-muted)] font-sys text-sm mt-2">Visually manage notes through stages of conceptual confidence.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="stage-column kanban-column">
                  <div className="column-header"><span className="indicator-dot dot-yellow"></span> 1. Fleeting</div>
                  <div className="brutal-card p-4 mb-3 kanban-card" draggable>Heine–Borel origins</div>
                  <div className="brutal-card p-4 mb-3 kanban-card" draggable>Non-Hausdorff products</div>
                </div>
                <div className="stage-column kanban-column">
                  <div className="column-header"><span className="indicator-dot dot-blue"></span> 2. Seedling</div>
                  <div className="brutal-card p-4 mb-3 kanban-card" draggable>Compactness ↔ sequential</div>
                </div>
                <div className="stage-column kanban-column">
                  <div className="column-header"><span className="indicator-dot dot-red"></span> 3. Evergreen</div>
                  <div className="brutal-card p-4 mb-3 kanban-card" draggable>Lemma 2.4: finite subcover</div>
                </div>
                <div className="stage-column kanban-column">
                  <div className="column-header"><span className="indicator-dot dot-green"></span> 4. Synthesis</div>
                  <div className="brutal-card p-4 mb-3 opacity-50 kanban-card" draggable>Drop here to output</div>
                </div>
              </div>
            </div>
          )}

          {/* Gallery 知识库 视图 */}
          {activeTab === 'gallery' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Knowledge Base</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
                <div onClick={() => openPage("editor")} className="brutal-card card-theorem p-6 flex flex-col justify-between group rounded-none">
                  <div className="flex items-center justify-between pb-3 mb-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-blue)] font-bold">Zettelkasten</span>
                    <span className="tag-badge tag-badge-blue">Active</span>
                  </div>
                  <div className="py-2">
                    <h3 className="font-sys text-xl font-bold leading-snug group-hover:text-[var(--bh-blue)] transition-colors mb-2">Compactness in Spaces</h3>
                    <p className="font-sys text-xs text-neutral-500 leading-relaxed line-clamp-3">
                      A space is compact if every open cover has a finite subcover...
                    </p>
                  </div>
                </div>
                
                <div className="brutal-card col-span-1 md:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden rounded-none">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--bh-yellow)] opacity-10 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--bh-yellow)] font-bold">Thought</span>
                  </div>
                  <p className="font-human text-2xl text-neutral-800 italic leading-relaxed my-4 relative z-10">
                    "Productivity is not about getting more things done. It is about having a quiet room to think."
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}