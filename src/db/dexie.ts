import Dexie, { type Table } from 'dexie';
import type {
  DocumentEntity,
  KanbanCardEntity,
  PopoverStateEntity,
  BidirectionalLinkEntity,
} from '@/types';

class AxiomDatabase extends Dexie {
  documents!: Table<DocumentEntity>;
  kanbanCards!: Table<KanbanCardEntity>;
  popoverStates!: Table<PopoverStateEntity>;
  links!: Table<BidirectionalLinkEntity>;

  constructor() {
    super('AxiomDatabase');
    this.version(1).stores({
      documents: 'id, title, badge',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      links: '++id, sourceId, targetId',
    });
  }
}

export const db = new AxiomDatabase();

// 工作区空白时的预填充种子函数
export async function seedDatabase() {
  const docCount = await db.documents.count();
  if (docCount === 0) {
    await db.documents.bulkAdd([
      {
        id: 'heine-borel',
        title: 'Heine–Borel Theorem',
        content: `# Heine–Borel Theorem\n\nIn metric spaces, a subset is compact iff it is [closed](compactness) and bounded. The theorem generalizes interval compactness to general Euclidean spaces.`,
        badge: 'Evergreen',
        badgeClass: 'tag-badge-green',
        updatedAt: Date.now(),
      },
      {
        id: 'tychonoff',
        title: "Tychonoff's Theorem",
        content: `# Tychonoff's Theorem\n\nAsserts that the product of any collection of [compact](compactness) topological spaces is compact. It is equivalent to the [Axiom of Choice](axiom-of-choice).`,
        badge: 'Evergreen',
        badgeClass: 'tag-badge-green',
        updatedAt: Date.now(),
      },
      {
        id: 'axiom-of-choice',
        title: 'Axiom of Choice',
        content: `# Axiom of Choice\n\nA foundational axiom in set theory asserting that the cartesian product of non-empty sets is non-empty. Equivalent to Zorn's Lemma.`,
        badge: 'Seedling',
        badgeClass: 'tag-badge-yellow',
        updatedAt: Date.now(),
      },
      {
        id: 'compactness',
        title: 'Compactness',
        content: `# Compactness\n\nA property generalizing the concept of closed and bounded subsets to general topologies. Formally: every open cover contains a finite subcover. See [Heine–Borel](heine-borel).`,
        badge: 'Evergreen',
        badgeClass: 'tag-badge-green',
        updatedAt: Date.now(),
      },
    ]);

    await db.kanbanCards.bulkAdd([
      {
        id: 'c1',
        columnId: 'fleeting',
        refId: 'Z-01',
        title: 'Heine–Borel origins',
        excerpt: 'Generalizing closed and bounded interval limits to general topology...',
        links: 3,
        words: 142,
        timestamp: '10:42 AM',
        colorClass: 'bg-[var(--bh-yellow)]',
        order: 0,
      },
      {
        id: 'c2',
        columnId: 'fleeting',
        refId: 'Z-02',
        title: 'Non-Hausdorff products',
        excerpt: 'Infinite products that violate separate neighborhood separation constraints...',
        links: 1,
        words: 89,
        timestamp: 'YESTERDAY',
        colorClass: 'bg-[var(--bh-yellow)]',
        order: 1,
      },
      {
        id: 'c3',
        columnId: 'seedling',
        refId: 'Z-03',
        title: 'Compactness ↔ sequential',
        excerpt: 'Equivalence thresholds in metric spaces and sequential subcovers...',
        links: 4,
        words: 340,
        timestamp: 'MAY 18',
        colorClass: 'bg-[var(--bh-blue)]',
        order: 0,
      },
      {
        id: 'c4',
        columnId: 'evergreen',
        refId: 'Z-04',
        title: 'Lemma 2.4: finite subcover',
        excerpt:
          'Deep proof structure of nested spaces using axiom properties. Relies heavily on the choice function mapping.',
        links: 8,
        words: 1205,
        timestamp: 'MAY 12',
        colorClass: 'bg-[var(--bh-red)]',
        order: 0,
      },
    ]);

    await db.links.bulkAdd([
      { sourceId: 'heine-borel', targetId: 'compactness' },
      { sourceId: 'tychonoff', targetId: 'axiom-of-choice' },
      { sourceId: 'tychonoff', targetId: 'compactness' },
      { sourceId: 'compactness', targetId: 'heine-borel' },
    ]);
  }
}
