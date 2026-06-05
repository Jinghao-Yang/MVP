export function TimelineView() {
  return (
    <div className="page-panel space-y-8 pane-active">
      <div>
        <h2 className="font-human text-4xl font-normal tracking-tight">Lines of Research</h2>
        <p className="text-[var(--text-muted)] font-sys text-sm mt-2">
          Gantt tracks of active research directions and papers.
        </p>
      </div>
      <div className="glass-panel p-6 rounded-none border border-white/50 overflow-x-auto">
        <div className="grid grid-cols-6 text-[11px] font-mono text-neutral-400 border-b border-black/10 pb-3 mb-6 tracking-widest uppercase min-w-[600px]">
          <div>APR 05</div>
          <div>APR 19</div>
          <div>MAY 03</div>
          <div>MAY 17</div>
          <div>JUN 07</div>
          <div>JUN 21</div>
        </div>
        <div className="space-y-4 min-w-[600px]">
          <div className="grid grid-cols-6 items-center gap-4 gantt-item">
            <div className="col-span-2 font-bold text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full dot-blue"></span> Topology Foundations
            </div>
            <div className="col-span-3 col-start-3 brutal-card p-3 flex justify-between border border-white">
              <span className="text-[11px] font-mono uppercase text-gray-500">Axiomatic Setup</span>
              <span className="text-[11px] text-bh-red font-bold">◆ Public Beta</span>
            </div>
          </div>
          <div className="grid grid-cols-6 items-center gap-4 gantt-item">
            <div className="col-span-2 font-bold text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full dot-green"></span> Heine–Borel Ext.
            </div>
            <div className="col-span-2 col-start-4 brutal-card p-3 flex justify-between border border-white">
              <span className="text-[11px] font-mono uppercase text-gray-500">Euclidean Map</span>
              <span className="text-[11px] text-bh-green font-bold">◇ Unify</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
