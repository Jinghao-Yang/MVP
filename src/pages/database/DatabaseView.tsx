import { useRef, useState, useMemo } from 'react';
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
import { format } from 'date-fns';
import { Trash2, Edit3, Calendar, Tag, ArrowUpDown, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { documentService } from '@/services/document-service';
import type { DocumentEntity } from '@/types';
import 'react-day-picker/dist/style.css';
import { useUiStore } from '@/stores/ui-store'; // 导入全局 UI 状态

// 样式重写适配学术极简风
const dayPickerClassNames = {
  caption: 'flex justify-between items-center px-2 py-1.5 font-sys text-sm font-bold text-black',
  head_cell: 'text-neutral-400 font-mono text-[10px] uppercase font-bold text-center w-8 py-2',
  cell: 'text-center p-0',
  day: 'w-8 h-8 text-xs font-sys text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer',
  day_selected: 'bg-bh-red text-white hover:bg-bh-red/90 rounded-lg',
  day_today: 'border border-bh-red/30 font-bold',
};

interface DatabaseViewProps {
  openPage: (page: string) => void;
}

export function DatabaseView({ openPage }: DatabaseViewProps) {
  // 1. 数据绑定 - 使用 LiveQuery 订阅 Dexie 中的 Documents
  const documents = useLiveQuery(() =>
    db.documents.toArray((docs) =>
      docs.map(({ content: _content, ...meta }) => meta as DocumentEntity)
    )
  ) as DocumentEntity[] | undefined;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [editingCellId, setEditingCellId] = useState<string | null>(null);
  const [activeDatePickerId, setActiveDatePickerId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // 2. 表格列定义 (TanStack Table Column Helper)
  const columnHelper = createColumnHelper<DocumentEntity>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('title', {
        header: () => (
          <span className="font-sys text-xs uppercase tracking-wider text-neutral-400">Title</span>
        ),
        cell: (info) => {
          const id = info.row.original.id;
          const value = info.getValue();
          const isEditing = editingCellId === id;

          return (
            <div
              className="relative flex items-center h-full min-w-[200px]"
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
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    className="w-full bg-white border border-bh-red/40 rounded-lg px-2 py-1 text-sm outline-none font-sys text-black shadow-[0_0_12px_rgba(197,83,69,0.12)]"
                    autoFocus
                  />
                ) : (
                  <span className="font-sys text-sm font-semibold text-[#1C1C1A] py-1 select-none">
                    {value}
                  </span>
                )}
              </AnimatePresence>
            </div>
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
            Modified At
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
                className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 rounded-lg text-xs font-mono text-neutral-500 transition-colors border-none bg-transparent cursor-pointer"
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
                      className="absolute top-10 left-0 bg-white/95 backdrop-blur-md p-4 rounded-xl border border-neutral-200/60 shadow-2xl z-50 overflow-hidden"
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
    [editingCellId, activeDatePickerId]
  );

  const safeData = useMemo(() => documents || [], [documents]);

  // 3. React Table 实例
  const table = useReactTable({
    data: safeData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const { rows } = table.getRowModel();

  // 4. React Virtualized 列表虚拟化
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 54, // 每行大约 54px 高
    overscan: 10,
  });

  if (isLoading(documents)) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12">
        <div className="loading-spinner w-10 h-10 mb-4" />
        <span className="font-mono text-xs uppercase tracking-widest text-neutral-400">
          Loading Relations...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden pane-active">
      {/* 顶部控制栏 */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-human text-2xl font-normal text-[#1C1C1A] flex items-center gap-2">
          Workspace Directory{' '}
          <span className="font-mono text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded">
            {safeData.length} records
          </span>
        </h3>
      </div>

      {/* 滚动容器 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto border border-neutral-200/80 rounded-xl bg-white shadow-sm custom-scrollbar relative"
        style={{ height: '500px' }}
      >
        <table className="w-full border-collapse">
          {/* 表头 */}
          <thead className="sticky top-0 bg-neutral-50/90 backdrop-blur-md border-b border-neutral-200 z-30">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="p-4 text-left font-semibold text-xs border-b border-neutral-200 h-12 shrink-0"
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

          {/* 虚拟化表体 */}
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
                  {/* 右键菜单触发区域 */}
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
                      className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors flex items-center px-4"
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

                  {/* 弹出式上下文菜单 */}
                  <ContextMenu.Portal>
                    <ContextMenu.Content className="min-w-[180px] bg-white/95 backdrop-blur-md border border-neutral-200/80 p-1.5 shadow-2xl z-[1000] rounded-xl animate-in fade-in zoom-in-95 duration-100">
                      <ContextMenu.Item
                        onSelect={() => {
                          useUiStore.getState().setCurrentWikiId(doc.id);
                          openPage('editor');
                        }}
                        className="flex items-center gap-2 p-2 text-xs font-sys text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-lg cursor-pointer transition-colors outline-none"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Open in Editor</span>
                      </ContextMenu.Item>

                      <ContextMenu.Sub>
                        <ContextMenu.SubTrigger className="flex items-center justify-between gap-2 p-2 text-xs font-sys text-neutral-700 hover:bg-neutral-100 hover:text-black rounded-lg cursor-pointer transition-colors outline-none">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5" />
                            <span>Assign Badge</span>
                          </div>
                          <ChevronDown className="w-3 h-3 text-neutral-400" />
                        </ContextMenu.SubTrigger>

                        <ContextMenu.Portal>
                          <ContextMenu.SubContent className="min-w-[140px] bg-white/95 backdrop-blur-md border border-neutral-200/60 p-1 shadow-2xl z-[1001] rounded-lg">
                            <ContextMenu.Item
                              onSelect={async () => {
                                await documentService.updateDocumentMetadata(doc.id, {
                                  badge: 'Evergreen',
                                  badgeClass: 'tag-badge-green',
                                });
                                toast.success('Badge updated to Evergreen.');
                              }}
                              className="p-2 text-[10px] font-mono uppercase font-bold text-[#708A74] hover:bg-neutral-100 rounded cursor-pointer outline-none"
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
                              className="p-2 text-[10px] font-mono uppercase font-bold text-[#D1A34D] hover:bg-neutral-100 rounded cursor-pointer outline-none"
                            >
                              Seedling
                            </ContextMenu.Item>
                          </ContextMenu.SubContent>
                        </ContextMenu.Portal>
                      </ContextMenu.Sub>

                      <ContextMenu.Separator className="h-px bg-neutral-100 my-1.5" />

                      <ContextMenu.Item
                        onSelect={async () => {
                          await documentService.deleteDocument(doc.id);
                          toast.error('Document deleted.');
                        }}
                        className="flex items-center gap-2 p-2 text-xs font-sys text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer transition-colors outline-none"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete permanently</span>
                      </ContextMenu.Item>
                    </ContextMenu.Content>
                  </ContextMenu.Portal>
                </ContextMenu.Root>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function isLoading(val: unknown): val is undefined {
  return val === undefined;
}
