/**
 * Kanban 相关类型定义
 * 包含 Kanban 卡片实体类型
 */

/**
 * Kanban 卡片实体类型
 * 存储在 IndexedDB 中的 Kanban 卡片数据
 */
export interface KanbanCardEntity {
  /** 卡片唯一标识符，例如: c1, c2, c3... */
  id: string;
  /** 所属列 ID: fleeting, seedling, evergreen, synthesis */
  columnId: string;
  /** 引用 ID */
  refId: string;
  /** 卡片标题 */
  title: string;
  /** 卡片摘要 */
  excerpt: string;
  /** 链接数量 */
  links: number;
  /** 字数统计 */
  words: number;
  /** 时间戳显示文本 */
  timestamp: string;
  /** 颜色样式类名 */
  colorClass: string;
  /** 同列内的卡片显示顺序 */
  order: number;
}
