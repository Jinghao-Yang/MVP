interface GalleryViewProps {
  openPage: (p: string) => void;
}

export function GalleryView({ openPage }: GalleryViewProps) {
  return (
    <div className="page-panel space-y-8 pane-active">
      <div>
        <h2 className="font-human text-4xl font-normal tracking-tight">Knowledge Base</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
        <div
          onClick={() => openPage('editor')}
          className="brutal-card card-theorem p-6 flex flex-col justify-between group rounded-none"
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--bh-blue)] font-bold">
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

        <div className="brutal-card col-span-1 md:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden rounded-none">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--bh-yellow)] opacity-10 rounded-full blur-2xl"></div>
          <div className="flex items-center justify-between pb-3">
            <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--bh-yellow)] font-bold">
              Thought
            </span>
          </div>
          <p className="font-human text-2xl text-neutral-800 italic leading-relaxed my-4 relative z-10">
            "Productivity is not about getting more things done. It is about having a quiet room to
            think."
          </p>
        </div>
      </div>
    </div>
  );
}
