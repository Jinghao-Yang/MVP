/* ================================================
   FILE: src/components/layout/MobileSidebar.tsx
   ================================================ */
import { Drawer } from 'vaul';
import { Menu } from 'lucide-react';
import { Sidebar } from '@/layout/Sidebar';
import { useUiStore, type UiState } from '@/stores';
import { useShallow } from 'zustand/react/shallow';
import { toast } from 'sonner';

export function MobileSidebar() {
  const { isMobileSidebarOpen, setMobileSidebarOpen, setCommandPaletteOpen, setActivePage } =
    useUiStore(
      useShallow((state: UiState) => ({
        isMobileSidebarOpen: state.isMobileSidebarOpen,
        setMobileSidebarOpen: state.setMobileSidebarOpen,
        setCommandPaletteOpen: state.setCommandPaletteOpen,
        setActivePage: state.setActivePage,
      }))
    );

  return (
    <Drawer.Root
      direction="left"
      open={isMobileSidebarOpen}
      onOpenChange={(open) => setMobileSidebarOpen(open)}
    >
      {/* 移动端边缘悬浮唤醒按钮 */}
      {!isMobileSidebarOpen && (
        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="fixed top-5 left-5 z-40 p-2.5 glass-panel bg-white/80 hover:bg-white shadow-md cursor-pointer flex items-center justify-center rounded-lg border border-neutral-200/50 md:hidden"
        >
          <Menu className="w-4 h-4 text-black" />
        </button>
      )}

      <Drawer.Portal>
        {/* 覆盖背景 */}
        <Drawer.Overlay className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[105]" />

        {/* 物理弹簧面板 */}
        <Drawer.Content className="fixed top-4 left-4 bottom-4 w-[240px] z-[110] outline-none flex md:hidden">
          <div className="h-full w-full bg-transparent flex flex-col">
            <Sidebar
              openPage={setActivePage}
              openCommandPalette={() => setCommandPaletteOpen(true)}
              setStatus={(msg) => toast(msg)}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
