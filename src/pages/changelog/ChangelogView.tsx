export function ChangelogView() {
  return (
    <div className="page-panel space-y-8 pane-active">
      <div>
        <h2 className="font-human text-4xl font-normal tracking-tight">Conceptual Changelog</h2>
        <p className="text-[var(--text-muted)] font-sys text-sm mt-2">
          A sequence of breakthroughs and axiomatic updates.
        </p>
      </div>
      <div className="glass-panel p-8 relative rounded-none border border-white/50 mt-8 overflow-hidden">
        <div className="absolute top-[48px] left-8 right-8 h-[1px] bg-black/10"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
            <div className="absolute top-[-3px] left-0 flex flex-col items-center">
              <div className="w-2.5 h-2.5 border border-black bg-[var(--bg-canvas)] group-hover:bg-black transition-colors duration-[800ms]"></div>
              <div className="w-[1px] h-6 bg-black/20"></div>
            </div>
            <div className="font-mono text-[11px] text-neutral-400">APR 05</div>
            <div className="brutal-card p-5 border border-white">
              <span className="tag-badge tag-badge-yellow mb-2">Stage I</span>
              <h4 className="font-human text-lg font-bold mb-1">Conjecture</h4>
              <p className="font-sys text-xs text-neutral-600 leading-relaxed">
                Formulated the first draft of compactness equivalence in metric environments.
              </p>
            </div>
          </div>
          <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
            <div className="absolute top-[-3px] left-0 flex flex-col items-center">
              <div className="w-2.5 h-2.5 border-2 border-black bg-[var(--bg-canvas)] group-hover:bg-black transition-colors duration-[800ms]"></div>
              <div className="w-[1px] h-6 bg-black/20"></div>
            </div>
            <div className="font-mono text-[11px] text-neutral-400">MAY 17</div>
            <div className="brutal-card p-5 border border-white">
              <span className="tag-badge tag-badge-blue mb-2">Stage II</span>
              <h4 className="font-human text-lg font-bold mb-1">Contradiction</h4>
              <p className="font-sys text-xs text-neutral-600 leading-relaxed">
                Discovered a critical counterexample regarding non-Hausdorff infinite products.
              </p>
            </div>
          </div>
          <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
            <div className="absolute top-[-3px] left-0 flex flex-col items-center">
              <div className="w-2.5 h-2.5 bg-[var(--bh-red)] border border-white shadow-sm"></div>
              <div className="w-[1px] h-6 bg-[var(--bh-red)]"></div>
            </div>
            <div className="font-mono text-[11px] text-[var(--bh-red)] font-bold">JUN 03</div>
            <div className="brutal-card p-5 bg-white border-t-2 border-t-[var(--bh-red)]">
              <span className="tag-badge tag-badge-red mb-2">Current</span>
              <h4 className="font-human text-lg font-bold mb-1">Axiomatic Pivot</h4>
              <p className="font-sys text-xs text-black leading-relaxed">
                Restricted the domain using ZFC axioms. Proof is now fully self-consistent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
