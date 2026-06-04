/* ================================================
   FILE: src/layout/Sidebar.tsx
   ================================================ */
import { memo, useState, useRef, useEffect } from 'react';
import { ChevronRight, Search, Plus, Settings, Pin, PinOff } from 'lucide-react';
import type { SidebarProps } from '@/types';
import { useAppStore } from '@/store/useAppStore';

function SidebarComponent({
  isCollapsed,
  openPage,
  openCommandPalette,
  setStatus,
}: Omit<SidebarProps, 'onToggle' | 'activePage' | 'onMouseEnter' | 'onMouseLeave'>) {
  const isZenMode = useAppStore((state) => state.isZenMode);
  const isSidebarPinned = useAppStore((state) => state.isSidebarPinned);
  const toggleSidebarPin = useAppStore((state) => state.toggleSidebarPin);
  const [localHover, setLocalHover] = useState(false);
  const closeTimer = useRef<NodeJS.Timeout | null>(null);
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

  // 是否真正展开（固定模式下忽略 isCollapsed 和 hover）
  const isExpanded = isSidebarPinned || (!isCollapsed && localHover);

  // 清除关闭计时器
  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // 鼠标进入侧边栏或感应区 -> 立即展开（如果未固定且未 Zen）
  const handleExpand = () => {
    if (isSidebarPinned || isZenMode || isTouch) return;
    clearCloseTimer();
    setLocalHover(true);
  };

  // 鼠标离开侧边栏 -> 延迟关闭
  const handleCollapse = () => {
    if (isSidebarPinned || isZenMode || isTouch) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setLocalHover(false);
    }, 300);
  };

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <>
      {/* 边缘感应区（触摸屏不渲染） */}
      {!isTouch && !isSidebarPinned && !isZenMode && (
        <div
          onMouseEnter={handleExpand}
          className="fixed top-0 left-0 bottom-0 w-6 z-50 group transition-all duration-200"
        >
          {/* 视觉反馈：默认显示极细的渐变高亮条，鼠标靠近时扩展到全宽 */}
          <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-r from-white/40 to-transparent group-hover:w-6 group-hover:from-white/50 transition-all duration-300 ease-out" />
        </div>
      )}

      <aside
        onMouseEnter={handleExpand}
        onMouseLeave={handleCollapse}
        className="sidebar glass-panel"
        id="sidebar"
        style={{
          width: isExpanded ? 'var(--sidebar-width)' : '0px',
          transform: isExpanded ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition:
            'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.2s ease',
          position: 'fixed',
          zIndex: 110,
          boxShadow: isExpanded ? '24px 0px 80px -12px rgba(28, 28, 26, 0.08)' : 'none',
        }}
      >
        <div
          style={{
            width: '240px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            flexShrink: 0,
          }}
        >
          <div className="h-20 px-6 flex items-center justify-between shrink-0">
            <span className="logo-full font-sys text-base font-bold tracking-widest text-[var(--text-main)]">
              AXIOM
            </span>
            <span className="logo-full font-mono text-[11px] text-[var(--text-muted)] opacity-60">
              v0.8
            </span>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-8 scroll-hide text-xs text-[var(--text-secondary)] font-medium">
            <div className="space-y-1">
              <button
                onClick={openCommandPalette}
                className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent"
              >
                <Search className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1 text-xs">Search & Run</span>
                <kbd className="font-mono text-[11px] opacity-0 group-hover:opacity-50 transition-opacity">
                  ⌘K
                </kbd>
              </button>
              <button
                onClick={() => setStatus('Creating new...')}
                className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent"
              >
                <Plus className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1 text-xs">New Node</span>
              </button>
            </div>

            <div>
              <div className="sidebar-label text-[11px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">
                Focus
              </div>
              <div className="space-y-1">
                <div
                  className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group cursor-pointer"
                  onClick={() => openPage('editor')}
                >
                  <span className="indicator-dot dot-red"></span>
                  <span className="nav-text flex-1">Today</span>
                  <ChevronRight className="w-3.5 h-3.5 action-icon" />
                </div>
                <div
                  className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer"
                  onClick={() => setStatus('Opening Recent…')}
                >
                  <span className="indicator-dot dot-blue opacity-30"></span>
                  <span className="nav-text flex-1">Recent Flow</span>
                </div>
              </div>
            </div>

            <div>
              <div className="sidebar-label text-[11px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">
                Spaces
              </div>
              <div className="space-y-1">
                <div
                  className="spring-click hover-ui px-3 py-2 flex items-center gap-3 text-[var(--text-main)] font-semibold group cursor-pointer"
                  onClick={() => openPage('project')}
                >
                  <span className="indicator-dot dot-yellow"></span>
                  <span className="nav-text flex-1">Topology Math</span>
                  <ChevronRight className="w-3.5 h-3.5 action-icon" />
                </div>
                <div
                  className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer"
                  onClick={() => setStatus('Opening Personal Space…')}
                >
                  <span className="indicator-dot dot-green opacity-30"></span>
                  <span className="nav-text flex-1">System Design</span>
                </div>
              </div>
            </div>

            <div>
              <div className="sidebar-label text-[11px] uppercase tracking-widest text-[var(--text-muted)] opacity-50 mb-3 px-3">
                System
              </div>
              <div className="space-y-1">
                <div
                  className="spring-click hover-ui px-3 py-2 flex items-center gap-3 group cursor-pointer"
                  onClick={() => setStatus('Opening Settings…')}
                >
                  <Settings className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:text-black transition-colors" />
                  <span className="nav-text flex-1">Settings</span>
                </div>
              </div>
            </div>
          </nav>

          {/* 底部固定按钮 */}
          <div className="p-4 border-t border-neutral-200/50 mt-auto">
            <button
              onClick={toggleSidebarPin}
              className="w-full flex items-center justify-center gap-2 py-2 text-xs font-mono hover:bg-black/5 transition-colors cursor-pointer border-none bg-transparent"
            >
              {isSidebarPinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5" /> Unpin Sidebar
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5" /> Pin Sidebar
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export const Sidebar = memo(SidebarComponent);
