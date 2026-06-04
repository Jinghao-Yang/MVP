import { db } from './dexie';
import type { KanbanCardEntity } from '@/types';

// 顺序排列，在页面中恢复拖拽后的原始保存序列
export async function getKanbanCards(): Promise<KanbanCardEntity[]> {
  const cards = await db.kanbanCards.toArray();
  return cards.sort((a, b) => a.order - b.order);
}

// 将闪念整理并做成一张临时的 Fleeting Card 卡片，无缝充实看报数据库
export async function addQuickCaptureNote(text: string): Promise<KanbanCardEntity[]> {
  const trimmed = text.trim();
  if (!trimmed) return await getKanbanCards();

  const allCards = await db.kanbanCards.toArray();
  const fleetingCardsCount = allCards.filter((c) => c.columnId === 'fleeting').length;
  const newId = `c_${Date.now()}`;

  await db.kanbanCards.add({
    id: newId,
    columnId: 'fleeting',
    refId: `Z-${allCards.length + 10}`,
    title: 'Fleeting Note',
    excerpt: trimmed,
    links: 0,
    words: trimmed.split(/\s+/).length,
    timestamp: 'JUST NOW',
    colorClass: 'bg-[var(--bh-yellow)]',
    order: fleetingCardsCount,
  });

  return await getKanbanCards();
}

// 更改卡片在列间的位置，并在所属列末尾自动排队
export async function updateCardColumn(
  cardId: string,
  newColumnId: string
): Promise<KanbanCardEntity[]> {
  const card = await db.kanbanCards.get(cardId);
  if (card) {
    const sameColumn = await db.kanbanCards.where({ columnId: newColumnId }).toArray();
    const maxOrder = sameColumn.reduce((max, item) => (item.order > max ? item.order : max), -1);

    await db.kanbanCards.update(cardId, {
      columnId: newColumnId,
      order: maxOrder + 1,
    });
  }
  return await getKanbanCards();
}
