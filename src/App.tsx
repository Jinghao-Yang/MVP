/* ================================================
   FILE: src/App.tsx
   ================================================ */
import { useEffect, useRef } from 'react';
import { Sidebar } from '@/layout/Sidebar';
import { QuickCapture } from '@/components/QuickCapture';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { PageRouter } from '@/components/layout/PageRouter';
import { CommandPalette } from '@/components/CommandPalette';
import { KeyboardShortcutsModal } from '@/components/KeyboardShortcutsModal';
import { searchIndexingService } from '@/services/search-indexing-service';
import { useUiStore, type UiState, useSettingsStore, usePopupStore } from '@/stores';
import { useKanbanStore } from '@/stores/kanban-store';
import { useShallow } from 'zustand/react/shallow';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { db, seedDatabase } from '@/db/dexie';
import { documentService } from '@/services/document-service';
import { documentParseService } from '@/services/document-parse-service';
import type { PopupData } from '@/types';
import { truncateText } from '@/utils/sanitize';
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
    isKeyboardShortcutsOpen,
    setKeyboardShortcutsOpen,
  } = useUiStore(
    useShallow((state: UiState) => ({
      isSidebarHovered: state.isSidebarHovered,
      isZenMode: state.isZenMode,
      isSidebarPinned: state.isSidebarPinned,
      setActivePage: state.setActivePage,
      setCommandPaletteOpen: state.setCommandPaletteOpen,
      setZenMode: state.setZenMode,
      isKeyboardShortcutsOpen: state.isKeyboardShortcutsOpen,
      setKeyboardShortcutsOpen: state.setKeyboardShortcutsOpen,
    }))
  );

  const { quickCaptureText, setQuickCaptureText, quickCaptureSubmit } = useKanbanStore(
    useShallow((state) => ({
      quickCaptureText: state.quickCaptureText,
      setQuickCaptureText: state.setQuickCaptureText,
      quickCaptureSubmit: state.quickCaptureSubmit,
    }))
  );

  const { theme, fontSize } = useSettingsStore();

  const isCommandPaletteOpen = useUiStore((state: UiState) => state.isCommandPaletteOpen);
  const setPopups = usePopupStore((state) => state.setPopups);
  const initializedRef = useRef(false);

  useEffect(() => {
    async function initializeWorkspace() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      await seedDatabase();

      // Ensure all documents are indexed once if transitioning onto Version 6 Schema
      try {
        const totalDocs = await db.documents.count();
        const totalInlineTasks = await db.inlineTasks.count();
        if (totalInlineTasks === 0 && totalDocs > 0) {
          const docs = await db.documents.toArray();
          for (const doc of docs) {
            await documentParseService.parseDocument(doc.id, doc.content);
          }
        }
      } catch (err) {
        console.error('Failed to pre-index existing documents:', err);
      }

      const allPopoverStates = await db.popoverStates.toArray();
      const restoredPopups: PopupData[] = [];

      for (const popoverState of allPopoverStates) {
        const docData = await documentService.getDocument(popoverState.id);
        if (docData) {
          restoredPopups.push({
            id: popoverState.id,
            title: docData.title,
            excerpt: truncateText(docData.content, 180),
            badge: docData.badge,
            badgeClass: docData.badgeClass,
            x: popoverState.x,
            y: popoverState.y,
            width: popoverState.width,
            height: popoverState.height,
            isPinned: popoverState.isPinned ?? true,
            isMinimized: popoverState.isMinimized ?? false,
            stackIndex: 1,
            history: [popoverState.id],
            historyIndex: 0,
          });
        }
      }

      setPopups(restoredPopups);
    }

    initializeWorkspace();
    searchIndexingService.startIndexing();

    return () => {
      searchIndexingService.stopIndexing();
    };
  }, [setPopups]);

  useEffect(() => {
    document.body.className = `theme-${theme} font-size-${fontSize}`;
    if (isZenMode) {
      document.body.classList.add('zen-active');
    }
  }, [theme, fontSize, isZenMode]);

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

  useHotkeys('shift+?', (e) => {
    e.preventDefault();
    setKeyboardShortcutsOpen(!isKeyboardShortcutsOpen);
  });

  useHotkeys('esc', (e) => {
    if (isKeyboardShortcutsOpen) {
      e.preventDefault();
      setKeyboardShortcutsOpen(false);
    }
  });

  const isSidebarActiveCollapsed = isZenMode || (!isSidebarPinned && !isSidebarHovered);

  return (
    <ErrorBoundary>
      {/* 极简优雅的 Toast 系统 */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-canvas)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--text-muted)',
            fontFamily: 'Space Grotesk, sans-serif',
            color: 'var(--text-main)',
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
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      {/* 快捷键字典面版 */}
      <KeyboardShortcutsModal
        isOpen={isKeyboardShortcutsOpen}
        onClose={() => setKeyboardShortcutsOpen(false)}
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
