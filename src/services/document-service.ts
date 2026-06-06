/**
 * 文档服务层
 * 封装文档的 CRUD 操作和链接查询逻辑
 * 提供更高层次的抽象，可添加业务逻辑如缓存、验证等
 */

import * as documentsDb from '@/db/documents';
import * as linksDb from '@/db/links';
import type { DocumentEntity } from '@/types';
import {
  showErrorToast,
  showInfoToast,
  showWarningToast,
  withRetry,
  setUnsavedChanges,
} from '@/utils/error-handler';
import { DOCUMENT } from '@/utils/constants';

/**
 * 显示内容大小警告
 */
const showContentSizeWarning = () => {
  showInfoToast(
    `Document size exceeded ${DOCUMENT.MAX_DOCUMENT_SIZE.toLocaleString()} characters. Please reduce content.`
  );
};

/**
 * 文档服务
 * 提供文档和链接相关的业务操作
 */
export const documentService = {
  /**
   * 获取指定 ID 的文档
   *
   * @param id - 文档 ID
   * @returns 文档实体或 undefined（文档不存在或查询失败时）
   *
   * @remarks
   * - 查询失败时会显示错误提示并返回 undefined
   */
  async getDocument(id: string): Promise<DocumentEntity | undefined> {
    try {
      return await withRetry(() => documentsDb.getDocument(id), {
        maxRetries: 2,
        shouldRetry: (error, attempt) => {
          console.warn(`Retrying getDocument (attempt ${attempt + 1}):`, error);
          return true;
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to load document', {
        description: message,
      });
      return undefined;
    }
  },

  /**
   * 获取所有文档
   *
   * @returns 所有文档实体数组，查询失败时返回空数组
   *
   * @remarks
   * - 查询失败时会显示错误提示并返回空数组
   */
  async getAllDocuments(): Promise<DocumentEntity[]> {
    try {
      return await withRetry(() => documentsDb.getAllDocuments(), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to load documents', {
        description: message,
      });
      return [];
    }
  },

  /**
   * 创建新文档
   *
   * @param document - 文档实体对象
   * @throws 如果文档 ID 或 title 缺失时抛出错误
   *
   * @remarks
   * - 文档 ID 和 title 为必填字段
   * - 创建失败时会显示错误提示并重新抛出错误
   */
  async createDocument(document: DocumentEntity): Promise<void> {
    try {
      if (!document.id) {
        throw new Error('Document ID is required');
      }
      if (!document.title) {
        throw new Error('Document title is required');
      }
      await withRetry(() => documentsDb.createDocument(document), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to create document', {
        description: message,
      });
      throw error;
    }
  },

  /**
   * 更新文档内容
   * 同时自动更新文档的双向链接关系
   *
   * @param id - 文档 ID
   * @param content - 新的文档内容（Markdown 格式）
   * @throws 如果文档不存在或内容超过大小限制时抛出错误
   *
   * @remarks
   * - 内容大小限制为 DOCUMENT.MAX_DOCUMENT_SIZE 字符
   * - 超过限制时会显示警告提示
   * - 更新失败时会显示错误提示并重新抛出错误
   */
  async updateDocumentContent(id: string, content: string): Promise<void> {
    try {
      if (content.length > DOCUMENT.MAX_DOCUMENT_SIZE) {
        showContentSizeWarning();
        throw new Error(
          `Document content exceeds ${DOCUMENT.MAX_DOCUMENT_SIZE.toLocaleString()} characters`
        );
      }

      const doc = await documentsDb.getDocument(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }

      await withRetry(() => documentsDb.updateDocumentContent(id, content), {
        maxRetries: 3,
        shouldRetry: (error, attempt) => {
          showWarningToast(`Save failed, retrying... (${attempt + 1}/3)`);
          return true;
        },
      });

      setUnsavedChanges(false);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('exceeds'))) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        showErrorToast('Failed to save document', {
          description: message,
          duration: 8000,
        });
        setUnsavedChanges(true);
      }
      throw error;
    }
  },

  /**
   * 更新文档元数据
   *
   * @param id - 文档 ID
   * @param metadata - 要更新的元数据字段（title、badge、badgeClass）
   * @throws 如果文档不存在时抛出错误
   *
   * @remarks
   * - 仅更新提供的字段，其他字段保持不变
   * - 更新失败时会显示错误提示并重新抛出错误
   */
  async updateDocumentMetadata(
    id: string,
    metadata: Partial<Pick<DocumentEntity, 'title' | 'badge' | 'badgeClass'>>
  ): Promise<void> {
    try {
      const doc = await documentsDb.getDocument(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }
      await withRetry(() => documentsDb.updateDocumentMetadata(id, metadata), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to update document', {
        description: message,
      });
      throw error;
    }
  },

  /**
   * 删除文档
   * 同时自动删除相关的链接关系
   *
   * @param id - 文档 ID
   * @throws 如果文档不存在时抛出错误
   *
   * @remarks
   * - 删除操作会级联删除该文档的所有链接关系
   * - 删除失败时会显示错误提示并重新抛出错误
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const doc = await documentsDb.getDocument(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }
      await withRetry(() => documentsDb.deleteDocument(id), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to delete document', {
        description: message,
      });
      throw error;
    }
  },

  /**
   * 获取指向目标文档的所有反向链接
   * 返回引用了该文档的所有源文档 ID
   *
   * @param id - 目标文档 ID
   * @returns 源文档 ID 数组，查询失败时返回空数组
   *
   * @remarks
   * - 查询失败时会显示错误提示并返回空数组
   */
  async getBacklinks(id: string): Promise<string[]> {
    try {
      return await withRetry(() => linksDb.getBacklinks(id), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to load backlinks', {
        description: message,
      });
      return [];
    }
  },

  /**
   * 获取源文档指向的所有正向链接
   * 返回该文档引用的所有目标文档 ID
   *
   * @param id - 源文档 ID
   * @returns 目标文档 ID 数组，查询失败时返回空数组
   *
   * @remarks
   * - 查询失败时会显示错误提示并返回空数组
   */
  async getForwardLinks(id: string): Promise<string[]> {
    try {
      return await withRetry(() => linksDb.getForwardLinks(id), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to load links', {
        description: message,
      });
      return [];
    }
  },

  /**
   * 更新文档的双向链接关系
   * 解析文档内容中的 Markdown 链接并更新链接表
   *
   * @param id - 文档 ID
   * @param content - 文档内容（Markdown 格式）
   *
   * @remarks
   * - 解析内容中的 [[link]] 格式双链
   * - 自动维护链接表的正向和反向关系
   * - 更新失败时会显示错误提示
   */
  async updateDocumentLinks(id: string, content: string): Promise<void> {
    try {
      await withRetry(() => linksDb.updateDocumentLinks(id, content), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to update links', {
        description: message,
      });
    }
  },
};

// 导出便捷方法，保持与 db 层相似的 API
export const getDocument = documentService.getDocument;
export const getAllDocuments = documentService.getAllDocuments;
export const createDocument = documentService.createDocument;
export const updateDocumentContent = documentService.updateDocumentContent;
export const updateDocumentMetadata = documentService.updateDocumentMetadata;
export const deleteDocument = documentService.deleteDocument;
export const getBacklinks = documentService.getBacklinks;
export const getForwardLinks = documentService.getForwardLinks;
export const updateDocumentLinks = documentService.updateDocumentLinks;
