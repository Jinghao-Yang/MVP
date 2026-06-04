import { memo } from 'react';
import { ChevronRight, Search, Plus, Settings } from 'lucide-react';
import type { SidebarProps } from '../types';

function SidebarComponent({ 
  isCollapsed, 
  openPage, 
  openCommandPalette, 
  setStatus, 
  onMouseEnter,
  onMouseLeave,
  activePage 
}: Omit<SidebarProps, 'onToggle'>) {
  
  const isZenActive = document.body.classList.contains('zen-active');

  return (
    <>
      {/* Edge trigger zone for sidebar expansion */}
      {!isZenActive && (
        <div 
          onMouseEnter={onMouseEnter}
          className="fixed top-0 left-0 bottom-0 w-3 z-[99] bg-transparent cursor-e-resize"
        />
      )}

      <aside 
        onMouseEnter={isZenActive ? undefined : onMouseEnter}
        onMouseLeave={isZenActive ? undefined : onMouseLeave}
        className="sidebar glass-panel" 
        id="sidebar"
        style={{
          width: (isCollapsed || isZenActive) ? '0px' : 'var(--sidebar-width)',
          transform: (isCollapsed || isZenActive) ? 'translateX(-100%)' : 'translateX(0)',
          opacity: (isCollapsed || isZenActive) ? 0 : 1,
          pointerEvents: (isCollapsed || isZenActive) ? 'none' : 'auto',
          transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1), transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease',
          position: 'fixed',
          zIndex: 110,
          boxShadow: (isCollapsed || isZenActive) ? 'none' : '24px 0px 80px -12px rgba(28, 28, 26, 0.08)'
        }}
      >
        <div style={{ width: '240px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div className="h-20 px-6 flex items-center justify-between shrink-0">
            <span className="logo-full font-sys text-base font-bold tracking-widest text-[var(--text-main)]">AXIOM</span>
            <span className="logo-full font-mono text-[11px] text-[var(--text-muted)] opacity-60">v0.8</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scroll-hide text-xs text-[var(--text-secondary)] font-medium">
            <div className="space-y-1">
              <button onClick={openCommandPalette} className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent">
                <Search className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1 text-xs">Search & Run</span>
                <kbd className="font-mono text-[11px] opacity-0 group-hover:opacity-50 transition-opacity">⌘K</kbd>
              </button>
              <button onClick={() => setStatus("Creating new...")} className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent">
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1 text-xs">New Node</span>
              </button>
            </div>

            <div>
              <div className="sidebar-label text-[11px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">Focus</div>
              <div className="space-y-1">
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group cursor-pointer" onClick={() => openPage("editor")}>
                  <span className="indicator-dot dot-red"></span>
                  <span className="nav-text flex-1">Today</span>
                  <ChevronRight className="w-3.5 h-3.5 action-icon" />
                </div>
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer" onClick={() => setStatus("Opening Recent…")}>
                  <span className="indicator-dot dot-blue opacity-30"></span>
                  <span className="nav-text flex-1">Recent Flow</span>
                </div>
              </div>
            </div>

            <div>
              <div className="sidebar-label text-[11px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">Spaces</div>
              <div className="space-y-1">
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group cursor-pointer" onClick={() => openPage("project")}>
                  <span className="indicator-dot dot-yellow"></span>
                  <span className="nav-text flex-1">Topology Math</span>
                  <ChevronRight className="w-3.5 h-3.5 action-icon" />
                </div>
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer" onClick={() => setStatus("Opening Personal Space…")}>
                  <span className="indicator-dot dot-green opacity-30"></span>
                  <span className="nav-text flex-1">System Design</span>
                </div>
              </div>
            </div>

            <div>
              <div className="sidebar-label text-[11px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">System</div>
              <div className="space-y-1">
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer" onClick={() => setStatus("Opening Settings…")}>
                  <Settings className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                  <span className="nav-text flex-1">Settings</span>
                </div>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);