/* ================================================
   FILE: src/App.tsx
   ================================================ */
import { Sidebar } from '@/layout/Sidebar';
import { ProjectPage } from '@/pages/ProjectPage';
import { EditorPage } from '@/editor/EditorPage';
import { CommandPalette } from '@/components/CommandPalette';
import { QuickCapture } from '@/components/QuickCapture';
import { useAppStore } from '@/store/useAppStore';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnimatePresence, motion, useMotionValue, useTransform, animate } from 'motion/react';
import { Menu } from 'lucide-react';

function AppContent() {
  const activePage = useAppStore((state) => state.activePage);
  const setActivePage = useAppStore((state) => state.setActivePage);
  const isSidebarHovered = useAppStore((state) => state.isSidebarHovered);
  const isZenMode = useAppStore((state) => state.isZenMode);
  const isSidebarPinned = useAppStore((state) => state.isSidebarPinned);
  const setZenMode = useAppStore((state) => state.setZenMode);
  const isCommandPaletteOpen = useAppStore((state) => state.isCommandPaletteOpen);
  const setCommandPaletteOpen = useAppStore((state) => state.setCommandPaletteOpen);
  const statusMsg = useAppStore((state) => state.statusMsg);
  const showStatus = useAppStore((state) => state.showStatus);
  const setStatus = useAppStore((state) => state.setStatus);
  const quickCaptureText = useAppStore((state) => state.quickCaptureText);
  const setQuickCaptureText = useAppStore((state) => state.setQuickCaptureText);
  const setSidebarHovered = useAppStore((state) => state.setSidebarHovered);

  const isSidebarActiveCollapsed = isZenMode || !isSidebarPinned && !isSidebarHovered;

  const x = useMotionValue(0);
  const backgroundOpacity = useTransform(x, [0, 80], [0, 0.1]);
  const sidebarTranslateX = useTransform(x, [0, 80], ['translateX(0)', 'translateX(100%)']);

  const handleDragEnd = (_: unknown, info: { offset: { x: number } }) => {
    if (info.offset.x > 80) {
      animate(x, 80, { type: 'spring', stiffness: 300, damping: 30 });
      setTimeout(() => {
        setSidebarHovered(false);
        animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
      }, 300);
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 30 });
    }
  };

  return (
    <ErrorBoundary>
      {/* 移动端侧边栏包装 */}
      <motion.div
        style={{ x: sidebarTranslateX }}
        className="fixed inset-y-0 left-0 z-[110] pointer-events-none md:hidden"
      >
        <Sidebar
          isCollapsed={isSidebarActiveCollapsed}
          openPage={setActivePage}
          openCommandPalette={() => setCommandPaletteOpen(true)}
          setStatus={setStatus}
        />
      </motion.div>

      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <Sidebar
          isCollapsed={isSidebarActiveCollapsed}
          openPage={setActivePage}
          openCommandPalette={() => setCommandPaletteOpen(true)}
          setStatus={setStatus}
        />
      </div>

      {/* 移动端专属悬浮触发器：收起时在左上角提供精致的物理按键来拉起侧边栏 */}
      {isSidebarActiveCollapsed && (
        <button
          onClick={() => setSidebarHovered(true)}
          className="fixed top-5 left-5 z-40 p-2.5 glass-panel bg-white/80 hover:bg-white shadow-md cursor-pointer flex items-center justify-center rounded-lg border border-neutral-200/50 md:hidden"
        >
          <Menu className="w-4 h-4 text-black" />
        </button>
      )}

      {/* 移动端遮罩层：侧边栏展开后，点击主页面空白处一键收回侧边栏，支持右滑关闭手势 */}
      {!isSidebarActiveCollapsed && !isSidebarPinned && (
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 80 }}
          dragElastic={0}
          onDragEnd={handleDragEnd}
          style={{ opacity: backgroundOpacity }}
          onClick={() => setSidebarHovered(false)}
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[105] md:hidden animate-in fade-in duration-300 cursor-grab active:cursor-grabbing"
        />
      )}

      <div
        className={`main-content transition-[margin-left] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isSidebarActiveCollapsed ? 'ml-4' : 'ml-[256px]'
        }`}
        id="main-content"
      >
        {/* 精致转场机制：Page 切换时带微升降、光学模糊渐变的 Motion-Blurred Card Lift 转场 */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="h-full flex flex-col"
          >
            {activePage === 'project' && <ProjectPage openPage={setActivePage} />}
            {activePage === 'editor' && (
              <EditorPage
                isZenMode={isZenMode}
                onToggleZen={() => {
                  setZenMode(!isZenMode);
                  setStatus(!isZenMode ? 'Zen mode activated.' : 'Restored layout.');
                }}
                openPage={setActivePage}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <QuickCapture
        isZenMode={isZenMode}
        value={quickCaptureText}
        onChange={setQuickCaptureText}
        onSubmit={() => {
          setStatus('Captured: ' + quickCaptureText);
          setQuickCaptureText('');
        }}
      />

      <div
        className={`fixed bottom-24 right-6 bg-white text-black font-mono text-xs px-4 py-2 border border-neutral-200 shadow-xl transition-all duration-300 pointer-events-none z-50 uppercase tracking-widest ${showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        {statusMsg}
      </div>

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onOpenPage={setActivePage}
      />
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}
