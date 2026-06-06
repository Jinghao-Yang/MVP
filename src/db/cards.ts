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

  const result = await db.transaction('rw', db.kanbanCards, async () => {
    const allCards = await db.kanbanCards.toArray();
    const fleetingCardsCount = allCards.filter((c) => c.columnId === 'fleeting').length;

    const newCard: KanbanCardEntity = {
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
    };

    await db.kanbanCards.add(newCard);

    return [...allCards, newCard].sort((a, b) => a.order - b.order);
  });

  return result;
}

export async function updateCardColumn(
  cardId: string,
  newColumnId: string
): Promise<KanbanCardEntity[]> {
  const result = await db.transaction('rw', db.kanbanCards, async () => {
    const card = await db.kanbanCards.get(cardId);
    let allCards = await db.kanbanCards.toArray();

    if (card) {
      const sameColumn = allCards.filter((c) => c.columnId === newColumnId);
      const maxOrder = sameColumn.reduce((max, item) => (item.order > max ? item.order : max), -1);

      const updatedCard = { ...card, columnId: newColumnId, order: maxOrder + 1 };

      await db.kanbanCards.update(cardId, {
        columnId: newColumnId,
        order: maxOrder + 1,
      });

      allCards = allCards.map((c) => (c.id === cardId ? updatedCard : c));
    }

    return allCards.sort((a, b) => a.order - b.order);
  });

  return result;
}
