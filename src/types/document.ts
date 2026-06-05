/**
 * 文档相关类型定义
 * 包含文档实体、Wiki 条目等类型
 */

/**
 * 文档实体类型
 * 存储在 IndexedDB 中的文档数据结构
 */
export interface DocumentEntity {
  /** 文档唯一标识符，例如: 'heine-borel', 'tychonoff', 'today', 'compactness' */
  id: string;
  /** 对象类型 ID */
  typeId?: string;
  /** 文档标题 */
  title: string;
  /** 文档内容（Markdown 格式） */
  content: string;
  /** 文档标签名称 */
  badge: string;
  /** 文档标签样式类名 */
  badgeClass: string;
  /** 最后更新时间戳 */
  updatedAt: number;
}

/**
 * 对象类型定义 (如 'Book', 'Project', 'Person')
 */
export interface ObjectTypeEntity {
  id: string;
  name: string;
  icon?: string;
}

/**
 * 属性定义 (如 'status', 'author')
 */
export interface PropertyEntity {
  id: string;
  typeId: string;
  name: string;
  dataType: 'text' | 'number' | 'date' | 'relation';
}

/**
 * 文档属性值 (KV 存储)
 */
export interface DocPropertyEntity {
  docId: string;
  propId: string;
  value: string;
}

/**
 * 结构化关系 (强类型反链)
 */
export interface RelationEntity {
  sourceId: string;
  propId: string;
  targetId: string;
}

/**
 * 扁平标签
 */
export interface TagEntity {
  docId: string;
  tag: string;
}

/**
 * 附件信息表
 */
export interface AssetEntity {
  id: string;
  filename: string;
  mimeType: string;
}

/**
 * Wiki 条目类型
 * 用于 Wiki 数据库中的单个条目
 */
export interface WikiEntry {
  /** 条目标题 */
  title: string;
  /** 条目摘要 */
  excerpt: string;
  /** 条目标签名称 */
  badge: string;
  /** 条目标签样式类名 */
  badgeClass: string;
}

/**
 * Wiki 数据库类型
 * 以 wikiId 为键，WikiEntry 为值的映射对象
 */
export type WikiDb = Record<string, WikiEntry>;

/**
 * 双向链接实体类型
 * 用于存储文档之间的双向链接关系
 */
export interface BidirectionalLinkEntity {
  /** 链接 ID（自增） */
  id?: number;
  /** 源文档 ID */
  sourceId: string;
  /** 目标文档 ID */
  targetId: string;
}
