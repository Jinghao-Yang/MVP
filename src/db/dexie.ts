import Dexie, { type Table } from 'dexie';
import type {
  DocumentEntity,
  KanbanCardEntity,
  PopoverStateEntity,
  BidirectionalLinkEntity,
  ObjectTypeEntity,
  PropertyEntity,
  DocPropertyEntity,
  RelationEntity,
  TagEntity,
  AssetEntity,
  SemanticNode,
  InlineTaskEntity,
} from '@/types';

interface ConfigEntity {
  id: string;
  schemaVersion: number;
}

/**
 * Migration function type
 */
type MigrationFunction = (db: AxiomDatabase) => Promise<void>;

/**
 * Migration definition
 */
interface Migration {
  version: number;
  description: string;
  migrate: MigrationFunction;
}

const SEED_DOCUMENTS: Omit<DocumentEntity, 'updatedAt'>[] = [
  {
    id: 'main-editor-doc',
    typeId: 'page',
    title: 'Topology Math',
    content: `# Compactness in topological spaces\n\nThis space maps the foundational structures of topological spaces. It bridges the intuitive notion of [closeness](compactness) without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.\n\nA topological space is a set endowed with a structure, called a topology, which allows defining continuous deformation of subspaces. Generalizing the [Heine–Borel](heine-borel) theorem requires us to move beyond Euclidean constraints.\n\nThis brings us to [Tychonoff's Theorem](tychonoff), which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.`,
    badge: 'Active Draft',
    badgeClass: 'tag-badge-blue',
  },
  {
    id: 'heine-borel',
    typeId: 'page',
    title: 'Heine–Borel Theorem',
    content: `# Heine–Borel Theorem\n\nIn metric spaces, a subset is compact iff it is [closed](compactness) and bounded. The theorem generalizes interval compactness to general Euclidean spaces.`,
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  {
    id: 'tychonoff',
    typeId: 'page',
    title: "Tychonoff's Theorem",
    content: `# Tychonoff's Theorem\n\nAsserts that the product of any collection of [compact](compactness) topological spaces is compact. It is equivalent to the [Axiom of Choice](axiom-of-choice).`,
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  {
    id: 'axiom-of-choice',
    typeId: 'page',
    title: 'Axiom of Choice',
    content: `# Axiom of Choice\n\nA foundational axiom in set theory asserting that the cartesian product of non-empty sets is non-empty. Equivalent to Zorn's Lemma.`,
    badge: 'Seedling',
    badgeClass: 'tag-badge-yellow',
  },
  {
    id: 'compactness',
    typeId: 'page',
    title: 'Compactness',
    content: `# Compactness\n\nA property generalizing the concept of closed and bounded subsets to general topologies. Formally: every open cover contains a finite subcover. See [Heine–Borel](heine-borel).`,
    badge: 'Evergreen',
    badgeClass: 'tag-badge-green',
  },
  // Seed custom Person and Book documents for capacities demo
  {
    id: 'john-doe',
    typeId: 'person',
    title: 'John Doe',
    content: `# John Doe\n\nJohn is a prominent researcher in algebraic topology and founder of Topology Labs. He suggested reading [[topology-basics]] for beginners.`,
    badge: 'Person',
    badgeClass: 'tag-badge-blue',
  },
  {
    id: 'topology-basics',
    typeId: 'book',
    title: 'Topology Basics',
    content: `# Topology Basics\n\nA comprehensive monograph analyzing point-set structures. Highly recommended by [[john-doe]].`,
    badge: 'Book',
    badgeClass: 'tag-badge-yellow',
  },
  {
    id: 'task-proof-hb',
    typeId: 'task',
    title: 'Draft proof of Heine-Borel',
    content: `# Draft proof of Heine-Borel\n\nShow that any closed and bounded interval in R is compact.\n\n- [ ] List all finite subcovers @2026-06-08\n- [x] Unify intervals`,
    badge: 'Task',
    badgeClass: 'tag-badge-yellow',
  },
  {
    id: 'task-colloquium',
    typeId: 'task',
    title: 'Prepare Topology Seminar Slides',
    content: `# Prepare Topology Seminar Slides\n\nOutline the product topology compactness theorem [Tychonoff](tychonoff).\n\n- [ ] Reference the Axiom of Choice @2026-06-12 !High\n- [ ] Render commutative diagrams`,
    badge: 'Task',
    badgeClass: 'tag-badge-blue',
  },
  {
    id: 'focus-today',
    typeId: 'page',
    title: 'Focus Today',
    content: `# Focus Today\n\nDaily workspace focus view.\n\n- [ ] Research Heine-Borel theorem\n- [ ] Draft proof of Heine-Borel\n- [ ] Build Axiom Planner @2026-06-06 !High`,
    badge: 'Active Today',
    badgeClass: 'tag-badge-red',
  },
  {
    id: 'recent-flow',
    typeId: 'note',
    title: 'Recent Flow',
    content: `# Recent Flow\n\nNotes tracking active streams, bidirectional connections, and recently updated cards in the workspace context.`,
    badge: 'Recent',
    badgeClass: 'tag-badge-blue',
  },
  {
    id: 'system-design',
    typeId: 'page',
    title: 'System Design Space',
    content: `# System Design Space\n\nSystem topology bounds and core architecture parameters.`,
    badge: 'Workspace',
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
  { sourceId: 'heine-borel', targetId: 'compactness', start: 0, end: 1 },
  { sourceId: 'tychonoff', targetId: 'axiom-of-choice', start: 0, end: 1 },
  { sourceId: 'tychonoff', targetId: 'compactness', start: 0, end: 1 },
  { sourceId: 'compactness', targetId: 'heine-borel', start: 0, end: 1 },
  { sourceId: 'john-doe', targetId: 'topology-basics', start: 0, end: 1 },
  { sourceId: 'topology-basics', targetId: 'john-doe', start: 0, end: 1 },
];

/**
 * Migration registry
 * Add new migrations here when schema changes
 */
const MIGRATIONS: Migration[] = [
  {
    version: 5,
    description: 'Add position tracking (start, end) for links and tags',
    migrate: async (db: AxiomDatabase) => {
      // Migrate links: add default start and end positions
      const links = await db.links.toArray();
      for (const link of links) {
        if (link.start === undefined || link.end === undefined) {
          await db.links.update(link, {
            start: link.start ?? 0,
            end: link.end ?? 1,
          });
        }
      }

      // Migrate tags: add default start and end positions
      const tags = await db.tags.toArray();
      for (const tag of tags) {
        if (tag.start === undefined || tag.end === undefined) {
          await db.tags.update(tag, {
            start: tag.start ?? 0,
            end: tag.end ?? 1,
          });
        }
      }
    },
  },
];

class AxiomDatabase extends Dexie {
  documents!: Table<DocumentEntity>;
  kanbanCards!: Table<KanbanCardEntity>;
  popoverStates!: Table<PopoverStateEntity>;
  links!: Table<BidirectionalLinkEntity>;
  config!: Table<ConfigEntity>;
  objectTypes!: Table<ObjectTypeEntity>;
  properties!: Table<PropertyEntity>;
  docProperties!: Table<DocPropertyEntity>;
  relations!: Table<RelationEntity>;
  tags!: Table<TagEntity>;
  assets!: Table<AssetEntity>;
  semanticNodes!: Table<SemanticNode>;
  inlineTasks!: Table<InlineTaskEntity>;

  constructor() {
    super('AxiomDatabase');

    // Version 6: Add inlineTasks table
    this.version(6).stores({
      documents: 'id, typeId, title, updatedAt',
      objectTypes: 'id, name',
      properties: 'id, typeId, name, dataType',
      docProperties: '[docId+propId], docId',
      relations: '[sourceId+propId+targetId], targetId, sourceId',
      links: '[sourceId+targetId], targetId, sourceId, start, end',
      tags: '[docId+tag], docId, tag, start, end',
      assets: 'id, filename, mimeType',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      config: 'id',
      inlineTasks: 'id, docId, completed, date',
    });

    // Version 5: Add position tracking for links and tags
    this.version(5).stores({
      documents: 'id, typeId, title, updatedAt',
      objectTypes: 'id, name',
      properties: 'id, typeId, name, dataType',
      docProperties: '[docId+propId], docId',
      relations: '[sourceId+propId+targetId], targetId, sourceId',
      links: '[sourceId+targetId], targetId, sourceId, start, end',
      tags: '[docId+tag], docId, tag, start, end',
      assets: 'id, filename, mimeType',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      config: 'id',
    });

    // Version 4: Normalized Schema with Object Types, Properties, and Relations
    this.version(4).stores({
      documents: 'id, typeId, title, updatedAt',
      objectTypes: 'id, name',
      properties: 'id, typeId, name, dataType',
      docProperties: '[docId+propId], docId',
      relations: '[sourceId+propId+targetId], targetId, sourceId',
      links: '[sourceId+targetId], targetId, sourceId',
      tags: '[docId+tag], docId, tag',
      assets: 'id, filename, mimeType',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      config: 'id',
    });

    this.version(3).stores({
      documents: 'id, title, badge, updatedAt',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      links: '++id, sourceId, targetId',
      config: 'id',
    });

    this.version(2).stores({
      documents: 'id, title, badge, updatedAt',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      links: '++id, sourceId, targetId',
      config: 'id',
    });

    this.version(1).stores({
      documents: 'id, title, badge',
      kanbanCards: 'id, columnId, order',
      popoverStates: 'id',
      links: '++id, sourceId, targetId',
    });
  }
}

export const db = new AxiomDatabase();

/**
 * Run migrations from current version to target version
 */
async function runMigrations(currentVersion: number, targetVersion: number): Promise<void> {
  const migrationsToRun = MIGRATIONS.filter(
    (m) => m.version > currentVersion && m.version <= targetVersion
  ).sort((a, b) => a.version - b.version);

  for (const migration of migrationsToRun) {
    console.log(`Running migration v${migration.version}: ${migration.description}`);
    await migration.migrate(db);
    await db.config.put({ id: 'app-config', schemaVersion: migration.version });
    console.log(`Migration v${migration.version} completed`);
  }
}

export async function seedDatabase() {
  try {
    await db.open();
  } catch (err) {
    console.error('Failed to open database:', err);
    throw err;
  }

  const currentConfig = await db.config.get('app-config');
  const currentSchemaVersion = currentConfig?.schemaVersion ?? 0;
  const TARGET_VERSION = 6;

  // Run migrations if needed
  if (currentSchemaVersion < TARGET_VERSION) {
    await db.transaction(
      'rw',
      [
        db.documents,
        db.kanbanCards,
        db.links,
        db.config,
        db.objectTypes,
        db.properties,
        db.docProperties,
        db.relations,
        db.tags,
        db.inlineTasks,
      ],
      async () => {
        await runMigrations(currentSchemaVersion, TARGET_VERSION);
      }
    );
  }

  // Conditional initialization for new databases
  if (currentSchemaVersion === 0) {
    await initializeDatabase();
  } else {
    // Ensure seed data exists even for migrated databases
    await ensureSeedDocuments();
    await ensureTaskObjectType();
  }
}

/**
 * Initialize a new database with seed data
 */
async function initializeDatabase(): Promise<void> {
  await db.transaction(
    'rw',
    [
      db.documents,
      db.kanbanCards,
      db.links,
      db.config,
      db.objectTypes,
      db.properties,
      db.docProperties,
      db.relations,
      db.tags,
      db.inlineTasks,
    ],
    async () => {
      // 1. Seed Object Types
      await db.objectTypes.bulkPut([
        { id: 'page', name: 'Page' },
        { id: 'note', name: 'Notes' },
        { id: 'person', name: 'Person' },
        { id: 'project', name: 'Project' },
        { id: 'book', name: 'Book' },
        { id: 'task', name: 'Task' },
      ]);

      // 2. Seed Properties
      await db.properties.bulkPut([
        // Page properties
        { id: 'prop-page-status', typeId: 'page', name: 'Status', dataType: 'text' },
        // Person properties
        { id: 'prop-person-email', typeId: 'person', name: 'Email', dataType: 'text' },
        { id: 'prop-person-company', typeId: 'person', name: 'Company', dataType: 'text' },
        // Project properties
        { id: 'prop-proj-status', typeId: 'project', name: 'Status', dataType: 'text' },
        { id: 'prop-proj-duedate', typeId: 'project', name: 'Due Date', dataType: 'date' },
        { id: 'prop-proj-owner', typeId: 'project', name: 'Owner', dataType: 'relation' },
        // Book properties
        { id: 'prop-book-author', typeId: 'book', name: 'Author', dataType: 'relation' },
        { id: 'prop-book-status', typeId: 'book', name: 'Reading Status', dataType: 'text' },
        { id: 'prop-book-rating', typeId: 'book', name: 'Rating (1-5)', dataType: 'number' },
        // Task properties
        { id: 'prop-task-status', typeId: 'task', name: 'Status', dataType: 'text' },
        { id: 'prop-task-duedate', typeId: 'task', name: 'Due Date', dataType: 'date' },
        { id: 'prop-task-priority', typeId: 'task', name: 'Priority', dataType: 'text' },
      ]);

      await ensureSeedDocuments();
      await ensureSeedKanbanCards();
      await ensureSeedLinks();

      // 3. Seed default doc properties
      await db.docProperties.bulkPut([
        { docId: 'john-doe', propId: 'prop-person-email', value: 'john@topologylabs.com' },
        { docId: 'john-doe', propId: 'prop-person-company', value: 'Topology Labs' },
        { docId: 'topology-basics', propId: 'prop-book-status', value: 'Completed' },
        { docId: 'topology-basics', propId: 'prop-book-rating', value: '5' },
        // Task 1
        { docId: 'task-proof-hb', propId: 'prop-task-status', value: 'Todo' },
        { docId: 'task-proof-hb', propId: 'prop-task-duedate', value: '2026-06-10' },
        { docId: 'task-proof-hb', propId: 'prop-task-priority', value: 'High' },
        // Task 2
        { docId: 'task-colloquium', propId: 'prop-task-status', value: 'In Progress' },
        { docId: 'task-colloquium', propId: 'prop-task-duedate', value: '2026-06-15' },
        { docId: 'task-colloquium', propId: 'prop-task-priority', value: 'Medium' },
      ]);

      // 4. Seed relations
      await db.relations.bulkPut([
        { sourceId: 'topology-basics', propId: 'prop-book-author', targetId: 'john-doe' },
      ]);

      await db.config.put({ id: 'app-config', schemaVersion: 6 });
    }
  );
}

async function ensureSeedDocuments() {
  for (const doc of SEED_DOCUMENTS) {
    const existing = await db.documents.get(doc.id);
    if (!existing) {
      await db.documents.add({ ...doc, updatedAt: Date.now() });
    } else if (!existing.typeId) {
      // Migrate older models lacking `typeId`
      await db.documents.update(doc.id, { typeId: doc.typeId || 'page' });
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
      await db.links.add({
        ...link,
        start: 0,
        end: 1,
      });
    }
  }
}

async function ensureTaskObjectType() {
  const taskType = await db.objectTypes.get('task');
  if (!taskType) {
    await db.objectTypes.put({ id: 'task', name: 'Task' });
    await db.properties.bulkPut([
      { id: 'prop-task-status', typeId: 'task', name: 'Status', dataType: 'text' },
      { id: 'prop-task-duedate', typeId: 'task', name: 'Due Date', dataType: 'date' },
      { id: 'prop-task-priority', typeId: 'task', name: 'Priority', dataType: 'text' },
    ]);
  }
  // Ensure default task properties are set up on the documents
  const p1 = await db.docProperties.get({ docId: 'task-proof-hb', propId: 'prop-task-status' });
  if (!p1) {
    await db.docProperties.bulkPut([
      { docId: 'task-proof-hb', propId: 'prop-task-status', value: 'Todo' },
      { docId: 'task-proof-hb', propId: 'prop-task-duedate', value: '2026-06-10' },
      { docId: 'task-proof-hb', propId: 'prop-task-priority', value: 'High' },
      { docId: 'task-colloquium', propId: 'prop-task-status', value: 'In Progress' },
      { docId: 'task-colloquium', propId: 'prop-task-duedate', value: '2026-06-15' },
      { docId: 'task-colloquium', propId: 'prop-task-priority', value: 'Medium' },
    ]);
  }
}
