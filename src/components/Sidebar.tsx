import { memo } from "react";
import { ChevronRight, Search, Plus, Settings, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import type { SidebarProps } from "../types";

const btnReset = {
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  fontFamily: "inherit"
};

function SidebarComponent({ 
  isCollapsed, 
  onToggle, 
  openPage, 
  openCommandPalette, 
  setStatus, 
  onMouseEnter,
  onMouseLeave,
  activePage 
}: SidebarProps) {
  return (
    <>
      {/* 折叠唤起：悬浮在左上角 */}
      {isCollapsed && (
        <button 
          onClick={onToggle}
          className="fixed top-6 left-6 z-50 w-9 h-9 flex items-center justify-center glass-panel hover-ui shadow-sm transition-all duration-300 spring-click cursor-pointer border-none"
          title="Expand Sidebar"
        >
          <PanelLeftOpen className="w-4 h-4 text-neutral-500 hover:text-black" />
        </button>
      )}

      <aside 
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="sidebar glass-panel border-r border-black/5" 
        id="sidebar"
        style={{
          width: isCollapsed ? '0px' : 'var(--sidebar-width)',
          transform: isCollapsed ? 'translateX(-100%)' : 'translateX(0)',
          opacity: isCollapsed ? 0 : 1,
          pointerEvents: isCollapsed ? 'none' : 'auto',
          // ⚡ 【体验优化】：折叠/收起放慢至 0.5s，配合重阻尼 Expo 曲线，眼睛绝不眼花
          transition: 'width 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.4s ease',
          position: 'fixed',
          zIndex: activePage === "editor" ? 55 : 30
        }}
      >
        {/* 裁切内盒子 */}
        <div style={{ width: '240px', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>
          <div className="h-20 px-6 flex items-center justify-between shrink-0">
            <span className="logo-full font-sys text-base font-bold tracking-widest text-text-main">AXIOM</span>
            <span className="logo-full font-mono text-[9px] text-[var(--text-muted)] opacity-60">v0.8</span>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scroll-hide text-xs text-[var(--text-secondary)] font-medium">
            <div className="space-y-1">
              <button onClick={openCommandPalette} className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer">
                <Search className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1">Search & Run</span>
                <kbd className="font-mono text-[9px] opacity-0 group-hover:opacity-50 transition-opacity">⌘K</kbd>
              </button>
              <button onClick={() => setStatus("Creating new...")} className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer">
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1">New Node</span>
              </button>
            </div>

            <div>
              <div className="sidebar-label text-[9px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">Focus</div>
              <div className="space-y-1">
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group cursor-pointer" onClick={() => openPage("editor")}>
                  <span className="indicator-dot dot-red"></span>
                  <span className="nav-text flex-1">Today</span>
                  <ChevronRight className="w-3 h-3 action-icon" />
                </div>
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer" onClick={() => setStatus("Opening Recent…")}>
                  <span className="indicator-dot dot-blue opacity-30"></span>
                  <span className="nav-text flex-1">Recent Flow</span>
                </div>
              </div>
            </div>

            <div>
              <div className="sidebar-label text-[9px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">Spaces</div>
              <div className="space-y-1">
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group cursor-pointer" onClick={() => openPage("project")}>
                  <span className="indicator-dot dot-yellow"></span>
                  <span className="nav-text flex-1">Topology Math</span>
                  <ChevronRight className="w-3 h-3 action-icon" />
                </div>
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer" onClick={() => setStatus("Opening Personal Space…")}>
                  <span className="indicator-dot dot-green opacity-30"></span>
                  <span className="nav-text flex-1">System Design</span>
                </div>
              </div>
            </div>

            {/* 系统设置 */}
            <div>
              <div className="sidebar-label text-[9px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">System</div>
              <div className="space-y-1">
                <div className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer" onClick={() => setStatus("Opening Settings…")}>
                  <Settings className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                  <span className="nav-text flex-1">Settings</span>
                </div>
              </div>
            </div>
          </nav>
        </div>

        {/* 随动按钮挂载 */}
        <div className="absolute top-6 left-full ml-4 z-50">
          <button 
            onClick={onToggle}
            style={btnReset}
            className="w-9 h-9 flex items-center justify-center glass-panel hover-ui shadow-sm transition-all duration-300 spring-click cursor-pointer rounded-none"
            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isCollapsed ? <PanelLeftOpen className="w-4 h-4 text-neutral-500 hover:text-black" /> : <PanelLeftClose className="w-4 h-4 text-neutral-500 hover:text-black" />}
          </button>
        </div>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);