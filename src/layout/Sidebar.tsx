/* ================================================
   FILE: src/layout/Sidebar.tsx
   ================================================ */
import { useRef, useEffect, useState } from 'react';
import { ChevronRight, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { useShallow } from 'zustand/react/shallow';
import { useSyncStore } from '@/stores/sync-store';
import { db } from '@/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import { TypeManager } from '@/components/TypeManager';

// Import refactored components
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavSection } from './SidebarNavSection';
import { DiscoverySection } from './DiscoverySection';
import { WarningSection } from './WarningSection';
import { SyncStatus } from './SyncStatus';
import { SidebarFooter } from './SidebarFooter';

function SidebarComponent({
  openPage,
  openCommandPalette: _openCommandPalette,
  setStatus,
}: {
  openPage: (p: string) => void;
  openCommandPalette: () => void;
  setStatus: (m: string) => void;
}) {
  const {
    isZenMode,
    isSidebarPinned,
    toggleSidebarPin,
    isSidebarHovered,
    setSidebarHovered,
    setMainWikiId,
    setActiveProjectTab,
    selectedTypeId,
    setSelectedTypeId,
    selectedTag,
    setSelectedTag,
  } = useUiStore(
    useShallow((state: UiState) => ({
      isZenMode: state.isZenMode,
      isSidebarPinned: state.isSidebarPinned,
      toggleSidebarPin: state.toggleSidebarPin,
      isSidebarHovered: state.isSidebarHovered,
      setSidebarHovered: state.setSidebarHovered,
      setMainWikiId: state.setMainWikiId,
      setActiveProjectTab: state.setActiveProjectTab,
      selectedTypeId: state.selectedTypeId,
      setSelectedTypeId: state.setSelectedTypeId,
      selectedTag: state.selectedTag,
      setSelectedTag: state.setSelectedTag,
    }))
  );

  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const isExpanded = isSidebarPinned || isSidebarHovered;

  const syncStatus = useSyncStore((state) => state.syncStatus);
  const syncNow = useSyncStore((state) => state.syncNow);
  const lastSynced = useSyncStore((state) => state.lastSyncedAt);

  // States to keep Sidebar interactive
  const [isTagsExpanded, setIsTagsExpanded] = useState(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState(false);

  // Fetch live tables from database - optimized
  const objectTypes = useLiveQuery(() => db.objectTypes.toArray(), []);

  // 获取每个类型的文档计数 - 使用索引查询
  const docTypeCounts = useLiveQuery(async () => {
    const counts: Record<string, number> = {};
    const allDocs = await db.documents.toArray();
    allDocs.forEach((doc) => {
      if (doc.typeId) {
        counts[doc.typeId] = (counts[doc.typeId] || 0) + 1;
      }
      if (!doc.typeId || doc.typeId === 'inbox' || doc.badge?.toLowerCase() === 'unprocessed') {
        counts['inbox'] = (counts['inbox'] || 0) + 1;
      }
    });
    return counts;
  }, []);

  // 只订阅任务和项目的完整文档用于警告
  const taskAndProjectDocs = useLiveQuery(
    () => db.documents.where('typeId').anyOf(['task', 'project']).toArray(),
    []
  );

  // 只订阅任务和项目的文档属性
  const relevantDocProps = useLiveQuery(async () => {
    const taskAndProjectIds = taskAndProjectDocs?.map((d) => d.id) || [];
    if (taskAndProjectIds.length === 0) return [];
    return db.docProperties.where('docId').anyOf(taskAndProjectIds).toArray();
  }, [taskAndProjectDocs]);

  const tagsList = useLiveQuery(() => db.tags.toArray(), []);
  const _links = useLiveQuery(() => db.links.toArray(), []);
  const _relations = useLiveQuery(() => db.relations.toArray(), []);

  // 获取文档索引计数
  const orphanCount = useLiveQuery(async () => {
    const allLinks = await db.links.toArray();
    const allRelations = await db.relations.toArray();
    const allDocs = await db.documents.toArray();

    const connectedIds = new Set<string>();
    allLinks.forEach((l) => {
      connectedIds.add(l.sourceId);
      connectedIds.add(l.targetId);
    });
    allRelations.forEach((r) => {
      connectedIds.add(r.sourceId);
      connectedIds.add(r.targetId);
    });

    return allDocs.filter((d) => !connectedIds.has(d.id)).length;
  }, []);

  // 获取inbox计数
  const inboxCount = useLiveQuery(async () => {
    const allDocs = await db.documents.toArray();
    return allDocs.filter(
      (d) => !d.typeId || d.typeId === 'inbox' || d.badge?.toLowerCase() === 'unprocessed'
    ).length;
  }, []);

  // Action alarm on load if items are expiring
  const toastTriggeredRef = useRef(false);
  const expiringItems = (taskAndProjectDocs || []).filter((doc) => {
    if (doc.typeId !== 'task' && doc.typeId !== 'project') return false;
    const propId = doc.typeId === 'task' ? 'prop-task-duedate' : 'prop-proj-duedate';
    const val = relevantDocProps?.find((p) => p.docId === doc.id && p.propId === propId)?.value;
    if (!val) return false;

    // Parse due date
    const parts = val.split('-');
    if (parts.length !== 3) return false;
    const due = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff <= 1;
  });

  useEffect(() => {
    if (expiringItems.length > 0 && !toastTriggeredRef.current) {
      toastTriggeredRef.current = true;
      toast.warning(`Critical: ${expiringItems.length} deadlines expire within 24 hours!`, {
        description: expiringItems.map((item) => item.title).join(', '),
        duration: 7000,
      });
    }
  }, [expiringItems]);

  // Handlers
  const _handleCreateNewNode = async () => {
    try {
      const docId = `Z-${Date.now().toString().slice(-6)}`;
      await db.documents.add({
        id: docId,
        title: 'Untitled Note',
        content: '# Untitled Note\n\nStart typing...',
        badge: 'Fleeting',
        badgeClass: 'tag-badge-yellow',
        updatedAt: Date.now(),
      });
      setMainWikiId(docId);
      openPage('editor');
      setStatus('New node created.');
    } catch {
      setStatus('Failed to create node.');
    }
  };

  const handleNavigateToType = (typeId: string) => {
    setSelectedTag(null);
    setSelectedTypeId(typeId);
    setActiveProjectTab('database');
    openPage('project');
  };

  const handleNavigateToTag = (tag: string) => {
    setSelectedTypeId(null);
    setSelectedTag(tag);
    setActiveProjectTab('database');
    openPage('project');
  };

  const handleNavigateToInbox = () => {
    setSelectedTag(null);
    setSelectedTypeId('inbox');
    setActiveProjectTab('database');
    openPage('project');
  };

  const handleNavigateToMaintenance = () => {
    setSelectedTag(null);
    setSelectedTypeId('maintenance');
    setActiveProjectTab('database');
    openPage('project');
  };

  const handleOpenEditor = (docId: string) => {
    setMainWikiId(docId);
    openPage('editor');
  };

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const handleExpand = () => {
    if (isSidebarPinned || isZenMode || isTouch) return;
    clearCloseTimer();
    setSidebarHovered(true);
  };

  const handleCollapse = () => {
    if (isSidebarPinned || isZenMode || isTouch) return;
    clearCloseTimer();
    closeTimer.current = setTimeout(() => {
      setSidebarHovered(false);
    }, 250);
  };

  const handleToggle = () => {
    if (isZenMode) return;
    if (isSidebarPinned) {
      toggleSidebarPin();
    } else {
      setSidebarHovered(!isSidebarHovered);
    }
  };

  useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  return (
    <>
      {isTouch && !isZenMode && (
        <button
          onClick={handleToggle}
          className="fixed top-1/2 -translate-y-1/2 left-0 z-[calc(var(--z-sidebar)-1)] p-2 bg-white/90 shadow-lg rounded-r-lg border border-l-0 border-neutral-200/80 hover:bg-white transition-colors"
        >
          <ChevronRight
            className={`w-5 h-5 text-neutral-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}

      {!isTouch && !isSidebarPinned && !isZenMode && (
        <div
          onMouseEnter={handleExpand}
          className="fixed top-0 left-0 bottom-0 w-6 group transition-all duration-200"
          style={{ zIndex: 'calc(var(--z-sidebar) - 1)' }}
        >
          <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-r from-white/40 to-transparent group-hover:w-6 group-hover:from-white/50 transition-all duration-300 ease-out" />
        </div>
      )}

      <aside
        onMouseEnter={isTouch ? undefined : handleExpand}
        onMouseLeave={isTouch ? undefined : handleCollapse}
        className="sidebar glass-panel"
        id="sidebar"
        style={{
          width: isExpanded ? 'var(--sidebar-width)' : '0px',
          transform: isExpanded ? 'translateX(0)' : 'translateX(-100%)',
          opacity: isExpanded ? 1 : 0,
          pointerEvents: isExpanded ? 'auto' : 'none',
          transition:
            'width 0.3s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
          position: 'fixed',
          zIndex: 'var(--z-sidebar)',
          boxShadow: isExpanded ? '24px 0px 80px -12px rgba(28, 28, 26, 0.08)' : 'none',
        }}
      >
        <div className="w-[240px] h-full flex flex-col overflow-hidden shrink-0">
          <SidebarHeader />

          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-7 custom-scrollbar text-xs text-[var(--text-secondary)] font-medium select-none">
            <SidebarNavSection
              objectTypes={objectTypes}
              docTypeCounts={docTypeCounts}
              selectedTypeId={selectedTypeId}
              selectedTag={selectedTag}
              onNavigateToType={handleNavigateToType}
              onOpenTypeManager={() => setIsTypeManagerOpen(true)}
              onOpenEditor={handleOpenEditor}
            />

            <DiscoverySection
              inboxCount={inboxCount}
              orphanCount={orphanCount}
              tagsList={tagsList}
              selectedTypeId={selectedTypeId}
              selectedTag={selectedTag}
              isTagsExpanded={isTagsExpanded}
              onNavigateToInbox={handleNavigateToInbox}
              onNavigateToMaintenance={handleNavigateToMaintenance}
              onToggleTagsExpand={() => setIsTagsExpanded(!isTagsExpanded)}
              onNavigateToTag={handleNavigateToTag}
            />

            <WarningSection
              taskAndProjectDocs={taskAndProjectDocs}
              relevantDocProps={relevantDocProps}
              onOpenEditor={handleOpenEditor}
            />

            {/* SYSTEM Section */}
            <div>
              <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3">
                ⚙️ System
              </div>
              <div className="space-y-1">
                <button
                  className="spring-click hover-ui w-full px-3 py-2 flex items-center gap-3 text-left group cursor-pointer border-none bg-transparent"
                  onClick={() => {
                    useUiStore.getState().setActiveProjectTab('settings');
                    openPage('project');
                  }}
                >
                  <Settings className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                  <span className="nav-text flex-1 text-neutral-600 group-hover:text-black font-semibold">
                    Settings
                  </span>
                </button>
              </div>
            </div>
          </nav>

          <SyncStatus syncStatus={syncStatus} lastSynced={lastSynced} onSyncNow={syncNow} />
          <SidebarFooter isSidebarPinned={isSidebarPinned} onTogglePin={toggleSidebarPin} />
        </div>
      </aside>
      <TypeManager isOpen={isTypeManagerOpen} onClose={() => setIsTypeManagerOpen(false)} />
    </>
  );
}

export const Sidebar = SidebarComponent;
