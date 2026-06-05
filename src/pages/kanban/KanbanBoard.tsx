import { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Database, Sparkles, AlertCircle, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { LedgerColumn } from './components/LedgerColumn';
import { useKanbanStore } from '@/stores/kanban-store';

export function KanbanBoard() {
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // 按列拆分订阅，减少不必要的重渲染
  const fleetingCards = useLiveQuery(
    () => db.kanbanCards.where('columnId').equals('fleeting').sortBy('order'),
    []
  );
  const seedlingCards = useLiveQuery(
    () => db.kanbanCards.where('columnId').equals('seedling').sortBy('order'),
    []
  );
  const evergreenCards = useLiveQuery(
    () => db.kanbanCards.where('columnId').equals('evergreen').sortBy('order'),
    []
  );
  const synthesisCards = useLiveQuery(
    () => db.kanbanCards.where('columnId').equals('synthesis').sortBy('order'),
    []
  );

  const updateCardColumn = useKanbanStore((state) => state.updateCardColumn);
  const error = useKanbanStore((state) => state.error);
  const clearError = useKanbanStore((state) => state.clearError);

  // 只有所有列都加载完成才算加载完成
  const isLoading =
    fleetingCards === undefined ||
    seedlingCards === undefined ||
    evergreenCards === undefined ||
    synthesisCards === undefined;

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const destColId = over.id as string;

    await updateCardColumn(cardId, destColId);

    if (destColId === 'synthesis') {
      setIsSynthesizing(true);
      setTimeout(() => setIsSynthesizing(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-[pane-slide_0.25s_cubic-bezier(0.22,1,0.36,1)_forwards">
      <div className="flex items-end justify-between mb-6 shrink-0">
        <div>
          <h2 className="font-human text-4xl font-normal tracking-tight">Zettelkasten Ledger</h2>
          <p className="text-[var(--text-muted)] font-sys text-sm mt-2 flex items-center gap-2">
            <Database className="w-4 h-4" /> Structured progression from isolated notes to
            contiguous manuscript.
          </p>
        </div>

        <div
          className={`px-4 py-2 flex items-center gap-3 border transition-all duration-500
          ${isSynthesizing ? 'bg-bh-green/10 border-bh-green/30 text-bh-green' : 'bg-white border-neutral-200 text-neutral-400'}`}
        >
          <Sparkles className={`w-4 h-4 ${isSynthesizing ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
            {isSynthesizing ? 'Compiling Manuscript...' : 'System Ready'}
          </span>
        </div>
      </div>

      {error && (
        <div className="error-toast mb-4" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sys text-sm flex-1">{error}</span>
          <button onClick={clearError} className="p-1 hover:bg-red-100 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 border border-neutral-200 shadow-sm bg-white overflow-hidden min-h-[600px] flex flex-col rounded-xl">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="loading-spinner w-10 h-10" />
              <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
                Loading Cards...
              </span>
            </div>
          </div>
        ) : (
          <DndContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-4 h-full flex-1">
              <LedgerColumn id="fleeting" index="01" title="Fleeting" cards={fleetingCards || []} />
              <LedgerColumn id="seedling" index="02" title="Seedling" cards={seedlingCards || []} />
              <LedgerColumn
                id="evergreen"
                index="03"
                title="Evergreen"
                cards={evergreenCards || []}
              />
              <LedgerColumn
                id="synthesis"
                index="04 // Terminal"
                title="Synthesis"
                cards={synthesisCards || []}
                isTerminal
              />
            </div>
          </DndContext>
        )}
      </div>
    </div>
  );
}
