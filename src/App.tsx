/* ================================================
   FILE: src/App.tsx
   ================================================ */
import { useEffect, useCallback } from 'react';
import { Sidebar } from '@/layout/Sidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { QuickCapture } from '@/components/QuickCapture';
import { MobileSidebar } from '@/components/layout/MobileSidebar';
import { StatusBar } from '@/components/layout/StatusBar';
import { PageRouter } from '@/components/layout/PageRouter';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { useKanbanStore } from '@/stores/kanban-store';
import { useEditorStore } from '@/stores/editor-store';
import { usePopupStore } from '@/stores/popup-store';
import { useShallow } from 'zustand/react/shallow';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { db, seedDatabase } from '@/db/dexie';
import { getDocument } from '@/db/documents';
import type { PopupData } from '@/types';
import { EDITOR } from '@/utils/constants';

/**
 * 初始化工作区的自定义 Hook
 * 负责加载数据库数据、恢复弹窗状态等
 */
function useInitializeWorkspace() {
  const loadKanbanCards = useKanbanStore((state) => state.loadKanbanCards);
  const setDocumentText = useEditorStore((state) => state.setDocumentText);
  const setPopups = usePopupStore((state) => state.setPopups);

  return useCallback(async () => {
    await Promise.all([seedDatabase(), loadKanbanCards()]);

    let leftDoc = await getDocument('main-editor-doc');
    if (!leftDoc) {
      leftDoc = {
        id: 'main-editor-doc',
        title: 'Topology Math',
        content: `# Compactness in topological spaces\n\nThis space maps the foundational structures of topological spaces. It bridges the intuitive notion of [closeness](compactness) without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.\n\nA topological space is a set endowed with a structure, called a topology, which allows defining continuous deformation of subspaces. Generalizing the [Heine–Borel](heine-borel) theorem requires us to move beyond Euclidean constraints.\n\nThis brings us to [Tychonoff's Theorem](tychonoff), which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.`,
        badge: 'Active Draft',
        badgeClass: 'tag-badge-blue',
        updatedAt: Date.now(),
      };
      await db.documents.add(leftDoc);
    }

    setDocumentText(leftDoc.content);

    const storedMetadata = JSON.parse(localStorage.getItem('axiom-popup-storage') || '{}');
    const pinnedPopoverMetadata = storedMetadata?.state?.pinnedPopoverMetadata || [];
    const restoredPopups: PopupData[] = [];

    for (const meta of pinnedPopoverMetadata) {
      const docData = await getDocument(meta.id);
      const popoverPos = await db.popoverStates.get(meta.id);
      if (docData) {
        restoredPopups.push({
          id: meta.id,
          title: docData.title,
          excerpt: docData.content.substring(0, EDITOR.EXCERPT_LENGTH) + '...',
          badge: docData.badge,
          badgeClass: docData.badgeClass,
          x: popoverPos?.x ?? 120,
          y: popoverPos?.y ?? 120,
          width: popoverPos?.width ?? 500,
          height: popoverPos?.height ?? 320,
          isPinned: meta.isPinned,
          isMinimized: meta.isMinimized,
          depth: 1,
          history: [meta.id],
          historyIndex: 0,
        });
      }
    }

    setPopups(restoredPopups);
  }, [loadKanbanCards, setDocumentText, setPopups]);
}

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

  const initializeWorkspace = useInitializeWorkspace();

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
