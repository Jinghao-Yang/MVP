/* ================================================
   FILE: src/App.tsx
   ================================================ */
import { useEffect } from 'react';
import { Sidebar } from '@/layout/Sidebar';
import { QuickCapture } from '@/components/QuickCapture';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { PageRouter } from '@/components/layout/PageRouter';
import { CommandPalette } from '@/components/CommandPalette';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { useKanbanStore } from '@/stores/kanban-store';
import { useShallow } from 'zustand/react/shallow';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useWorkspaceInit } from '@/hooks/useWorkspaceInit';
import { Toaster, toast } from 'sonner';
import { useHotkeys } from 'react-hotkeys-hook';

function AppContent() {
  const {
    isSidebarHovered,
    isZenMode,
    isSidebarPinned,
    setActivePage,
    setCommandPaletteOpen,
    setZenMode,
  } = useUiStore(
    useShallow((state: UiState) => ({
      isSidebarHovered: state.isSidebarHovered,
      isZenMode: state.isZenMode,
      isSidebarPinned: state.isSidebarPinned,
      setActivePage: state.setActivePage,
      setCommandPaletteOpen: state.setCommandPaletteOpen,
      setZenMode: state.setZenMode,
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
  const initializeWorkspace = useWorkspaceInit();

  useEffect(() => {
    initializeWorkspace();
  }, [initializeWorkspace]);

  // ================================================
  // 注册全局快捷键 (react-hotkeys-hook)
  // ================================================
  useHotkeys('mod+k', (e) => {
    e.preventDefault();
    setCommandPaletteOpen(!isCommandPaletteOpen);
  });

  useHotkeys('mod+z', (e) => {
    e.preventDefault();
    setZenMode(!isZenMode);
    toast.info(!isZenMode ? 'Zen mode activated.' : 'Restored layout.');
  });

  useHotkeys('mod+i', (e) => {
    e.preventDefault();
    // Zen 模式下禁用快捷键并显示提示
    if (isZenMode) {
      toast.info('Zen 模式下无法快速捕获');
      return;
    }
    // 聚焦快速捕获输入框的简单逻辑
    const input = document.querySelector('.quick-capture input') as HTMLInputElement;
    if (input) input.focus();
  });

  const isSidebarActiveCollapsed = isZenMode || (!isSidebarPinned && !isSidebarHovered);

  return (
    <ErrorBoundary>
      {/* 极简优雅的 Toast 系统 */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0, 0, 0, 0.08)',
            fontFamily: 'Space Grotesk, sans-serif',
            color: '#1C1C1A',
            fontSize: '12px',
          },
        }}
      />

      {/* 移动端触控抽屉式侧边栏 */}
      <MobileSidebar />

      {/* 桌面端侧边栏 */}
      <div className="hidden md:block">
        <Sidebar
          openPage={setActivePage}
          openCommandPalette={() => setCommandPaletteOpen(true)}
          setStatus={(msg) => toast(msg)}
        />
      </div>

      {/* 页面路由 */}
      <PageRouter isSidebarActiveCollapsed={isSidebarActiveCollapsed} />

      {/* 命令面板 */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* 快捷捕获 */}
      <QuickCapture
        isZenMode={isZenMode}
        value={quickCaptureText}
        onChange={setQuickCaptureText}
        onSubmit={() => quickCaptureSubmit((msg) => toast.success(msg))}
      />
    </ErrorBoundary>
  );
}

export default function App() {
  return <AppContent />;
}
