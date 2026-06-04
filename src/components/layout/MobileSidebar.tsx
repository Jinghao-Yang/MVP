/* ================================================
   FILE: src/components/layout/MobileSidebar.tsx
   ================================================ */
import { useMotionValue, useTransform, animate } from 'motion/react';
import { motion } from 'motion/react';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/layout/Sidebar';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { useShallow } from 'zustand/react/shallow';

export function MobileSidebar() {
  const {
    isSidebarHovered,
    isZenMode,
    isSidebarPinned,
    setSidebarHovered,
    setCommandPaletteOpen,
    setStatus,
    setActivePage,
  } = useUiStore(
    useShallow((state: UiState) => ({
      isSidebarHovered: state.isSidebarHovered,
      isZenMode: state.isZenMode,
      isSidebarPinned: state.isSidebarPinned,
      setSidebarHovered: state.setSidebarHovered,
      setCommandPaletteOpen: state.setCommandPaletteOpen,
      setStatus: state.setStatus,
      setActivePage: state.setActivePage,
    }))
  );

  const isSidebarActiveCollapsed = isZenMode || (!isSidebarPinned && !isSidebarHovered);

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
    <>
      {/* 移动端侧边栏包装 */}
      <motion.div
        style={{ x: sidebarTranslateX }}
        className="fixed inset-y-0 left-0 z-[110] pointer-events-none md:hidden"
      >
        <Sidebar
          openPage={setActivePage}
          openCommandPalette={() => setCommandPaletteOpen(true)}
          setStatus={setStatus}
        />
      </motion.div>

      {isSidebarActiveCollapsed && (
        <button
          onClick={() => setSidebarHovered(true)}
          className="fixed top-5 left-5 z-40 p-2.5 glass-panel bg-white/80 hover:bg-white shadow-md cursor-pointer flex items-center justify-center rounded-lg border border-neutral-200/50 md:hidden"
        >
          <Menu className="w-4 h-4 text-black" />
        </button>
      )}

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
    </>
  );
}
