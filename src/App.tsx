/* ================================================
   FILE: src/App.tsx
   ================================================ */
import { useEffect } from 'react';
import { Sidebar } from '@/layout/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { QuickCapture } from '@/components/QuickCapture';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { PageRouter } from '@/components/layout/PageRouter';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { useKanbanStore } from '@/stores/kanban-store';
import { useShallow } from 'zustand/react/shallow';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useWorkspaceInit } from '@/hooks/useWorkspaceInit';

function AppContent() {
  const { isSidebarHovered, isZenMode, isSidebarPinned, setActivePage, setCommandPaletteOpen } =
    useUiStore(
      useShallow((state: UiState) => ({
        isSidebarHovered: state.isSidebarHovered,
        isZenMode: state.isZenMode,
        isSidebarPinned: state.isSidebarPinned,
        setActivePage: state.setActivePage,
        setCommandPaletteOpen: state.setCommandPaletteOpen,
      }))
    );

  const { quickCaptureText, setQuickCaptureText, quickCaptureSubmit } = useKanbanStore(
    useShallow((state) => ({
      quickCaptureText: state.quickCaptureText,
      setQuickCaptureText: state.setQuickCaptureText,
      quickCaptureSubmit: state.quickCaptureSubmit,
    }))
  );

  const isCommandPaletteOpen = useUiStore((state: UiState) => state.isCommandPaletteOpen);
  const setStatus = useUiStore((state: UiState) => state.setStatus);

  const initializeWorkspace = useWorkspaceInit();

  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  const isSidebarActiveCollapsed = isZenMode || (!isSidebarPinned && !isSidebarHovered);

  return (
    <ErrorBoundary>
      {/* 移动端侧边栏 */}
      <MobileSidebar />

      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <Sidebar
          openPage={setActivePage}
          openCommandPalette={() => setCommandPaletteOpen(true)}
          setStatus={setStatus}
        />
      </div>

      {/* 页面路由 */}
      <PageRouter isSidebarActiveCollapsed={isSidebarActiveCollapsed} />

      {/* 快捷捕获 */}
      <QuickCapture
        isZenMode={isZenMode}
        value={quickCaptureText}
        onChange={setQuickCaptureText}
        onSubmit={() => quickCaptureSubmit(setStatus)}
      />

      {/* 状态提示 */}
      <StatusBar />

      {/* 命令面板 */}
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
