/* ================================================
   FILE: src/layout/TagsSection.tsx
   ================================================ */
import { Tag, ChevronRight } from 'lucide-react';

interface TagsSectionProps {
  tagsList: Array<{ tag: string }> | undefined;
  selectedTag: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onNavigateToTag: (tag: string) => void;
}

export function TagsSection({
  tagsList,
  selectedTag,
  isExpanded,
  onToggleExpand,
  onNavigateToTag,
}: TagsSectionProps) {
  // Compile Tag counts dynamically
  const tagCountsMap = (tagsList || []).reduce(
    (acc, current) => {
      acc[current.tag] = (acc[current.tag] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const uniqueTagsSorted = Object.entries(tagCountsMap).sort((a, b) => b[1] - a[1]);

  return (
    <div>
      <button
        type="button"
        onClick={onToggleExpand}
        className="spring-click w-full px-3 py-1.8 flex items-center justify-between rounded text-left border-none bg-transparent cursor-pointer transition-colors text-neutral-600 hover:text-black hover:bg-neutral-50"
      >
        <div className="flex items-center gap-2.5">
          <Tag className="w-4 h-4 text-neutral-400" />
          <span className="font-bold text-xs">Tags Index</span>
        </div>
        <ChevronRight
          className={`w-3.5 h-3.5 transition-transform opacity-40 duration-200 ${isExpanded ? 'rotate-90 text-black opacity-100' : ''}`}
        />
      </button>

      {/* Render Tags drop list */}
      {isExpanded && (
        <div className="pl-6 pr-2 py-1 space-y-1 border-l border-neutral-100 ml-5 mt-1">
          {uniqueTagsSorted.length === 0 ? (
            <div className="text-[10px] italic text-neutral-400 py-1 font-mono">No active tags</div>
          ) : (
            uniqueTagsSorted.map(([tag, val]) => {
              const isTagSelected = selectedTag === tag;
              return (
                <button
                  key={tag}
                  onClick={() => onNavigateToTag(tag)}
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
  );
}
