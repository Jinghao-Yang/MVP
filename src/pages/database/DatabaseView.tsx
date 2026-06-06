/* ================================================
   FILE: src/pages/database/DatabaseView.tsx
   ================================================ */
import { useRef, useState, useMemo, use, Suspense } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { motion, AnimatePresence } from 'motion/react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { DayPicker } from 'react-day-picker';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { Trash2, Edit3, Calendar, Tag, ArrowUpDown, ChevronDown, X, Database } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '@/services/document-service';
import type { DocumentEntity } from '@/types';
import 'react-day-picker/dist/style.css';
import { useUiStore, type UiState } from '@/stores';
import { useShallow } from 'zustand/react/shallow';
import { assetService } from '@/services/asset-service';

// Styles adapt academic minimalist mood
const dayPickerClassNames = {
  caption: 'flex justify-between items-center px-2 py-1.5 font-sys text-sm font-bold text-black',
  head_cell: 'text-neutral-400 font-mono text-[10px] uppercase font-bold text-center w-8 py-2',
  cell: 'text-center p-0',
  day: 'w-8 h-8 text-xs font-sys text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer',
  day_selected: 'bg-neutral-900 text-white hover:bg-neutral-800 rounded-lg',
  day_today: 'border border-neutral-900/30 font-bold',
};

interface DatabaseViewProps {
  openPage: (page: string) => void;
}

