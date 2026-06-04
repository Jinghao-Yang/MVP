/**
 * 服务层统一导出
 * 提供所有 Service 的统一入口
 */

// 文档服务
export {
  documentService,
  getDocument,
  getAllDocuments,
  createDocument,
  updateDocumentContent,
  updateDocumentMetadata,
  deleteDocument,
  getBacklinks,
  getForwardLinks,
  updateDocumentLinks,
} from './document-service';

// 弹窗服务
export {
  openPopup,
  closePopup,
  updatePopupPosition,
  updatePopupSize,
  updatePopupPositionAndSize,
  getPopupState,
  savePopupState,
  getAllPopupStates,
  clearAllPopupStates,
} from './popup-service';
export type { PopupOpenResult } from './popup-service';

// 工作区服务
export {
  workspaceService,
  initializeWorkspace,
  loadWikiWithBacklinks,
  restorePopups,
  getWorkspaceInitializationResult,
} from './workspace-service';
export type { WorkspaceInitializationResult } from './workspace-service';
