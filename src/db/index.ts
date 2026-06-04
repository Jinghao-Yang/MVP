/**
 * 数据库模块统一导出
 * 提供所有数据库操作的统一入口
 */

// 数据库实例和初始化
export { db, seedDatabase } from './dexie';

// 文档操作
export {
  getDocument,
  getAllDocuments,
  createDocument,
  updateDocumentContent,
  updateDocumentMetadata,
  deleteDocument,
  getBacklinks,
} from './documents';

// 双向链接操作
export { updateDocumentLinks, getForwardLinks, getAllLinks, deleteDocumentLinks } from './links';

// Kanban 卡片操作
export { getKanbanCards, addQuickCaptureNote, updateCardColumn } from './cards';

// 弹窗状态持久化
export {
  getPopoverState,
  savePopoverState,
  updatePopoverPosition,
  updatePopoverSize,
  updatePopoverPositionAndSize,
  deletePopoverState,
  getAllPopoverStates,
  clearAllPopoverStates,
} from './popovers';

// 类型导出（从 @/types 重新导出，保持向后兼容）
export type {
  DocumentEntity,
  KanbanCardEntity,
  PopoverStateEntity,
  BidirectionalLinkEntity,
} from '@/types';
