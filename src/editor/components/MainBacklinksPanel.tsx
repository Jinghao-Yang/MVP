/* ==================================================
   FILE: src/editor/components/MainBacklinksPanel.tsx
   ================================================== */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { useUiStore } from '@/stores/ui-store';
import { Link2, Network, FileText, ChevronRight } from 'lucide-react';

interface MainBacklinksPanelProps {
  docId: string;
}

export function MainBacklinksPanel({ docId }: MainBacklinksPanelProps) {
  const setMainWikiId = useUiStore((state) => state.setMainWikiId);

  // 1. Fetch inline wikilinks that point to the active document
  const inlineLinks = useLiveQuery(
    () => db.links.where('targetId').equals(docId).toArray(),
    [docId]
  );

  // 2. Fetch structural relations that point to the active document
  const structuralRelations = useLiveQuery(
    () => db.relations.where('targetId').equals(docId).toArray(),
    [docId]
  );

  // 3. Load all documents to retrieve the titles and metadata of referring sources
  const documents = useLiveQuery(() => db.documents.toArray(), []);
  const properties = useLiveQuery(() => db.properties.toArray(), []);

  if (!docId) return null;

  // Build list of valid inline backlinks with document metadata
  const inlineBacklinks = (inlineLinks || [])
    .map((link) => {
      const sourceDoc = documents?.find((d) => d.id === link.sourceId);
      return sourceDoc
        ? { id: sourceDoc.id, title: sourceDoc.title, typeId: sourceDoc.typeId }
        : null;
    })
    .filter(Boolean);

  // Build list of valid structural back-relations with property mappings
  const structuralBacklinks = (structuralRelations || [])
    .map((rel) => {
      const sourceDoc = documents?.find((d) => d.id === rel.sourceId);
      const prop = properties?.find((p) => p.id === rel.propId);
      return sourceDoc && prop
        ? {
            id: sourceDoc.id,
            title: sourceDoc.title,
            typeId: sourceDoc.typeId,
            propertyName: prop.name,
          }
        : null;
    })
    .filter(Boolean);

  const hasAnyBacklinks = inlineBacklinks.length > 0 || structuralBacklinks.length > 0;

  if (!hasAnyBacklinks) return null;

  return (
    <div className="border border-neutral-200/60 bg-neutral-50/30 p-5 rounded-2xl space-y-4 mt-6 select-none font-sys">
      <div className="flex items-center gap-2 border-b border-neutral-200/40 pb-3">
        <Network className="w-4 h-4 text-neutral-500" />
        <span className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-500">
          Reverse Linkages & References
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
        {/* Inline Wikilinks References Column */}
        {inlineBacklinks.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-bh-blue" />
              Inline Wikilink Mentions
            </h5>
            <div className="flex flex-col gap-1.5">
              {inlineBacklinks.map((link) => {
                if (!link) return null;
                return (
                  <button
                    key={link.id}
                    onClick={() => setMainWikiId(link.id)}
                    className="flex items-center justify-between text-left px-3 py-2 bg-white hover:bg-neutral-50 border border-neutral-200/80 rounded-lg text-xs font-medium text-neutral-700 hover:text-black cursor-pointer transition-all hover:border-neutral-300 shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{link.title}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="font-mono text-[8px] uppercase tracking-wider px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-400 font-bold">
                        {link.typeId || 'PAGE'}
                      </span>
                      <ChevronRight className="w-3 h-3 text-neutral-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Structural Metadata Relations Column */}
        {structuralBacklinks.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold text-[#b45309] flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-[#b45309]" />
              Structural Metadata Relations
            </h5>
            <div className="flex flex-col gap-1.5">
              {structuralBacklinks.map((rel) => {
                if (!rel) return null;
                return (
                  <button
                    key={rel.id}
                    onClick={() => setMainWikiId(rel.id)}
                    className="flex items-center justify-between text-left px-3 py-2 bg-white hover:bg-neutral-50 border border-neutral-200/80 rounded-lg text-xs font-medium text-neutral-700 hover:text-black cursor-pointer transition-all hover:border-neutral-300 shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                      <span className="truncate">{rel.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <span className="font-mono text-[8px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded font-bold">
                        {rel.propertyName}
                      </span>
                      <ChevronRight className="w-3 h-3 text-neutral-300" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
