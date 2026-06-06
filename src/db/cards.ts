import { db } from './dexie';
import type { KanbanCardEntity } from '@/types';

export async function getKanbanCards(): Promise<KanbanCardEntity[]> {
  const cards = await db.kanbanCards.toArray();
  return cards.sort((a, b) => a.order - b.order);
}

export async function addQuickCaptureNote(text: string): Promise<KanbanCardEntity[]> {
  const trimmed = text.trim();
  if (!trimmed) return await getKanbanCards();

  const newId = `c_${Date.now()}`;

  await db.transaction('rw', db.kanbanCards, async () => {
    const allCards = await db.kanbanCards.toArray();
    const fleetingCardsCount = allCards.filter((c) => c.columnId === 'fleeting').length;

    await db.kanbanCards.add({
      id: newId,
      columnId: 'fleeting',
      refId: `Z-${allCards.length + 10}`,
      title: 'Fleeting Note',
      excerpt: trimmed,
      links: 0,
      words: trimmed.split(/\s+/).length,
      timestamp: 'JUST NOW',
      colorClass: 'bg-bh-yellow',
      order: fleetingCardsCount,
    });
  });

  return await getKanbanCards();
}

export async function updateCardColumn(
  cardId: string,
  newColumnId: string
): Promise<KanbanCardEntity[]> {
  await db.transaction('rw', db.kanbanCards, async () => {
    const card = await db.kanbanCards.get(cardId);
    if (card) {
      const sameColumn = await db.kanbanCards.where({ columnId: newColumnId }).toArray();
      const maxOrder = sameColumn.reduce((max, item) => (item.order > max ? item.order : max), -1);

      await db.kanbanCards.update(cardId, {
        columnId: newColumnId,
        order: maxOrder + 1,
      });
    }
  });

  return await getKanbanCards();
}
