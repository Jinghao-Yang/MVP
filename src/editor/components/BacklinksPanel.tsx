/* ==================================================
   FILE: src/editor/components/BacklinksPanel.tsx
   ================================================== */
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { useUiStore } from '@/stores';
import { Link2, Network, FileText, ChevronRight } from 'lucide-react';
import { SafeText } from '@/components/SafeText';
import type { DocumentEntity, PropertyEntity } from '@/types';

interface BacklinksPanelProps {
  wikiId: string;
  onLinkClick?: (linkId: string) => void;
  variant?: 'simple' | 'detailed';
}

export function BacklinksPanel({ wikiId, onLinkClick, variant = 'detailed' }: BacklinksPanelProps) {
  const setMainWikiId = useUiStore((state) => state.setMainWikiId);

  // 1. Fetch inline wikilinks that point to the active document
  const inlineLinks = useLiveQuery(
    () => db.links.where('targetId').equals(wikiId).toArray(),
    [wikiId]
  );

  // 2. Fetch structural relations that point to the active document
  const structuralRelations = useLiveQuery(
    () => db.relations.where('targetId').equals(wikiId).toArray(),
    [wikiId]
  );

  // 3. Only fetch the specific documents we need instead of all documents
  const sourceDocIds = [
    ...(inlineLinks || []).map((l) => l.sourceId),
    ...(structuralRelations || []).map((r) => r.sourceId),
  ];

  const sourceDocuments = useLiveQuery(async () => {
    if (sourceDocIds.length === 0) return [];
    const uniqueIds = [...new Set(sourceDocIds)];
    const docs = await Promise.all(uniqueIds.map((id) => db.documents.get(id)));
    return docs.filter(Boolean) as DocumentEntity[];
  }, [sourceDocIds]);

  // Only fetch the specific properties we need
  const propIds = (structuralRelations || []).map((r) => r.propId);
  const relevantProperties = useLiveQuery(async () => {
    if (propIds.length === 0) return [];
    const uniquePropIds = [...new Set(propIds)];
    const props = await Promise.all(uniquePropIds.map((id) => db.properties.get(id)));
    return props.filter(Boolean) as PropertyEntity[];
  }, [propIds]);

  if (!wikiId) return null;

  // Create quick lookup maps
  const docMap = (sourceDocuments || []).reduce(
    (map, doc) => {
      map[doc.id] = doc;
      return map;
    },
    {} as Record<string, DocumentEntity>
  );

  const propMap = (relevantProperties || []).reduce(
    (map, prop) => {
      map[prop.id] = prop;
      return map;
    },
    {} as Record<string, PropertyEntity>
  );

  // Build list of valid inline backlinks with document metadata
  const inlineBacklinks = (inlineLinks || [])
    .map((link) => {
      const sourceDoc = docMap[link.sourceId];
      return sourceDoc
        ? { id: sourceDoc.id, title: sourceDoc.title, typeId: sourceDoc.typeId }
        : null;
    })
    .filter(Boolean);

  // Build list of valid structural back-relations with property mappings
  const structuralBacklinks = (structuralRelations || [])
    .map((rel) => {
      const sourceDoc = docMap[rel.sourceId];
      const prop = propMap[rel.propId];
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

  const handleLinkClick = (id: string) => {
    if (onLinkClick) {
      onLinkClick(id);
    } else {
      setMainWikiId(id);
    }
  };

  // Render SIMPLE variant (compact button rows for popups/sidebar/etc)
  if (variant === 'simple') {
    const list = (inlineLinks || []).map((l) => l.sourceId);
    return (
      <div className="border-t border-black/5 pt-6 space-y-3">
        <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-bh-blue" /> Linked Mentions (Backlinks)
        </h5>
        {list.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {list.map((linkId) => (
              <button
                key={linkId}
                onClick={() => handleLinkClick(linkId)}
                className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/50 rounded-lg text-xs font-sys font-medium text-neutral-700 cursor-pointer transition-colors"
              >
                <SafeText
                  content={linkId === 'main-editor-doc' ? 'Topology Math (Main)' : linkId}
                />
              </button>
            ))}
          </div>
        ) : (
          <span className="font-mono text-[9px] uppercase text-neutral-400 italic block">
            No backward linkages mapped.
          </span>
        )}
      </div>
    );
  }

  // Render DETAILED variant (rich grouped layout)
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
                    onClick={() => handleLinkClick(link.id)}
                    className="flex items-center justify-between text-left px-3 py-2 bg-white hover:bg-neutral-50 border border-neutral-200/80 rounded-lg text-xs font-medium text-neutral-700 hover:text-black cursor-pointer transition-all hover:border-neutral-300 shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">
                        <SafeText content={link.title} />
                      </span>
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
                    onClick={() => handleLinkClick(rel.id)}
                    className="flex items-center justify-between text-left px-3 py-2 bg-white hover:bg-neutral-50 border border-neutral-200/80 rounded-lg text-xs font-medium text-neutral-700 hover:text-black cursor-pointer transition-all hover:border-neutral-300 shadow-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-3.5 h-3.5 text-amber-500/80 shrink-0" />
                      <span className="truncate">
                        <SafeText content={rel.title} />
                      </span>
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
