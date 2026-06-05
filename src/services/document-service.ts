/**
 * 文档服务层
 * 封装文档的 CRUD 操作和链接查询逻辑
 * 提供更高层次的抽象，可添加业务逻辑如缓存、验证等
 */

import * as documentsDb from '@/db/documents';
import * as linksDb from '@/db/links';
import type { DocumentEntity } from '@/types';
import { useUiStore } from '@/stores/ui-store';

/**
 * 显示数据库错误提示
 */
const showStorageError = (message: string) => {
  useUiStore.getState().setStatus(`Storage error: ${message}`);
};

/**
 * 文档服务
 * 提供文档和链接相关的业务操作
 */
export const documentService = {
  /**
   * 获取指定 ID 的文档
   * @param id - 文档 ID
   * @returns 文档实体或 undefined
   */
  async getDocument(id: string): Promise<DocumentEntity | undefined> {
    try {
      return await documentsDb.getDocument(id);
    } catch (error) {
      console.error('Failed to get document:', error);
      showStorageError('Failed to load document');
      return undefined;
    }
  },

  /**
   * 获取所有文档
   * @returns 所有文档实体数组
   */
  async getAllDocuments(): Promise<DocumentEntity[]> {
    try {
      return await documentsDb.getAllDocuments();
    } catch (error) {
      console.error('Failed to get all documents:', error);
      showStorageError('Failed to load documents');
      return [];
    }
  },

  /**
   * 创建新文档
   * @param document - 文档实体
   */
  async createDocument(document: DocumentEntity): Promise<void> {
    try {
      if (!document.id) {
        throw new Error('文档 ID 不能为空');
      }
      if (!document.title) {
        throw new Error('文档标题不能为空');
      }
      await documentsDb.createDocument(document);
    } catch (error) {
      console.error('Failed to create document:', error);
      showStorageError('Failed to create document');
      throw error;
    }
  },

  /**
   * 更新文档内容
   * 同时自动更新文档的双向链接关系
   * @param id - 文档 ID
   * @param content - 新的文档内容（Markdown 格式）
   */
  async updateDocumentContent(id: string, content: string): Promise<void> {
    try {
      const doc = await documentsDb.getDocument(id);
      if (!doc) {
        throw new Error(`文档不存在: ${id}`);
      }
      await documentsDb.updateDocumentContent(id, content);
    } catch (error) {
      console.error('Failed to update document content:', error);
      showStorageError('Failed to save document');
      throw error;
    }
  },

  /**
   * 更新文档元数据
   * @param id - 文档 ID
   * @param metadata - 要更新的元数据字段
   */
  async updateDocumentMetadata(
    id: string,
    metadata: Partial<Pick<DocumentEntity, 'title' | 'badge' | 'badgeClass'>>
  ): Promise<void> {
    try {
      const doc = await documentsDb.getDocument(id);
      if (!doc) {
        throw new Error(`文档不存在: ${id}`);
      }
      await documentsDb.updateDocumentMetadata(id, metadata);
    } catch (error) {
      console.error('Failed to update document metadata:', error);
      showStorageError('Failed to update document');
      throw error;
    }
  },

  /**
   * 删除文档
   * 同时自动删除相关的链接关系
   * @param id - 文档 ID
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const doc = await documentsDb.getDocument(id);
      if (!doc) {
        throw new Error(`文档不存在: ${id}`);
      }
      await documentsDb.deleteDocument(id);
    } catch (error) {
      console.error('Failed to delete document:', error);
      showStorageError('Failed to delete document');
      throw error;
    }
  },

  /**
   * 获取指向目标文档的所有反向链接
   * 返回引用了该文档的所有源文档 ID
   * @param id - 目标文档 ID
   * @returns 源文档 ID 数组
   */
  async getBacklinks(id: string): Promise<string[]> {
    try {
      return await linksDb.getBacklinks(id);
    } catch (error) {
      console.error('Failed to get backlinks:', error);
      showStorageError('Failed to load backlinks');
      return [];
    }
  },

  /**
   * 获取源文档指向的所有正向链接
   * 返回该文档引用的所有目标文档 ID
   * @param id - 源文档 ID
   * @returns 目标文档 ID 数组
   */
  async getForwardLinks(id: string): Promise<string[]> {
    try {
      return await linksDb.getForwardLinks(id);
    } catch (error) {
      console.error('Failed to get forward links:', error);
      showStorageError('Failed to load links');
      return [];
    }
  },

  /**
   * 更新文档的双向链接关系
   * 解析文档内容中的 Markdown 链接并更新链接表
   * @param id - 文档 ID
   * @param content - 文档内容（Markdown 格式）
   */
  async updateDocumentLinks(id: string, content: string): Promise<void> {
    try {
      await linksDb.updateDocumentLinks(id, content);
    } catch (error) {
      console.error('Failed to update document links:', error);
      showStorageError('Failed to update links');
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
