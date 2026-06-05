import { useDroppable } from '@dnd-kit/core';
import { DraggableItem } from './DraggableItem';

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

interface LedgerColumnProps {
  id: string;
  title: string;
  index: string;
  cards: PipelineCard[];
  isTerminal?: boolean;
}

export function LedgerColumn({ id, title, index, cards, isTerminal }: LedgerColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col h-full border-r border-neutral-200 last:border-r-0 transition-colors duration-300
      ${isTerminal ? 'bg-[var(--bg-canvas)]' : 'bg-white'}
      ${isOver ? (isTerminal ? 'bg-bh-green/5' : 'bg-neutral-50') : ''}
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
