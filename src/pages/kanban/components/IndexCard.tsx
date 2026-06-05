import { memo } from 'react';

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

interface IndexCardProps {
  card: PipelineCard;
  isDragging?: boolean;
}

export const IndexCard = memo(function IndexCard({ card, isDragging }: IndexCardProps) {
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

      <h4 className="font-sys text-sm font-bold text-black mb-1.5 leading-snug group-hover:text-bh-blue transition-colors">
        {card.title}
      </h4>
      <p className="font-human text-[13px] text-neutral-500 line-clamp-2 leading-relaxed mb-3">
        {card.excerpt}
      </p>

      <div className="flex items-center gap-4 font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <svg
            className="w-3 h-3 text-bh-red"
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
            className="w-3 h-3 text-bh-blue"
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
});
