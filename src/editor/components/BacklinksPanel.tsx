/* ==================================================
   FILE: src/editor/components/BacklinksPanel.tsx
   ================================================== */
import { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';
import { documentService } from '@/services/document-service';
import { showErrorToast } from '@/utils/error-handler';
import { SafeText } from '@/components/SafeText';

interface BacklinksPanelProps {
  wikiId: string;
  onLinkClick: (linkId: string) => void;
}

export function BacklinksPanel({ wikiId, onLinkClick }: BacklinksPanelProps) {
  const [backlinks, setBacklinks] = useState<string[]>([]);

  useEffect(() => {
    if (wikiId) {
      documentService
        .getBacklinks(wikiId)
        .then(setBacklinks)
        .catch(() => showErrorToast('Failed to load backlinks'));
    } else {
      setBacklinks([]);
    }
  }, [wikiId]);

  return (
    <div className="border-t border-black/5 pt-6 space-y-3">
      <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
        <Link2 className="w-3.5 h-3.5 text-bh-blue" /> Linked Mentions (Backlinks)
      </h5>
      {backlinks.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {backlinks.map((linkId) => (
            <button
              key={linkId}
              onClick={() => onLinkClick(linkId)}
              className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/50 rounded-lg text-xs font-sys font-medium text-neutral-700 cursor-pointer transition-colors"
            >
              <SafeText content={linkId === 'main-editor-doc' ? 'Topology Math (Main)' : linkId} />
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
