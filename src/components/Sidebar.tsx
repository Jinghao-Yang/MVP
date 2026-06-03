import { ChevronRight, Search, Plus } from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  openPage: (page: string) => void;
  openCommandPalette: () => void;
  setStatus: (status: string) => void;
}

export function Sidebar({ isCollapsed, onToggle, openPage, openCommandPalette, setStatus }: SidebarProps) {
  return (
    <aside className={`sidebar glass-panel ${isCollapsed ? "collapsed" : ""}`} id="sidebar">
      <div className="h-20 px-6 flex items-center justify-between shrink-0 relative group">
        <span className="logo-full font-sys text-base font-bold tracking-widest text-text-main">AXIOM</span>
        <span className="logo-single font-sys text-base font-bold tracking-widest text-text-main absolute">A</span>
        <span className="logo-full font-mono text-[9px] text-[var(--text-muted)] opacity-60 transition-opacity">v0.8</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scroll-hide text-xs text-[var(--text-secondary)] font-medium">
        <div className="space-y-1">
          <button onClick={openCommandPalette} className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group">
            <Search className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
            <span className="nav-text flex-1">Search & Run</span>
            <kbd className="font-mono text-[9px] opacity-0 group-hover:opacity-50 transition-opacity">⌘K</kbd>
          </button>
          <button onClick={() => setStatus("Creating new...")} className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group">
            <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
            <span className="nav-text flex-1">New Node</span>
          </button>
        </div>

        <div>
          <div className="sidebar-label text-[9px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">Focus</div>
          <div className="space-y-1">
            <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group" onClick={() => openPage("editor")}>
              <span className="indicator-dot dot-red"></span>
              <span className="nav-text flex-1">Today</span>
              <ChevronRight className="w-3 h-3 action-icon" />
            </div>
            <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group" onClick={() => setStatus("Opening Recent…")}>
              <span className="indicator-dot dot-blue opacity-30"></span>
              <span className="nav-text flex-1">Recent Flow</span>
            </div>
          </div>
        </div>

        <div>
          <div className="sidebar-label text-[9px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">Spaces</div>
          <div className="space-y-1">
            <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group" onClick={() => openPage("project")}>
              <span className="indicator-dot dot-yellow"></span>
              <span className="nav-text flex-1">Topology Math</span>
              <ChevronRight className="w-3 h-3 action-icon" />
            </div>
            <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group" onClick={() => setStatus("Opening Personal Space…")}>
              <span className="indicator-dot dot-green opacity-30"></span>
              <span className="nav-text flex-1">System Design</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="absolute bottom-4 right-4 opacity-0 hover:opacity-100 transition-opacity duration-300">
        <button className="w-8 h-8 flex items-center justify-center hover-ui bg-white/50 backdrop-blur" onClick={onToggle} title="Toggle sidebar">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
