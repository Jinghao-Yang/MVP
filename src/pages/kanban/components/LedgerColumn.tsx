import { useRef, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useVirtualizer } from '@tanstack/react-virtual';
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

// 虚拟滚动阈值：卡片数量超过此值时启用虚拟滚动
const VIRTUAL_SCROLL_THRESHOLD = 100;

export function LedgerColumn({ id, title, index, cards, isTerminal }: LedgerColumnProps) {
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({ id });
  const containerRef = useRef<HTMLDivElement>(null);

  // 当卡片数量超过阈值时启用虚拟滚动
  const shouldVirtualize = cards.length > VIRTUAL_SCROLL_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: cards.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => 120, // 每个卡片大约 120px 高
    overscan: 5,
  });

  // 合并两个 ref
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setDroppableRef(node);
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [setDroppableRef]
  );

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

      <div ref={setRefs} className="flex-1 overflow-y-auto custom-scrollbar">
        {shouldVirtualize ? (
          // 虚拟滚动模式
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const card = cards[virtualRow.index];
              return (
                <div
                  key={card.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <DraggableItem card={card} isTerminal={!!isTerminal} />
                </div>
              );
            })}
          </div>
        ) : (
          // 普通渲染模式
          cards.map((card) => <DraggableItem key={card.id} card={card} isTerminal={!!isTerminal} />)
        )}
        {cards.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-300 font-mono text-[10px] uppercase tracking-widest min-h-[200px]">
            [ Empty ]
          </div>
        )}
      </div>
    </div>
  );
}
