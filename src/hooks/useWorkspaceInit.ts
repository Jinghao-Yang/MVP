import { useCallback } from 'react';
import { usePopupStore } from '@/stores/popup-store';
import { db, seedDatabase } from '@/db/dexie';
import { getDocument } from '@/db/documents';
import type { PopupData } from '@/types';
import { EDITOR } from '@/utils/constants';

export function useWorkspaceInit() {
  const setPopups = usePopupStore((state) => state.setPopups);

  return useCallback(async () => {
    await seedDatabase();

    let leftDoc = await getDocument('main-editor-doc');
    if (!leftDoc) {
      leftDoc = {
        id: 'main-editor-doc',
        title: 'Topology Math',
        content: `# Compactness in topological spaces\n\nThis space maps the foundational structures of topological spaces. It bridges the intuitive notion of [closeness](compactness) without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.\n\nA topological space is a set endowed with a structure, called a topology, which allows defining continuous deformation of subspaces. Generalizing the [Heine–Borel](heine-borel) theorem requires us to move beyond Euclidean constraints.\n\nThis brings us to [Tychonoff's Theorem](tychonoff), which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.`,
        badge: 'Active Draft',
        badgeClass: 'tag-badge-blue',
        updatedAt: Date.now(),
      };
      await db.documents.add(leftDoc);
    }

    const storedMetadata = JSON.parse(localStorage.getItem('axiom-popup-storage') || '{}');
    const pinnedPopoverMetadata = storedMetadata?.state?.pinnedPopoverMetadata || [];
    const restoredPopups: PopupData[] = [];

    for (const meta of pinnedPopoverMetadata) {
      const docData = await getDocument(meta.id);
      const popoverPos = await db.popoverStates.get(meta.id);
      if (docData) {
        restoredPopups.push({
          id: meta.id,
          title: docData.title,
          excerpt: docData.content.substring(0, EDITOR.EXCERPT_LENGTH) + '...',
          badge: docData.badge,
          badgeClass: docData.badgeClass,
          x: popoverPos?.x ?? 120,
          y: popoverPos?.y ?? 120,
          width: popoverPos?.width ?? 500,
          height: popoverPos?.height ?? 320,
          isPinned: meta.isPinned,
          isMinimized: meta.isMinimized,
          depth: 1,
          history: [meta.id],
          historyIndex: 0,
        });
      }
    }

    setPopups(restoredPopups);
  }, [setPopups]);
}
