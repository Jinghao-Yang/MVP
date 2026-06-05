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
