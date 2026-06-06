/* ================================================
   FILE: src/layout/DiscoverySection.tsx
   ================================================ */
import { Inbox, Layers } from 'lucide-react';
import { TagsSection } from './TagsSection';

interface DiscoverySectionProps {
  inboxCount: number | undefined;
  orphanCount: number | undefined;
  tagsList: Array<{ tag: string }> | undefined;
  selectedTypeId: string | null;
  selectedTag: string | null;
  isTagsExpanded: boolean;
  onNavigateToInbox: () => void;
  onNavigateToMaintenance: () => void;
  onToggleTagsExpand: () => void;
  onNavigateToTag: (tag: string) => void;
}

export function DiscoverySection({
  inboxCount,
  orphanCount,
  tagsList,
  selectedTypeId,
  selectedTag,
  isTagsExpanded,
  onNavigateToInbox,
  onNavigateToMaintenance,
  onToggleTagsExpand,
  onNavigateToTag,
}: DiscoverySectionProps) {
  return (
    <div>
      <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3">
        🧭 Discovery
      </div>
      <div className="space-y-1">
        {/* Inbox captured nodes */}
        <button
          type="button"
          onClick={onNavigateToInbox}
          className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded text-left border-none bg-transparent cursor-pointer transition-colors ${
            selectedTypeId === 'inbox'
              ? 'bg-neutral-100 text-black font-bold border-l-2 border-slate-700 pl-2.5'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Inbox className="w-4 h-4 text-slate-500" />
            <span className="font-bold text-xs">Inbox (Capture)</span>
          </div>
          {(inboxCount || 0) > 0 && (
            <span className="font-mono text-[9px] bg-red-50 text-red-600 border border-red-100 px-1.5 py-0.2 rounded font-bold">
              {inboxCount}
            </span>
          )}
        </button>

        {/* Collapsible Tags Hub */}
        <TagsSection
          tagsList={tagsList}
          selectedTag={selectedTag}
          isExpanded={isTagsExpanded}
          onToggleExpand={onToggleTagsExpand}
          onNavigateToTag={onNavigateToTag}
        />

        {/* Maintenance Orphans Reviewer */}
        <button
          type="button"
          onClick={onNavigateToMaintenance}
          className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded text-left border-none bg-transparent cursor-pointer transition-colors ${
            selectedTypeId === 'maintenance'
              ? 'bg-neutral-100 text-black font-bold border-l-2 border-indigo-600 pl-2.5'
              : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-semibold'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-emerald-500/80" />
            <span className="font-bold text-xs">Maintenance</span>
          </div>
          {(orphanCount || 0) > 0 && (
            <span className="font-mono text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-1.5 py-0.2 rounded font-bold">
              {orphanCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
}
