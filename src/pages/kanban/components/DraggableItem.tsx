import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type React from 'react';
import { IndexCard } from './IndexCard';
import { ManuscriptBlock } from './ManuscriptBlock';

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
}

export function DraggableItem({ card, isTerminal }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
  });

  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div style={style} {...listeners} {...attributes} className="outline-none">
      {isTerminal ? (
        <ManuscriptBlock card={card} isDragging={isDragging} ref={setNodeRef} />
      ) : (
        <IndexCard card={card} isDragging={isDragging} ref={setNodeRef} />
      )}
    </div>
  );
}
