/* ================================================
   FILE: src/layout/SidebarNavSection.tsx
   ================================================ */
import { Settings, Rocket, FileText } from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';
import { Layers } from 'lucide-react';

interface ObjectType {
  id: string;
  name: string;
  icon?: string;
}

interface SidebarNavSectionProps {
  objectTypes: ObjectType[] | undefined;
  docTypeCounts: Record<string, number> | undefined;
  selectedTypeId: string | null;
  selectedTag: string | null;
  onNavigateToType: (typeId: string) => void;
  onOpenTypeManager: () => void;
  onOpenEditor: (docId: string) => void;
}

// Helper mapping custom minimalist line-art SVG icons for object types
const getObjectTypeIcon = (typeId: string, customIcon?: string) => {
  if (customIcon) {
    const LucideIcon = (Icons as unknown as Record<string, React.FC<LucideProps>>)[customIcon];
    if (LucideIcon) {
      let colorClass = 'text-neutral-500';
      if (typeId === 'note') colorClass = 'text-emerald-600';
      else if (typeId === 'person') colorClass = 'text-sky-500';
      else if (typeId === 'project') colorClass = 'text-rose-500';
      else if (typeId === 'book') colorClass = 'text-amber-600';
      else if (typeId === 'task') colorClass = 'text-indigo-500';
      return <LucideIcon className={`w-4 h-4 ${colorClass}`} />;
    }
  }
  switch (typeId) {
    case 'page':
      return (
        <svg
          className="w-4 h-4 text-neutral-500 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="2" width="16" height="20" rx="2" />
          <path d="M8 7h8M8 11h8M8 15h5" />
        </svg>
      );
    case 'note':
      return (
        <svg
          className="w-4 h-4 text-emerald-600 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M7 6V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2" />
          <path d="M7 11h10M7 14h6" />
        </svg>
      );
    case 'person':
      return (
        <svg
          className="w-4 h-4 text-sky-500 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case 'project':
      return (
        <svg
          className="w-4 h-4 text-rose-500 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'book':
      return (
        <svg
          className="w-4 h-4 text-amber-600 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </svg>
      );
    case 'task':
      return (
        <svg
          className="w-4 h-4 text-indigo-500 fill-none stroke-current"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    default:
      return <Layers className="w-4 h-4 text-neutral-400" />;
  }
};

export function SidebarNavSection({
  objectTypes,
  docTypeCounts,
  selectedTypeId,
  selectedTag,
  onNavigateToType,
  onOpenTypeManager,
  onOpenEditor,
}: SidebarNavSectionProps) {
  return (
    <>
      {/* PINNED Section */}
      <div>
        <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3 flex items-center gap-1">
          <span>📌 Pinned Nodes</span>
        </div>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onOpenEditor('main-editor-doc')}
            className="spring-click hover-ui w-full px-3 py-2 flex items-center gap-3 text-left border-none bg-transparent cursor-pointer font-sys text-neutral-700 hover:text-black rounded"
          >
            <Rocket className="w-3.5 h-3.5 text-rose-500" />
            <span className="nav-text flex-1 truncate font-semibold">Topology Map</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenEditor('heine-borel')}
            className="spring-click hover-ui w-full px-3 py-2 flex items-center gap-3 text-left border-none bg-transparent cursor-pointer font-sys text-neutral-700 hover:text-black rounded"
          >
            <FileText className="w-3.5 h-3.5 text-blue-500" />
            <span className="nav-text flex-1 truncate font-semibold">Heine–Borel Theorem</span>
          </button>
        </div>
      </div>

      {/* NOTES & PAGES Section */}
      <div>
        <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3">
          🗂️ Notes & Pages
        </div>
        <div className="space-y-1">
          {(objectTypes || [])
            .filter((type) => type.id === 'page' || type.id === 'note')
            .map((type) => {
              const count = docTypeCounts?.[type.id] || 0;
              const isSelected = selectedTypeId === type.id && !selectedTag;

              return (
                <button
                  key={type.id}
                  onClick={() => onNavigateToType(type.id)}
                  className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded group text-left border-none bg-transparent cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-100 text-black font-bold border-l-2 border-black/80 pl-2.5'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {getObjectTypeIcon(type.id, type.icon)}
                    <span className="font-semibold text-xs truncate capitalize">{type.name}</span>
                  </div>
                  <span className="font-mono text-[9px] bg-neutral-100/80 group-hover:bg-neutral-200/40 text-neutral-400 group-hover:text-neutral-600 px-1.5 py-0.2 rounded shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* COLLECTIONS Section */}
      <div>
        <div className="sidebar-label text-[10px] font-mono uppercase tracking-[0.15em] text-[var(--text-muted)] opacity-50 mb-2 px-3 flex items-center justify-between">
          <span>🗃️ Databases</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTypeManager();
            }}
            className="hover:text-black hover:bg-neutral-200/50 p-0.5 rounded cursor-pointer border-none bg-transparent transition-all flex items-center"
            title="Configure & Manage Schemas"
          >
            <Settings className="w-3 h-3 text-neutral-400 hover:text-neutral-700" />
          </button>
        </div>
        <div className="space-y-1">
          {(objectTypes || [])
            .filter((type) => type.id !== 'page' && type.id !== 'note')
            .map((type) => {
              const count = docTypeCounts?.[type.id] || 0;
              const isSelected = selectedTypeId === type.id && !selectedTag;

              return (
                <button
                  key={type.id}
                  onClick={() => onNavigateToType(type.id)}
                  className={`spring-click w-full px-3 py-1.8 flex items-center justify-between rounded group text-left border-none bg-transparent cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-neutral-100 text-black font-bold border-l-2 border-black/80 pl-2.5'
                      : 'text-neutral-600 hover:text-black hover:bg-neutral-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {getObjectTypeIcon(type.id, type.icon)}
                    <span className="font-semibold text-xs truncate capitalize">{type.name}</span>
                  </div>
                  <span className="font-mono text-[9px] bg-neutral-100/80 group-hover:bg-neutral-200/40 text-neutral-400 group-hover:text-neutral-600 px-1.5 py-0.2 rounded shrink-0">
                    {count}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    </>
  );
}