export function DatabaseView({ openPage }: DatabaseViewProps) {
  const { selectedTypeId, setSelectedTypeId, selectedTag, setSelectedTag, setMainWikiId } =
    useUiStore(
      useShallow((state: UiState) => ({
        selectedTypeId: state.selectedTypeId,
        setSelectedTypeId: state.setSelectedTypeId,
        selectedTag: state.selectedTag,
        setSelectedTag: state.setSelectedTag,
        setMainWikiId: state.setMainWikiId,
      }))
    );

  // View state: 'table' vs 'calendar' vs 'gallery' representation
  const [viewMode, setViewMode] = useState<'table' | 'calendar' | 'gallery'>('table');
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(new Date());

  // 1. Data Subscriptions via LiveQueries
  const allDocs = useLiveQuery(() => db.documents.toArray(), []);
  const allProperties = useLiveQuery(() => db.properties.toArray(), []);
  const allDocProperties = useLiveQuery(() => db.docProperties.toArray(), []);
  const allLinks = useLiveQuery(() => db.links.toArray(), []);
  const allRels = useLiveQuery(() => db.relations.toArray(), []);
  const allObjectTypes = useLiveQuery(() => db.objectTypes.toArray(), []);

  // 1.1 Optimized document queries using Dexie indexes (for typeId and tag filtering)
  const docsByTypeId = useLiveQuery(async () => {
    if (!selectedTypeId || selectedTypeId === 'inbox' || selectedTypeId === 'maintenance') {
      return null;
    }
    return db.documents.where('typeId').equals(selectedTypeId).toArray();
  }, [selectedTypeId]);

  const docsByTag = useLiveQuery(async () => {
    if (!selectedTag) return null;
    // Use case-sensitive tag match via index (tags should be normalized)
    const tagRecords = await db.tags.where('tag').equals(selectedTag).toArray();
    const docIds = tagRecords.map((t) => t.docId);
    if (docIds.length === 0) return [];
    // Fetch documents by their IDs
    const docs: DocumentEntity[] = [];
    for (const id of docIds) {
      const doc = await db.documents.get(id);
      if (doc) docs.push(doc);
    }
    return docs;
  }, [selectedTag]);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [activeDatePickerId, setActiveDatePickerId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 2. Compute Filter Set - use indexed queries when possible
  const resolvedFilteredData = useMemo(() => {
    // Case 1: Custom Inbox Filter (any uncategorized capture nodes) - requires full scan
    if (selectedTypeId === 'inbox') {
      if (!allDocs) return [];
      return allDocs.filter(
        (doc) => !doc.typeId || doc.typeId === 'inbox' || doc.badge?.toLowerCase() === 'unprocessed'
      );
    }

    // Case 2: Custom Maintenance Filter (Orphans mapping: no linked mentions, no relations) - requires full scan
    if (selectedTypeId === 'maintenance') {
      if (!allDocs) return [];
      const connectedIds = new Set<string>();
      (allLinks || []).forEach((l) => {
        connectedIds.add(l.sourceId);
        connectedIds.add(l.targetId);
      });
      (allRels || []).forEach((r) => {
        connectedIds.add(r.sourceId);
        connectedIds.add(r.targetId);
      });
      return allDocs.filter((doc) => !connectedIds.has(doc.id));
    }

    // Case 3: Tag Filtering - use indexed query
    if (selectedTag) {
      return docsByTag || [];
    }

    // Case 4: Category/ObjectType Filter - use indexed query
    if (selectedTypeId) {
      return docsByTypeId || [];
    }

    // Default: no filter - return all docs
    return allDocs || [];
  }, [allDocs, selectedTypeId, selectedTag, docsByTypeId, docsByTag, allLinks, allRels]);

  // Filter for documents with image attachments in the OPFS for the Gallery view mode
  const galleryFilteredData = useMemo(() => {
    return resolvedFilteredData.filter(
      (doc) => doc.content && doc.content.includes('axiom://asset/')
    );
  }, [resolvedFilteredData]);

  // 3. Compile date properties mapping for calendar query integration
  const calendarEventsList = useMemo(() => {
    if (!allDocs || !allDocProperties || !allProperties) return [];

    // Find property entities of dataType date
    const datePropIds = new Set(
      allProperties.filter((p) => p.dataType === 'date').map((p) => p.id)
    );

    // Gather document date fields from docProperties
    const compiled: Array<{ docId: string; title: string; dateStr: string; typeId?: string }> = [];

    allDocProperties.forEach((dp) => {
      if (datePropIds.has(dp.propId) && dp.value) {
        const matchingDoc = allDocs.find((d) => d.id === dp.docId);
        if (matchingDoc) {
          compiled.push({
            docId: matchingDoc.id,
            title: matchingDoc.title,
            dateStr: dp.value,
            typeId: matchingDoc.typeId,
          });
        }
      }
    });

    return compiled;
  }, [allDocs, allDocProperties, allProperties]);

  // 4. Columns configuration for TanStack Table
  const columnHelper = createColumnHelper<DocumentEntity>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => (
          <span className="font-sys text-xs uppercase tracking-wider text-neutral-400">
            Node Title
          </span>
        ),
        cell: (info) => {
          const id = info.row.original.id;
          const value = info.getValue();
          const isEditing = editingCellId === id;

          return (
            <div
              className="relative flex items-center h-full min-w-[240px]"
              onDoubleClick={() => setEditingCellId(id)}
            >
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.input
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.98, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                    type="text"
                    defaultValue={value}
                    onBlur={async (e) => {
                      const newTitle = e.target.value.trim();
                      if (newTitle && newTitle !== value) {
                        await documentService.updateDocumentMetadata(id, { title: newTitle });
                        toast.success('Document renamed.');
                      }
                      setEditingCellId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-full bg-white border border-neutral-400 font-sys text-sm px-2 py-1 outline-none text-black shadow-sm"
                    autoFocus
                  />
                ) : (
                  <button
                    onClick={() => {
                      setMainWikiId(id);
                      openPage('editor');
                    }}
                    className="font-sys text-sm font-bold text-[#1C1C1A] py-1 text-left hover:text-neutral-600 transition-colors cursor-pointer border-none bg-transparent"
                  >
                    {value}
                  </button>
                )}
              </AnimatePresence>
            </div>
          );
        },
      }),

      columnHelper.accessor('typeId', {
        header: () => (
          <span className="font-sys text-xs uppercase tracking-wider text-neutral-400 font-bold">
            Category
          </span>
        ),
        cell: (info) => {
          const val = info.getValue() || 'Inbox Draft';
          return (
            <span className="font-mono text-[9px] uppercase bg-neutral-100 border border-neutral-200 text-neutral-500 px-2 py-0.5 font-bold">
              {val}
            </span>
          );
        },
      }),

      columnHelper.accessor('badge', {
        header: () => (
          <span className="font-sys text-xs uppercase tracking-wider text-neutral-400">Badge</span>
        ),
        cell: (info) => {
          const badge = info.getValue() || 'Untagged';
          const badgeClass = info.row.original.badgeClass || 'bg-neutral-100 text-neutral-500';
          return (
            <span
              className={`tag-badge inline-block text-[9px] px-2 py-0.5 rounded font-bold tracking-wider ${badgeClass}`}
            >
              {badge}
            </span>
          );
        },
      }),

      columnHelper.accessor('updatedAt', {
        header: () => (
          <span className="font-sys text-xs uppercase tracking-wider text-neutral-400">
            Node Date
          </span>
        ),
        cell: (info) => {
          const id = info.row.original.id;
          const timestamp = info.getValue();
          const formattedDate = timestamp ? format(new Date(timestamp), 'yyyy-MM-dd') : 'No Date';

          return (
            <div className="relative flex items-center gap-2">
              <button
                onClick={() => setActiveDatePickerId(activeDatePickerId === id ? null : id)}
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 border border-neutral-200 hover:border-neutral-300 rounded text-xs font-mono text-neutral-600 transition-colors bg-white cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                <span>{formattedDate}</span>
              </button>

              <AnimatePresence>
                {activeDatePickerId === id && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setActiveDatePickerId(null)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute top-10 left-0 bg-white p-4 border border-neutral-200/80 shadow-2xl z-50 overflow-hidden"
                    >
                      <DayPicker
                        mode="single"
                        selected={timestamp ? new Date(timestamp) : undefined}
                        onSelect={async (date) => {
                          if (date) {
                            await db.documents.update(id, { updatedAt: date.getTime() });
                            toast.success('Date updated.');
                          }
                          setActiveDatePickerId(null);
                        }}
                        classNames={dayPickerClassNames}
                      />
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          );
        },
      }),
    ],
    [editingCellId, activeDatePickerId, setMainWikiId, openPage]
  );

  // 5. React Table instantiation
  const table = useReactTable({
    data: resolvedFilteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // 6. Virtualized listing settings
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 54,
    overscan: 10,
  });

  // 7. Render Month Grid Calendar helper math
  const calendarMonthDays = useMemo(() => {
    const start = startOfMonth(currentCalendarMonth);
    const end = endOfMonth(currentCalendarMonth);
    return eachDayOfInterval({ start, end });
  }, [currentCalendarMonth]);

  const renderMaintenanceView = () => {
    const totalCount = allDocs?.length || 0;
    const orphanCount = resolvedFilteredData.length;
    const connectedCount = totalCount - orphanCount;
    const connectedPercentage = totalCount ? Math.round((connectedCount / totalCount) * 100) : 100;

    return (
      <div className="flex-1 overflow-y-auto space-y-6 px-1 py-1 custom-scrollbar">
        {/* Workspace Connection Health stats panel */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-neutral-50/50 p-6 border border-neutral-200/60 rounded-xl">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
              Workspace Connection Health
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-serif font-bold text-neutral-900">
                {connectedPercentage}%
              </span>
              <span className="text-xs text-neutral-500 font-semibold font-sys">
                organized graph
              </span>
            </div>
            {/* Minimal health progress bar */}
            <div className="w-full bg-neutral-200 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-full transition-all duration-500"
                style={{ width: `${connectedPercentage}%` }}
              />
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
              Connected Nodes
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-serif font-bold text-neutral-900">
                {connectedCount}
              </span>
              <span className="text-xs text-neutral-400 font-bold">/ {totalCount} total</span>
            </div>
            <p className="text-[10px] text-neutral-500 font-medium">
              Nodes have active bidirectional links or properties.
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
              Isolated/Orphaned Cards
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-serif font-bold text-red-500">{orphanCount}</span>
              <span className="text-xs text-neutral-400 font-bold">review needed</span>
            </div>
            <p className="text-[10px] text-neutral-500 font-medium">
              Lacking bidirectional backlinks or custom metadata links.
            </p>
          </div>
        </div>

        {/* Orphans Reviewer layout */}
        {orphanCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white border border-neutral-200 rounded-none shadow-sm">
            <svg
              className="w-10 h-10 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.746 3.746 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
              />
            </svg>
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-800 uppercase tracking-widest">
                Workspace Perfectly Connected
              </p>
              <p className="text-[11px] text-neutral-500">
                All documents are integrated with relations and bidirectional references.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pb-6">
            <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-neutral-400">
              Isolated Cards Quick Cleanup Deck
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resolvedFilteredData.map((doc) => {
                const docExcerpt = doc.content
                  ? doc.content.replace(/[#*`[\]\-]/g, '').slice(0, 100) + '...'
                  : 'Empty canvas note...';

                return (
                  <div
                    key={doc.id}
                    className="group border border-neutral-200 bg-white hover:border-neutral-400 p-5 rounded-none shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4 relative"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => {
                            setMainWikiId(doc.id);
                            openPage('editor');
                          }}
                          className="font-sys text-sm font-bold text-[#1C1C1A] text-left hover:text-neutral-600 border-none bg-transparent cursor-pointer p-0 select-text"
                        >
                          {doc.title || 'Untitled isolated card'}
                        </button>
                        <span className="font-mono text-[9px] uppercase tracking-wider font-bold bg-neutral-100 border border-neutral-200 text-neutral-500 px-1.5 py-0.2 rounded shrink-0">
                          {doc.typeId || 'draft'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed font-sys select-text">
                        {docExcerpt}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-neutral-100 mt-auto">
                      {/* Categorization & Link dropdowns */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Type Picker */}
                        <div className="flex flex-col space-y-1">
                          <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                            Set Category
                          </label>
                          <select
                            value={doc.typeId || 'inbox'}
                            onChange={async (e) => {
                              const targetVal = e.target.value;
                              await db.documents.update(doc.id, { typeId: targetVal });
                              toast.success(
                                `Categorized "${doc.title}" as ${targetVal.toUpperCase()}`
                              );
                            }}
                            className="bg-white border border-neutral-200 hover:border-neutral-300 rounded text-[10px] p-1 font-sys font-bold cursor-pointer outline-none shadow-sm h-7 text-neutral-700"
                          >
                            <option value="inbox">Inbox</option>
                            {(allObjectTypes || []).map((ot) => (
                              <option key={ot.id} value={ot.id}>
                                {ot.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Link to Existing Card Picker */}
                        <div className="flex flex-col space-y-1">
                          <label className="text-[9px] font-mono font-bold text-neutral-400 uppercase">
                            Link To Card
                          </label>
                          <select
                            onChange={async (e) => {
                              const targetId = e.target.value;
                              if (targetId) {
                                await db.links.put({
                                  sourceId: doc.id,
                                  targetId,
                                  start: 0,
                                  end: 1,
                                });
                                toast.success(
                                  `Connected "${doc.title}" to database context graph!`
                                );
                              }
                            }}
                            className="bg-white border border-neutral-200 hover:border-neutral-300 rounded text-[10px] p-1 font-sys font-bold cursor-pointer outline-none shadow-sm h-7 text-neutral-700"
                            defaultValue=""
                          >
                            <option value="" disabled>
                              Select...
                            </option>
                            {(allDocs || [])
                              .filter((d) => d.id !== doc.id)
                              .map((d) => (
                                <option key={d.id} value={d.id}>
                                  {d.title || d.id}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Fast deletion and quick edit controls */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">
                          Unlinked node
                        </span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setMainWikiId(doc.id);
                              openPage('editor');
                            }}
                            className="p-1 px-1.8 bg-white border border-neutral-200 hover:border-neutral-300 hover:text-black rounded text-[10px] font-sys font-bold cursor-pointer transition-all"
                          >
                            Open Node
                          </button>
                          <button
                            onClick={async () => {
                              await documentService.deleteDocument(doc.id);
                              toast.info('Permanently deleted orphaned node.');
                            }}
                            className="p-1 px-1.8 bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded text-[10px] font-sys font-bold cursor-pointer transition-all"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getSubHeaderLabel = () => {
    if (selectedTypeId === 'inbox') {
      return 'Inbox capturing workspace: uncategorized drafts needing processing.';
    }
    if (selectedTypeId === 'maintenance') {
      return 'Database boundaries analyzer: displaying isolated cards lacking bilateral link connections.';
    }
    if (selectedTag) {
      return `Tag index query: documents tagged with #${selectedTag}.`;
    }
    if (selectedTypeId) {
      return `Object Type slice: display records of category "${selectedTypeId.toUpperCase()}".`;
    }
    return 'Universal library index supporting dynamic categorization.';
  };

  const handleClearFilters = () => {
    setSelectedTypeId(null);
    setSelectedTag(null);
    toast.info('Cleared directory search filters.');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden select-none font-sys">
      {/* Dynamic Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 pb-5 mb-6 shrink-0">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl font-bold tracking-tight text-[#1C1C1A] flex items-center gap-2">
            <span>Workspace Directory</span>
            <span className="font-mono text-xs bg-neutral-100 text-neutral-500 font-bold px-2 py-0.5 rounded border border-neutral-200/50">
              {resolvedFilteredData.length} records
            </span>
          </h3>
          <p className="text-xs text-neutral-500 font-semibold">{getSubHeaderLabel()}</p>
        </div>

        {/* View Mode & Filter controls */}
        <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
          {/* Active Filter clear indicator badge */}
          {(selectedTypeId || selectedTag) && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-2 py-1 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200 text-neutral-600 rounded text-[10px] font-bold uppercase transition-colors shrink-0"
            >
              <span>Reset filter</span>
              <X className="w-3 h-3 text-neutral-500" />
            </button>
          )}

          {/* Selector for View Mode: Table, Gallery, Calendar */}
          {selectedTypeId !== 'maintenance' && (
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg border border-neutral-200/60 shadow-inner">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${
                  viewMode === 'table'
                    ? 'bg-white text-black shadow-none border-none animate-in fade-in duration-100'
                    : 'text-neutral-500 hover:text-black border-none bg-transparent'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('gallery')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${
                  viewMode === 'gallery'
                    ? 'bg-white text-black shadow-none border-none animate-in fade-in duration-100'
                    : 'text-neutral-500 hover:text-black border-none bg-transparent'
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`px-3 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white text-black shadow-none border-none animate-in fade-in duration-100'
                    : 'text-neutral-500 hover:text-black border-none bg-transparent'
                }`}
              >
                Calendar
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedTypeId === 'maintenance' ? (
        renderMaintenanceView()
      ) : viewMode === 'table' ? (
        /* Tabular list container */
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto border border-neutral-200 bg-white relative rounded-none shadow-sm"
          style={{ minHeight: '400px' }}
        >
          {resolvedFilteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <Database className="w-8 h-8 text-neutral-300 stroke-1" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  No matches compiled
                </p>
                <p className="text-[11px] text-neutral-400">
                  Try creating a new card or clearing active taxonomy filters.
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-neutral-100/90 backdrop-blur-md border-b border-neutral-200 z-30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="p-4 text-left font-bold text-xs border-b border-neutral-200 text-neutral-600 h-12"
                      >
                        {header.isPlaceholder ? null : (
                          <div
                            onClick={header.column.getToggleSortingHandler()}
                            className={`flex items-center gap-1.5 select-none ${header.column.getCanSort() ? 'cursor-pointer hover:text-black transition-colors' : ''}`}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {header.column.getCanSort() && (
                              <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
                            )}
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: 'relative',
                  display: 'block',
                  width: '100%',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const doc = row.original;

                  return (
                    <ContextMenu.Root key={doc.id}>
                      <ContextMenu.Trigger asChild>
                        <tr
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${virtualRow.size}px`,
                            transform: `translateY(${virtualRow.start}px)`,
                          }}
                          className="border-b border-neutral-200/60 hover:bg-neutral-50/50 transition-colors flex items-center px-4"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <td
                              key={cell.id}
                              className="flex-1 h-full flex items-center p-0 overflow-hidden"
                            >
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      </ContextMenu.Trigger>

                      <ContextMenu.Portal>
                        <ContextMenu.Content className="min-w-[190px] bg-white border border-neutral-300 p-1.5 shadow-xl z-[1000] rounded-none animate-in fade-in duration-100">
                          <ContextMenu.Item
                            onSelect={() => {
                              setMainWikiId(doc.id);
                              openPage('editor');
                            }}
                            className="flex items-center gap-2 p-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 hover:text-black cursor-pointer transition-colors outline-none"
                          >
                            <Edit3 className="w-4 h-4 text-neutral-400" />
                            <span>Edit Document</span>
                          </ContextMenu.Item>

                          <ContextMenu.Sub>
                            <ContextMenu.SubTrigger className="flex items-center justify-between gap-2 p-2 text-xs font-bold text-neutral-700 hover:bg-neutral-100 hover:text-black cursor-pointer transition-colors outline-none">
                              <div className="flex items-center gap-2">
                                <Tag className="w-4 h-4 text-neutral-400" />
                                <span>Assign Status Badge</span>
                              </div>
                              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                            </ContextMenu.SubTrigger>

                            <ContextMenu.Portal>
                              <ContextMenu.SubContent className="min-w-[150px] bg-white border border-neutral-300 p-1 shadow-lg z-[1001] rounded-none">
                                <ContextMenu.Item
                                  onSelect={async () => {
                                    await documentService.updateDocumentMetadata(doc.id, {
                                      badge: 'Evergreen',
                                      badgeClass: 'tag-badge-green',
                                    });
                                    toast.success('Badge updated to Evergreen.');
                                  }}
                                  className="p-2 text-[10px] font-mono uppercase font-bold text-[#708A74] hover:bg-neutral-100 cursor-pointer outline-none"
                                >
                                  Evergreen
                                </ContextMenu.Item>
                                <ContextMenu.Item
                                  onSelect={async () => {
                                    await documentService.updateDocumentMetadata(doc.id, {
                                      badge: 'Seedling',
                                      badgeClass: 'tag-badge-yellow',
                                    });
                                    toast.success('Badge updated to Seedling.');
                                  }}
                                  className="p-2 text-[10px] font-mono uppercase font-bold text-[#D1A34D] hover:bg-neutral-100 cursor-pointer outline-none"
                                >
                                  Seedling
                                </ContextMenu.Item>
                                <ContextMenu.Item
                                  onSelect={async () => {
                                    await documentService.updateDocumentMetadata(doc.id, {
                                      badge: 'Fleeting',
                                      badgeClass: 'tag-badge-blue',
                                    });
                                    toast.success('Badge updated to Fleeting.');
                                  }}
                                  className="p-2 text-[10px] font-mono uppercase font-bold text-indigo-700 hover:bg-neutral-100 cursor-pointer outline-none"
                                >
                                  Fleeting
                                </ContextMenu.Item>
                              </ContextMenu.SubContent>
                            </ContextMenu.Portal>
                          </ContextMenu.Sub>

                          <ContextMenu.Separator className="h-px bg-neutral-200 my-1.5" />

                          <ContextMenu.Item
                            onSelect={async () => {
                              await documentService.deleteDocument(doc.id);
                              toast.error('Document deleted.');
                            }}
                            className="flex items-center gap-2 p-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer transition-colors outline-none"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete permanently</span>
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      ) : viewMode === 'gallery' ? (
        /* Gallery bento-grid mode */
        <div className="flex-grow overflow-y-auto custom-scrollbar">
          {galleryFilteredData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white border border-neutral-200 rounded-none shadow-sm h-[360px]">
              <Database className="w-8 h-8 text-neutral-300 stroke-1" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                  No attachments compiled
                </p>
                <p className="text-[11px] text-neutral-400">
                  Try attaching an image to a card via drag-and-drop or paste.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6 animate-in fade-in duration-300">
              {galleryFilteredData.map((doc) => (
                <GalleryAttachmentCard
                  key={doc.id}
                  doc={doc}
                  setMainWikiId={setMainWikiId}
                  openPage={openPage}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Dynamic Monthly Calendar representation */
        <div className="flex-1 flex flex-col space-y-4">
          <div className="flex items-center justify-between bg-neutral-50 px-4 py-3 border border-neutral-200">
            <h4 className="font-serif text-sm font-bold text-neutral-800 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-neutral-500" />
              <span>{format(currentCalendarMonth, 'MMMM yyyy')}</span>
            </h4>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentCalendarMonth((m) => subMonths(m, 1))}
                className="p-1 px-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-[10px] uppercase font-bold transition-all rounded cursor-pointer"
              >
                Prev
              </button>
              <button
                onClick={() => setCurrentCalendarMonth(new Date())}
                className="p-1 px-2 bg-white border border-neutral-200 hover:bg-neutral-50 text-[10px] uppercase font-bold transition-all rounded cursor-pointer"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentCalendarMonth((m) => addMonths(m, 1))}
                className="p-1 px-2.5 bg-white border border-neutral-200 hover:bg-neutral-50 text-[10px] uppercase font-bold transition-all rounded cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>

          {/* Grid display */}
          <div className="grid grid-cols-7 gap-px bg-neutral-200 border border-neutral-200">
            {/* Days header */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="bg-neutral-50 p-2 font-mono text-[9px] uppercase font-bold text-center text-neutral-400"
              >
                {d}
              </div>
            ))}

            {/* Empty days block at start */}
            {Array.from({ length: startOfMonth(currentCalendarMonth).getDay() }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-neutral-50/40 p-2 min-h-24" />
            ))}

            {/* Days grid */}
            {calendarMonthDays.map((day) => {
              const dateKey = format(day, 'yyyy-MM-dd');
              const isToday = isSameDay(day, new Date());

              // Filter documents tagged with this specific due date in docProperties
              const activeEvents = calendarEventsList.filter((e) => e.dateStr === dateKey);

              return (
                <div
                  key={dateKey}
                  className={`bg-white p-2 min-h-[105px] border-none flex flex-col justify-between transition-colors hover:bg-neutral-50/40 ${isToday ? 'bg-neutral-50/50' : ''}`}
                >
                  <span
                    className={`font-mono text-[10px] font-bold ${isToday ? 'text-black bg-neutral-100 rounded-full px-1.5 py-0.5' : 'text-neutral-500'}`}
                  >
                    {day.getDate()}
                  </span>

                  {/* Render events inside cell */}
                  <div className="space-y-1.5 mt-2 flex-grow overflow-y-auto max-h-[75px] custom-scrollbar scroll-hide">
                    {activeEvents.map((evt) => (
                      <button
                        key={evt.docId}
                        onClick={() => {
                          setMainWikiId(evt.docId);
                          openPage('editor');
                        }}
                        className="w-full text-left p-1 text-[10px] bg-neutral-100/75 hover:bg-neutral-200/90 hover:text-black border border-neutral-200 font-sys font-bold leading-normal text-neutral-600 truncate rounded shrink-0 block transition-colors"
                        title={evt.title}
                      >
                        📄 {evt.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function AssetImg({ rawUrl, onClick }: { rawUrl: string; onClick: () => void }) {
  const resolvedSrc = use(assetService.resolveAssetUrl(rawUrl));

  return (
    <img
      src={resolvedSrc}
      alt="Asset"
      className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
      referrerPolicy="no-referrer"
      onClick={onClick}
    />
  );
}

function GalleryAttachmentCard({
  doc,
  setMainWikiId,
  openPage,
}: {
  doc: DocumentEntity;
  setMainWikiId: (id: string) => void;
  openPage: (p: string) => void;
}) {
  const firstRawUrl = useMemo(() => {
    if (!doc.content) return null;
    const regex = /axiom:\/\/asset\/[a-zA-Z0-9-]+/g;
    const matches = doc.content.match(regex);
    return matches ? matches[0] : null;
  }, [doc.content]);

  const docExcerpt = useMemo(() => {
    if (!doc.content) return 'Empty canvas note...';
    // Remove the markdown images from excerpt so they aren't shown as text!
    const cleanContent = doc.content
      .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
      .replace(/[#*`[\]\-]/g, '') // Remove other formatting
      .trim();
    return cleanContent.slice(0, 100) + (cleanContent.length > 100 ? '...' : '');
  }, [doc.content]);

  return (
    <div className="group border border-neutral-200 bg-white hover:border-neutral-400 rounded-none overflow-hidden shadow-sm hover:shadow transition-all duration-300 flex flex-col h-[320px] relative">
      {/* Aspect-video top covered image */}
      <div className="h-[160px] w-full bg-neutral-50 overflow-hidden relative border-b border-neutral-100">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-neutral-50">
              <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 tracking-widest animate-pulse">
                Compiling...
              </span>
            </div>
          }
        >
          {firstRawUrl ? (
            <AssetImg
              rawUrl={firstRawUrl}
              onClick={() => {
                setMainWikiId(doc.id);
                openPage('editor');
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-neutral-50">
              <span className="font-mono text-[9px] uppercase font-bold text-neutral-400 tracking-widest">
                No Asset
              </span>
            </div>
          )}
        </Suspense>
        {/* Type overlay badge */}
        <span className="absolute top-3 right-3 font-mono text-[8px] uppercase tracking-wider font-bold bg-white/95 border border-neutral-200 text-neutral-500 px-1.5 py-0.5 rounded shadow-sm">
          {doc.typeId || 'draft'}
        </span>
      </div>

      {/* Details body */}
      <div className="p-4 flex-grow flex flex-col justify-between min-h-0">
        <div className="space-y-1.5 min-h-0">
          <button
            onClick={() => {
              setMainWikiId(doc.id);
              openPage('editor');
            }}
            className="font-sys text-sm font-bold text-[#1C1C1A] text-left hover:text-neutral-600 border-none bg-transparent cursor-pointer p-0 select-text block w-full truncate"
          >
            {doc.title || 'Untitled Node'}
          </button>
          <p className="text-[11px] text-neutral-400 leading-relaxed font-sys select-text max-h-[50px] overflow-hidden line-clamp-2">
            {docExcerpt}
          </p>
        </div>

        {/* Footer controls */}
        <div className="pt-2.5 border-t border-neutral-100/60 flex items-center justify-between shrink-0">
          <span className="font-mono text-[8px] text-neutral-400 uppercase tracking-widest font-bold">
            Up: {doc.updatedAt ? format(new Date(doc.updatedAt), 'yyyy-MM-dd') : 'No Date'}
          </span>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setMainWikiId(doc.id);
                openPage('editor');
              }}
              className="p-1 px-2.5 bg-white border border-neutral-200 hover:border-neutral-300 hover:text-black rounded text-[10px] font-sys font-bold cursor-pointer transition-all"
            >
              Open
            </button>
            <button
              onClick={async () => {
                if (confirm('Delete this card permanently?')) {
                  await documentService.deleteDocument(doc.id);
                  toast.error('Document deleted.');
                }
              }}
              className="p-1 px-2.5 bg-red-50 text-red-600 border border-red-200 hover:border-red-300 rounded text-[10px] font-sys font-bold cursor-pointer transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
