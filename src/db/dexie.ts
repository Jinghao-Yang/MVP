import Dexie, { type Table } from 'dexie';
import type {
  DocumentEntity,
  KanbanCardEntity,
  PopoverStateEntity,
  BidirectionalLinkEntity,
} from '@/types';

interface ConfigEntity {
  id: string;
  schemaVersion: number;
}

const SEED_DOCUMENTS: Omit<DocumentEntity, 'updatedAt'>[] = [
  {
    id: 'heine-borel',
    title: 'Heine–Borel Theorem',
    content: `# Heine–Borel Theorem\n\nIn metric spaces, a subset is compact iff it is [closed](compactness) and bounded. The theorem generalizes interval compactness to general Euclidean spaces.`,
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  {
    id: 'tychonoff',
    title: "Tychonoff's Theorem",
    content: `# Tychonoff's Theorem\n\nAsserts that the product of any collection of [compact](compactness) topological spaces is compact. It is equivalent to the [Axiom of Choice](axiom-of-choice).`,
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  {
    id: 'axiom-of-choice',
    title: 'Axiom of Choice',
    content: `# Axiom of Choice\n\nA foundational axiom in set theory asserting that the cartesian product of non-empty sets is non-empty. Equivalent to Zorn's Lemma.`,
    badge: 'Seedling',
    badgeClass: 'tag-badge-yellow',
  },
  {
    id: 'compactness',
    title: 'Compactness',
    content: `# Compactness\n\nA property generalizing the concept of closed and bounded subsets to general topologies. Formally: every open cover contains a finite subcover. See [Heine–Borel](heine-borel).`,
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
];

const SEED_KANBAN_CARDS: KanbanCardEntity[] = [
  {
    id: 'c1',
    columnId: 'fleeting',
    refId: 'Z-01',
    title: 'Heine–Borel origins',
    excerpt: 'Generalizing closed and bounded interval limits to general topology...',
    links: 3,
    words: 142,
    timestamp: '10:42 AM',
    colorClass: 'bg-bh-yellow',
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
    colorClass: 'bg-bh-yellow',
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
    colorClass: 'bg-bh-blue',
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
    colorClass: 'bg-bh-red',
    order: 0,
  },
];

const SEED_LINKS: Omit<BidirectionalLinkEntity, 'id'>[] = [
  { sourceId: 'heine-borel', targetId: 'compactness' },
  { sourceId: 'tychonoff', targetId: 'axiom-of-choice' },
  { sourceId: 'tychonoff', targetId: 'compactness' },
  { sourceId: 'compactness', targetId: 'heine-borel' },
];

class AxiomDatabase extends Dexie {
  documents!: Table<DocumentEntity>;
  kanbanCards!: Table<KanbanCardEntity>;
  popoverStates!: Table<PopoverStateEntity>;
  links!: Table<BidirectionalLinkEntity>;
  config!: Table<ConfigEntity>;

  constructor() {
    super('AxiomDatabase');
    this.version(2)
      .stores({
        documents: 'id, title, badge',
        kanbanCards: 'id, columnId, order',
        popoverStates: 'id',
        links: '++id, sourceId, targetId',
        config: 'id',
      })
      .upgrade(async (tx) => {
        const configTable = tx.table('config') as Table<ConfigEntity>;
        if ((await configTable.count()) === 0) {
          await configTable.add({ id: 'app-config', schemaVersion: 2 });
        }
      });

    this.version(1).stores({
      documents: 'id, title, badge',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      links: '++id, sourceId, targetId',
    });

    this.on('populate', async () => {
      await this.documents.bulkAdd(
        SEED_DOCUMENTS.map((doc) => ({ ...doc, updatedAt: Date.now() }))
      );
      await this.kanbanCards.bulkAdd(SEED_KANBAN_CARDS);
      await this.links.bulkAdd(SEED_LINKS);
      await this.config.add({ id: 'app-config', schemaVersion: 2 });
    });
  }
}

export const db = new AxiomDatabase();

export async function seedDatabase() {
  const currentConfig = await db.config.get('app-config');
  const currentSchemaVersion = currentConfig?.schemaVersion ?? 0;
  const TARGET_VERSION = 2;

  if (currentSchemaVersion >= TARGET_VERSION) {
    await ensureSeedDocuments();
    return;
  }

  await db.transaction('rw', db.documents, db.kanbanCards, db.links, db.config, async () => {
    await ensureSeedDocuments();
    await ensureSeedKanbanCards();
    await ensureSeedLinks();

    await db.config.put({ id: 'app-config', schemaVersion: TARGET_VERSION });
  });
}

async function ensureSeedDocuments() {
  for (const doc of SEED_DOCUMENTS) {
    const existing = await db.documents.get(doc.id);
    if (!existing) {
      await db.documents.add({ ...doc, updatedAt: Date.now() });
    }
  }
}

async function ensureSeedKanbanCards() {
  for (const card of SEED_KANBAN_CARDS) {
    const existing = await db.kanbanCards.get(card.id);
    if (!existing) {
      await db.kanbanCards.add(card);
    }
  }
}

async function ensureSeedLinks() {
  for (const link of SEED_LINKS) {
    const existing = await db.links
      .where('sourceId')
      .equals(link.sourceId)
      .and((l) => l.targetId === link.targetId)
      .first();
    if (!existing) {
      await db.links.add(link);
    }
  }
}
