import { useCallback, useRef } from 'react';
import { usePopupStore } from '@/stores/popup-store';
import { db, seedDatabase } from '@/db/dexie';
import { getDocument } from '@/db/documents';
import type { PopupData } from '@/types';
import { EDITOR } from '@/utils/constants';
import { truncateText } from '@/utils/sanitize';

export function useWorkspaceInit() {
  const setPopups = usePopupStore((state) => state.setPopups);
  const initialized = useRef(false);

  return useCallback(async () => {
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    // 统一通过 seedDatabase() 初始化数据库
    // 'main-editor-doc' 已包含在种子数据中
    await seedDatabase();

    // 从 IndexedDB 恢复所有弹窗状态
    const allPopoverStates = await db.popoverStates.toArray();
    const restoredPopups: PopupData[] = [];

    for (const popoverState of allPopoverStates) {
      const docData = await getDocument(popoverState.id);
      if (docData) {
        restoredPopups.push({
          id: popoverState.id,
          title: docData.title,
          excerpt: truncateText(docData.content, EDITOR.EXCERPT_LENGTH),
          badge: docData.badge,
          badgeClass: docData.badgeClass,
          x: popoverState.x,
          y: popoverState.y,
          width: popoverState.width,
          height: popoverState.height,
          isPinned: popoverState.isPinned ?? true,
          isMinimized: popoverState.isMinimized ?? false,
          stackIndex: 1,
          history: [popoverState.id],
          historyIndex: 0,
        });
      }
    }

    setPopups(restoredPopups);
  }, [setPopups]);
}
