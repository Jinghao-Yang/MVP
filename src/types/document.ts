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
