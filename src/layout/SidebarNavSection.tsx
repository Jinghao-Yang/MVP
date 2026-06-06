/* ================================================
   FILE: src/layout/SidebarNavSection.tsx
   ================================================ */
import {
  Settings,
  Rocket,
  FileText,
  Notebook,
  User,
  Folder,
  BookOpen,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import * as Icons from 'lucide-react';

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
      return <FileText className="w-4 h-4 text-neutral-500" />;
    case 'note':
      return <Notebook className="w-4 h-4 text-emerald-600" />;
    case 'person':
      return <User className="w-4 h-4 text-sky-500" />;
    case 'project':
      return <Folder className="w-4 h-4 text-rose-500" />;
    case 'book':
      return <BookOpen className="w-4 h-4 text-amber-600" />;
    case 'task':
      return <CheckCircle2 className="w-4 h-4 text-indigo-500" />;
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
