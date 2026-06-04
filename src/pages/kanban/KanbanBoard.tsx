import React, { useMemo, useState } from 'react';
import { DndContext, DragEndEvent, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Database, Sparkles } from 'lucide-react';
import { useKanbanStore } from '@/stores/kanban-store';
import { type KanbanCardEntity } from '@/types';

interface PipelineCard {
  id: string;
  refId: string;
  title: string;
  excerpt: string;
  links: number;
  words: number;
  timestamp: string;
  colorClass: string;
}

interface DraggableItemProps {
  card: PipelineCard;
  isTerminal: boolean;
  key?: React.Key;
}

function IndexCard({ card, isDragging }: { card: PipelineCard; isDragging?: boolean }) {
  return (
    <div
      className={`p-4 border-b border-neutral-200/70 bg-white transition-all duration-200 cursor-grab group
      ${isDragging ? 'shadow-2xl ring-1 ring-black/10 opacity-95 scale-[1.02] rotate-1 z-50' : 'hover:bg-neutral-50'}`}
    >
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${card.colorClass}`}></div>
          <span className="font-mono text-[10px] font-bold text-neutral-500 tracking-wider">
            {card.refId}
          </span>
        </div>
        <span className="font-mono text-[9px] text-neutral-400 tracking-widest uppercase">
          {card.timestamp}
        </span>
      </div>

      <h4 className="font-sys text-sm font-bold text-black mb-1.5 leading-snug group-hover:text-[var(--bh-blue)] transition-colors">
        {card.title}
      </h4>
      <p className="font-human text-[13px] text-neutral-500 line-clamp-2 leading-relaxed mb-3">
        {card.excerpt}
      </p>

      <div className="flex items-center gap-4 font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-[var(--bh-red)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>{' '}
          {card.links}
        </span>
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-[var(--bh-blue)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>{' '}
          {card.words}
        </span>
      </div>
    </div>
  );
}

function ManuscriptBlock({ card, isDragging }: { card: PipelineCard; isDragging?: boolean }) {
  return (
    <div
      className={`px-5 py-6 border-b border-neutral-200/50 bg-[var(--bg-canvas)] transition-all cursor-grab relative
      ${isDragging ? 'shadow-xl opacity-90 scale-[1.01] z-50' : 'hover:bg-white'}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--bh-green)] opacity-50"></div>

      <div className="font-mono text-[9px] text-[var(--bh-green)] font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
        <span>§ Compiled / {card.refId}</span>
      </div>

      <h4 className="font-human text-xl font-bold text-black mb-2">{card.title}</h4>
      <p className="font-human text-[14.5px] text-neutral-700 leading-relaxed">{card.excerpt}</p>
    </div>
  );
}

function DraggableItem({ card, isTerminal }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="outline-none">
      {isTerminal ? (
        <ManuscriptBlock card={card} isDragging={isDragging} />
      ) : (
        <IndexCard card={card} isDragging={isDragging} />
      )}
    </div>
  );
}

function LedgerColumn({
  id,
  title,
  index,
  cards,
  isTerminal,
}: {
  id: string;
  title: string;
  index: string;
  cards: PipelineCard[];
  isTerminal?: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col h-full border-r border-neutral-200 last:border-r-0 transition-colors duration-300
      ${isTerminal ? 'bg-[var(--bg-canvas)]' : 'bg-white'}
      ${isOver ? (isTerminal ? 'bg-[var(--bh-green)]/5' : 'bg-neutral-50') : ''}
    `}
    >
      <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col gap-1 shrink-0">
        <span className="font-mono text-[10px] text-neutral-400 font-bold">{index}</span>
        <div className="flex items-center justify-between">
          <span className="font-sys text-xs font-bold uppercase tracking-widest text-black">
            {title}
          </span>
          <span className="font-mono text-[9px] bg-black/5 px-1.5 py-0.5 rounded text-neutral-500 font-bold">
            {cards.length}
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {cards.map((card) => (
          <DraggableItem key={card.id} card={card} isTerminal={!!isTerminal} />
        ))}
        {cards.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-300 font-mono text-[10px] uppercase tracking-widest min-h-[200px]">
            [ Empty ]
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard() {
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const kanbanCards = useKanbanStore((state) => state.kanbanCards);
  const updateCardColumn = useKanbanStore((state) => state.updateCardColumn);

  const kanbanData = useMemo(() => {
    return {
      fleeting: kanbanCards.filter((c: KanbanCardEntity) => c.columnId === 'fleeting'),
      seedling: kanbanCards.filter((c: KanbanCardEntity) => c.columnId === 'seedling'),
      evergreen: kanbanCards.filter((c: KanbanCardEntity) => c.columnId === 'evergreen'),
      synthesis: kanbanCards.filter((c: KanbanCardEntity) => c.columnId === 'synthesis'),
    };
  }, [kanbanCards]);

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
    <div className="flex-1 flex flex-col animate-[pane-slide_0.25s_cubic-bezier(0.22,1,0.36,1)_forwards]">
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
          ${isSynthesizing ? 'bg-[var(--bh-green)]/10 border-[var(--bh-green)]/30 text-[var(--bh-green)]' : 'bg-white border-neutral-200 text-neutral-400'}`}
        >
          <Sparkles className={`w-4 h-4 ${isSynthesizing ? 'animate-spin' : ''}`} />
          <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
            {isSynthesizing ? 'Compiling Manuscript...' : 'System Ready'}
          </span>
        </div>
      </div>

      <div className="flex-1 border border-neutral-200 shadow-sm bg-white overflow-hidden min-h-[600px] flex flex-col rounded-xl">
        <DndContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-4 h-full flex-1">
            <LedgerColumn id="fleeting" index="01" title="Fleeting" cards={kanbanData.fleeting} />
            <LedgerColumn id="seedling" index="02" title="Seedling" cards={kanbanData.seedling} />
            <LedgerColumn
              id="evergreen"
              index="03"
              title="Evergreen"
              cards={kanbanData.evergreen}
            />
            <LedgerColumn
              id="synthesis"
              index="04 // Terminal"
              title="Synthesis"
              cards={kanbanData.synthesis}
              isTerminal
            />
          </div>
        </DndContext>
      </div>
    </div>
  );
}
