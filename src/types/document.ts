/**
 * Document-related type definitions
 * Contains document entities, Wiki entries, and other types
 */

/**
 * Property value types for semantic node metadata
 * Supports primitive types, arrays, and nested objects
 */
export type PropertyValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | PropertyValue[]
  | { [key: string]: PropertyValue };

/**
 * Semantic node index (no content, no offset)
 * It is merely a stable pointer to a specific file and metadata cache
 */
export interface SemanticNode {
  id: string; // Unique Block ID (e.g., 'thm-hb')
  docId: string; // ID of the parent Document
  type: string; // User-defined type (e.g., 'theorem', 'person', 'definition')
  title: string; // Node title for quick list rendering
  properties: Record<string, PropertyValue>; // Flat metadata, e.g., { status: 'evergreen' }
  references: string[]; // 100% stable UUID array, never broken
}

/**
 * Document entity type
 * The most original and complete Markdown string stored in IndexedDB (SSOT)
 */
export interface DocumentEntity {
  /** Unique document identifier, e.g.: 'heine-borel', 'tychonoff', 'today', 'compactness' */
  id: string;
  /** Object type ID */
  typeId?: string;
  /** Document title */
  title: string;
  /** Document content (Markdown format) */
  content: string;
  /** Document badge name */
  badge: string;
  /** Document badge style class name */
  badgeClass: string;
  /** Last update timestamp */
  updatedAt: number;
}

/**
 * Object type definition (e.g., 'Book', 'Project', 'Person')
 */
export interface ObjectTypeEntity {
  id: string;
  name: string;
  icon?: string;
}

/**
 * Property definition (e.g., 'status', 'author')
 */
export interface PropertyEntity {
  id: string;
  typeId: string;
  name: string;
  dataType: 'text' | 'number' | 'date' | 'relation';
}

/**
 * Document property value (KV storage)
 */
export interface DocPropertyEntity {
  docId: string;
  propId: string;
  value: string;
}

/**
 * Structured relationship (strongly typed backlink)
 */
export interface RelationEntity {
  sourceId: string;
  propId: string;
  targetId: string;
}

/**
 * Flat tags
 */
export interface TagEntity {
  docId: string;
  tag: string;
  start: number;
  end: number;
}

/**
 * Attachment information table
 */
export interface AssetEntity {
  id: string;
  filename: string;
  mimeType: string;
}

/**
 * Wiki entry type
 * Used for individual entries in the Wiki database
 */
export interface WikiEntry {
  /** Entry title */
  title: string;
  /** Entry excerpt */
  excerpt: string;
  /** Entry badge name */
  badge: string;
  /** Entry badge style class name */
  badgeClass: string;
}

/**
 * Wiki database type
 * Mapping with wikiId as key and WikiEntry as value
 */
export type WikiDb = Record<string, WikiEntry>;

/**
 * Bidirectional link entity type
 * Used to store bidirectional link relationships between documents
 */
export interface BidirectionalLinkEntity {
  /** Link ID (auto-increment) */
  id?: number;
  /** Source document ID */
  sourceId: string;
  /** Target document ID */
  targetId: string;
  start: number;
  end: number;
}
