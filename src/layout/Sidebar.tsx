/* ================================================
   FILE: src/layout/Sidebar.tsx
   ================================================ */
import { memo, useRef, useEffect, useState } from 'react';
import {
  ChevronRight,
  Search,
  Plus,
  Settings,
  Pin,
  PinOff,
  RotateCw,
  FileText,
  Rocket,
  Layers,
  Inbox,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { useShallow } from 'zustand/react/shallow';
import { useSyncStore } from '@/stores/sync-store';
import { db } from '@/db/dexie';
import { useLiveQuery } from 'dexie-react-hooks';
import * as Icons from 'lucide-react';
import { TypeManager } from '@/components/TypeManager';

function SidebarComponent({
  openPage,
  openCommandPalette,
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

  // 1. Fetch live tables from database
  const objectTypes = useLiveQuery(() => db.objectTypes.toArray(), []);
  const documents = useLiveQuery(() => db.documents.toArray(), []);
  const docProps = useLiveQuery(() => db.docProperties.toArray(), []);
  const tagsList = useLiveQuery(() => db.tags.toArray(), []);
  const links = useLiveQuery(() => db.links.toArray(), []);
  const relations = useLiveQuery(() => db.relations.toArray(), []);

  // 2. Identify Expiring Items (Due Date within 24 Hours)
  const parseDueDate = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const getDaysDiff = (dateStr: string) => {
    const due = parseDueDate(dateStr);
    if (!due) return 999;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // List tasks and projects expiring within 1 day (or currently past due)
  const expiringItems = (documents || []).filter((doc) => {
    // Only check task and project object types
    if (doc.typeId !== 'task' && doc.typeId !== 'project') return false;

    // Find due date property
    const propId = doc.typeId === 'task' ? 'prop-task-duedate' : 'prop-proj-duedate';
    const val = docProps?.find((p) => p.docId === doc.id && p.propId === propId)?.value;
    if (!val) return false;

    const daysDiff = getDaysDiff(val);
    // expiring within next 24 hours
    return daysDiff >= 0 && daysDiff <= 1;
  });

  // Action alarm on load if items are expiring
  const toastTriggeredRef = useRef(false);
  useEffect(() => {
    if (expiringItems.length > 0 && !toastTriggeredRef.current) {
      toastTriggeredRef.current = true;
      toast.warning(`Critical: ${expiringItems.length} deadlines expire within 24 hours!`, {
        description: expiringItems.map((item) => item.title).join(', '),
        duration: 7000,
      });
    }
  }, [expiringItems]);

  // 3. Compile Tag counts dynamically
  const tagCountsMap = (tagsList || []).reduce(
    (acc, current) => {
      acc[current.tag] = (acc[current.tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueTagsSorted = Object.entries(tagCountsMap).sort((a, b) => b[1] - a[1]);

  // 4. Calculate Inbox Captured cards (typeId === null, empty, or 'inbox', or badge is capture-like)
  const inboxDocs = (documents || []).filter(
    (d) => !d.typeId || d.typeId === 'inbox' || d.badge?.toLowerCase() === 'unprocessed'
  );

  // 5. Analyze Orphaned Cards (No bilateral linkages, nor active structural relationships)
  const connectedIds = new Set<string>();
  (links || []).forEach((l) => {
    connectedIds.add(l.sourceId);
    connectedIds.add(l.targetId);
  });
  (relations || []).forEach((r) => {
    connectedIds.add(r.sourceId);
    connectedIds.add(r.targetId);
  });

  const orphanDocs = (documents || []).filter((d) => !connectedIds.has(d.id));

  const handleCreateNewNode = async () => {
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

  // Helper mapping custom minimalist line-art SVG icons for object types
  const getObjectTypeIcon = (typeId: string, customIcon?: string) => {
    if (customIcon) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const LucideIcon = (Icons as any)[customIcon];
      if (LucideIcon) {
        let colorClass = 'text-neutral-500';
        if (typeId === 'note') colorClass = 'text-emerald-600';
        else if (typeId === 'person') colorClass = 'text-sky-500';
        else if (typeId === 'project') colorClass = 'text-rose-500';
        else if (typeId === 'book') colorClass = 'text-amber-600';
        else if (typeId === 'task') colorClass = 'text-indigo-500';
        return <LucideIcon className={`w-4 h-4 ${colorClass}`} />;
      }
    }
    switch (typeId) {
      case 'page':
        return (
          <svg
            className="w-4 h-4 text-neutral-500 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <path d="M8 7h8M8 11h8M8 15h5" />
          </svg>
        );
      case 'note':
        return (
          <svg
            className="w-4 h-4 text-emerald-600 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="6" width="18" height="13" rx="2" />
            <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
            <path d="M7 11h10M7 14h6" />
          </svg>
        );
      case 'person':
        return (
          <svg
            className="w-4 h-4 text-sky-500 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        );
      case 'project':
        return (
          <svg
            className="w-4 h-4 text-rose-500 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        );
      case 'book':
        return (
          <svg
            className="w-4 h-4 text-amber-600 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        );
      case 'task':
        return (
          <svg
            className="w-4 h-4 text-indigo-500 fill-none stroke-current"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        );
      default:
        return <Layers className="w-4 h-4 text-neutral-400" />;
    }
  };

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
          {/* Logo Brand Header */}
          <div className="h-20 px-6 flex items-center justify-between shrink-0 select-none">
            <span className="logo-full font-serif text-base tracking-[0.25em] text-[var(--text-main)] font-bold">
              AXIOM
            </span>
            <span className="logo-full font-mono text-[9px] uppercase tracking-wider text-[var(--text-muted)] bg-neutral-100 border border-neutral-200/40 px-1.5 py-0.5 font-bold">
              PLANNER
            </span>
          </div>

          {/* Scrolling Navigator */}
          <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-7 custom-scrollbar text-xs text-[var(--text-secondary)] font-medium select-none">
            {/* 1. Quick Access Options */}
            <div className="space-y-1">
              <button
                onClick={openCommandPalette}
                className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent"
              >
                <Search className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1 text-neutral-600 group-hover:text-black font-semibold">
                  Search Node
                </span>
                <kbd className="font-mono text-[9px] text-neutral-400 opacity-60">⌘K</kbd>
              </button>
              <button
                onClick={handleCreateNewNode}
                className="spring-click hover-ui w-full flex items-center gap-3 px-3 py-2 text-left group rounded-none cursor-pointer border-none bg-transparent"
              >
                <Plus className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" />
                <span className="nav-text flex-1 text-neutral-600 group-hover:text-black font-semibold">
                  New Page Node
                </span>
              </button>
            </div>

            {/* 2. PINNED (收藏/固定) Section */}
            <div>
              <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3 flex items-center gap-1">
                <span>📌 Pinned Nodes</span>
              </div>
              <div className="space-y-1">
                {/* Seeded Topology Math Pinned Card */}
                <button
                  type="button"
                  onClick={() => {
                    setMainWikiId('main-editor-doc');
                    openPage('editor');
                  }}
                  className="spring-click hover-ui w-full px-3 py-2 flex items-center gap-3 text-left border-none bg-transparent cursor-pointer font-sys text-neutral-700 hover:text-black rounded"
                >
                  <Rocket className="w-3.5 h-3.5 text-rose-500" />
                  <span className="nav-text flex-1 truncate font-semibold">Topology Map</span>
                </button>

                {/* Seeded Heine-Borel Theorem Pinned Card */}
                <button
                  type="button"
                  onClick={() => {
                    setMainWikiId('heine-borel');
                    openPage('editor');
                  }}
                  className="spring-click hover-ui w-full px-3 py-2 flex items-center gap-3 text-left border-none bg-transparent cursor-pointer font-sys text-neutral-700 hover:text-black rounded"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span className="nav-text flex-1 truncate font-semibold">
                    Heine–Borel Theorem
                  </span>
                </button>
              </div>
            </div>

            {/* 3. NOTES & PAGES Section */}
            <div>
              <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3">
                🗂️ Notes & Pages
              </div>
              <div className="space-y-1">
                {(objectTypes || [])
                  .filter((type) => type.id === 'page' || type.id === 'note')
                  .map((type) => {
                    const count = (documents || []).filter((d) => d.typeId === type.id).length;
                    const isSelected = selectedTypeId === type.id && !selectedTag;

                    return (
                      <button
                        key={type.id}
                        onClick={() => handleNavigateToType(type.id)}
                        className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded group text-left border-none bg-transparent cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-100 text-black font-bold border-l-2 border-black/80 pl-2.5'
                            : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {getObjectTypeIcon(type.id, type.icon)}
                          <span className="font-semibold text-xs truncate capitalize">
                            {type.name}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] bg-neutral-100/80 group-hover:bg-neutral-200/40 text-neutral-400 group-hover:text-neutral-600 px-1.5 py-0.2 rounded shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 3.5 COLLECTIONS Section */}
            <div>
              <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3 flex items-center justify-between">
                <span>🗃️ Databases</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsTypeManagerOpen(true);
                  }}
                  className="hover:text-black hover:bg-neutral-200/50 p-0.5 rounded cursor-pointer border-none bg-transparent transition-all flex items-center"
                  title="Configure & Manage Schemas"
                >
                  <Settings className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
                </button>
              </div>
              <div className="space-y-1">
                {(objectTypes || [])
                  .filter((type) => type.id !== 'page' && type.id !== 'note')
                  .map((type) => {
                    const count = (documents || []).filter((d) => d.typeId === type.id).length;
                    const isSelected = selectedTypeId === type.id && !selectedTag;

                    return (
                      <button
                        key={type.id}
                        onClick={() => handleNavigateToType(type.id)}
                        className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded group text-left border-none bg-transparent cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-neutral-100 text-black font-bold border-l-2 border-black/80 pl-2.5'
                            : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          {getObjectTypeIcon(type.id, type.icon)}
                          <span className="font-semibold text-xs truncate capitalize">
                            {type.name}
                          </span>
                        </div>
                        <span className="font-mono text-[9px] bg-neutral-100/80 group-hover:bg-neutral-200/40 text-neutral-400 group-hover:text-neutral-600 px-1.5 py-0.2 rounded shrink-0">
                          {count}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* 4. DISCOVERY Section (Capturing captured, tags & maintenance helper) */}
            <div>
              <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3">
                🧭 Discovery
              </div>
              <div className="space-y-1">
                {/* Inbox captured nodes */}
                <button
                  type="button"
                  onClick={handleNavigateToInbox}
                  className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded text-left border-none bg-transparent cursor-pointer transition-colors ${
                    selectedTypeId === 'inbox'
                      ? 'bg-neutral-100 text-black font-bold border-l-2 border-slate-700 pl-2.5'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-slate-500" />
                    <span className="font-bold text-xs">Inbox (Capture)</span>
                  </div>
                  {inboxDocs.length > 0 && (
                    <span className="font-mono text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.2 rounded font-bold">
                      {inboxDocs.length}
                    </span>
                  )}
                </button>

                {/* Collapsible Tags Hub */}
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTagsExpanded(!isTagsExpanded);
                    }}
                    className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded text-left border-none bg-transparent cursor-pointer transition-colors text-neutral-600 hover:text-black hover:bg-neutral-50`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-neutral-400" />
                      <span className="font-bold text-xs">Tags Index</span>
                    </div>
                    <ChevronRight
                      className={`w-3.5 h-3.5 transition-transform opacity-40 duration-200 ${isTagsExpanded ? 'rotate-90 text-black opacity-100' : ''}`}
                    />
                  </button>

                  {/* Render Tags drop list */}
                  {isTagsExpanded && (
                    <div className="pl-6 pr-2 py-1 space-y-1 border-l border-neutral-100 ml-5 mt-1">
                      {uniqueTagsSorted.length === 0 ? (
                        <div className="text-[10px] italic text-neutral-400 py-1 font-mono">
                          No active tags
                        </div>
                      ) : (
                        uniqueTagsSorted.map(([tag, val]) => {
                          const isTagSelected = selectedTag === tag;
                          return (
                            <button
                              key={tag}
                              onClick={() => handleNavigateToTag(tag)}
                              className={`flex items-center justify-between w-full text-left font-mono text-[10px] border-none bg-transparent cursor-pointer ${
                                isTagSelected
                                  ? 'text-black font-bold bg-neutral-100 px-1'
                                  : 'text-neutral-500 hover:text-black'
                              }`}
                            >
                              <span className="truncate">#{tag}</span>
                              <span className="text-[8px] opacity-60">({val})</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>

                {/* Maintenance Orphans Reviewer */}
                <button
                  type="button"
                  onClick={handleNavigateToMaintenance}
                  className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded text-left border-none bg-transparent cursor-pointer transition-colors ${
                    selectedTypeId === 'maintenance'
                      ? 'bg-neutral-100 text-black font-bold border-l-2 border-indigo-600 pl-2.5'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-semibold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-emerald-500/80" />
                    <span className="font-bold text-xs">Maintenance</span>
                  </div>
                  {orphanDocs.length > 0 && (
                    <span className="font-mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded font-bold">
                      {orphanDocs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 5. Warning System Surfacing Soon Expiring Items */}
            {expiringItems.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200/65 rounded shadow-sm">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-800 font-bold uppercase tracking-wider mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Expiring ({expiringItems.length})</span>
                </div>
                <div className="space-y-1">
                  {expiringItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setMainWikiId(item.id);
                        openPage('editor');
                      }}
                      className="block text-left font-sys text-[10px] text-amber-700 hover:text-amber-900 border-none bg-transparent cursor-pointer truncate font-medium w-full"
                      title={item.title}
                    >
                      ⚠️ {item.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 6. SYSTEM Section */}
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

          {/* Local Sync Control Panel */}
          <div className="p-4 border-t border-neutral-200/30 bg-neutral-50/40 space-y-2.5">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400 shrink-0">
              <span>Data Integrity</span>
              <span
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold ${
                  syncStatus === 'syncing'
                    ? 'bg-bh-yellow/20 text-yellow-700 animate-pulse'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {syncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
              </span>
            </div>

            <button
              onClick={syncNow}
              disabled={syncStatus === 'syncing'}
              className="w-full h-8 flex items-center justify-center gap-2 border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-white bg-white/65 text-xs text-neutral-800 font-bold transition-all cursor-pointer select-none shrink-0"
            >
              <RotateCw
                className={`w-3 h-3 text-neutral-500 ${syncStatus === 'syncing' ? 'animate-spin text-bh-yellow' : ''}`}
              />
              <span>{syncStatus === 'syncing' ? 'Syncing...' : 'Force Sync'}</span>
            </button>

            {lastSynced && (
              <div className="text-[8px] font-mono text-center text-neutral-400 select-none shrink-0">
                Synced T: {new Date(lastSynced).toLocaleTimeString()}
              </div>
            )}
          </div>

          {/* Sidebar Pin Toggle Area */}
          <div className="p-4 border-t border-neutral-200/50 flex-none bg-transparent">
            <button
              onClick={toggleSidebarPin}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-mono text-neutral-500 hover:text-black transition-colors cursor-pointer border-none bg-transparent select-none"
            >
              {isSidebarPinned ? (
                <>
                  <PinOff className="w-3.5 h-3.5" /> Unpin Rail
                </>
              ) : (
                <>
                  <Pin className="w-3.5 h-3.5" /> Pin Rail
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
      <TypeManager isOpen={isTypeManagerOpen} onClose={() => setIsTypeManagerOpen(false)} />
    </>
  );
}

export const Sidebar = memo(SidebarComponent);
