import type React from 'react';

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

interface ManuscriptBlockProps {
  card: PipelineCard;
  isDragging?: boolean;
  ref?: React.Ref<HTMLDivElement>;
}

export function ManuscriptBlock({ card, isDragging, ref }: ManuscriptBlockProps) {
  return (
    <div
      ref={ref}
      className={`px-5 py-6 border-b border-neutral-200/50 bg-[var(--bg-canvas)] transition-all cursor-grab relative
      ${isDragging ? 'shadow-xl opacity-90 scale-[1.01] z-50' : 'hover:bg-white'}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-bh-green opacity-50"></div>

      <div className="font-mono text-[9px] text-bh-green font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
        <span>§ Compiled / {card.refId}</span>
      </div>

      <h4 className="font-human text-xl font-bold text-black mb-2">{card.title}</h4>
      <p className="font-human text-[14.5px] text-neutral-700 leading-relaxed">{card.excerpt}</p>
    </div>
  );
}