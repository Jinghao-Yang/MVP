/**
 * 文档服务层
 * 封装文档的 CRUD 操作和链接查询逻辑
 * 提供更高层次的抽象，可添加业务逻辑如缓存、验证等
 */

import { db } from '@/db/dexie';
import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import type { DocumentEntity, BidirectionalLinkEntity } from '@/types';
import {
  showErrorToast,
  showInfoToast,
  showWarningToast,
  withRetry,
  setUnsavedChanges,
} from '@/utils/error-handler';
import { DOCUMENT } from '@/utils/constants';

/**
 * 带有类型信息的链接实体
 */
interface ParsedLink {
  targetId: string;
  type: 'link' | 'image';
  text: string;
}

/**
 * 递归遍历 token 提取所有链接
 */
function extractLinksFromTokens(tokens: Token[]): ParsedLink[] {
  const links: ParsedLink[] = [];

  for (const token of tokens) {
    if (token.type === 'link') {
      const linkToken = token as Tokens.Link;
      if (linkToken.href && linkToken.href.trim()) {
        links.push({
          targetId: linkToken.href,
          type: 'link',
          text: linkToken.text || '',
        });
      }
    }

    if (token.type === 'image') {
      const imageToken = token as Tokens.Image;
      if (imageToken.href && imageToken.href.trim()) {
        links.push({
          targetId: imageToken.href,
          type: 'image',
          text: imageToken.text || '',
        });
      }
    }

    if (token.type === 'list') {
      const listToken = token as Tokens.List;
      for (const item of listToken.items) {
        if (item.tokens) {
          links.push(...extractLinksFromTokens(item.tokens));
        }
      }
    }

    if (token.type === 'table') {
      const tableToken = token as Tokens.Table;
      for (const row of tableToken.rows) {
        for (const cell of row) {
          links.push(...extractLinksFromTokens(cell.tokens));
        }
      }
      for (const header of tableToken.header) {
        links.push(...extractLinksFromTokens(header.tokens));
      }
    }

    if ('tokens' in token && Array.isArray(token.tokens)) {
      links.push(...extractLinksFromTokens(token.tokens));
    }
  }

  return links;
}

/**
 * 解析 Markdown 文本中的链接
 */
function parseMarkdownLinks(sourceId: string, text: string): BidirectionalLinkEntity[] {
  const list: BidirectionalLinkEntity[] = [];
  const tokens = marked.lexer(text);
  const links = extractLinksFromTokens(tokens);

  for (const link of links) {
    list.push({
      sourceId,
      targetId: link.targetId,
      start: 0,
      end: 1,
    });
  }

  return list;
}

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
   */
  async getDocument(id: string): Promise<DocumentEntity | undefined> {
    try {
      return await withRetry(() => db.documents.get(id), {
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
   */
  async getAllDocuments(): Promise<DocumentEntity[]> {
    try {
      return await withRetry(() => db.documents.toArray(), { maxRetries: 2 });
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
   */
  async createDocument(document: DocumentEntity): Promise<void> {
    try {
      if (!document.id) {
        throw new Error('Document ID is required');
      }
      if (!document.title) {
        throw new Error('Document title is required');
      }
      await withRetry(() => db.documents.add(document), { maxRetries: 2 });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to create document', {
        description: message,
      });
      throw error;
    }
  },

  /**
   * 更新文档内容并自动更新链接
   */
  async updateDocumentContent(id: string, content: string): Promise<void> {
    try {
      if (content.length > DOCUMENT.MAX_DOCUMENT_SIZE) {
        showContentSizeWarning();
        throw new Error(
          `Document content exceeds ${DOCUMENT.MAX_DOCUMENT_SIZE.toLocaleString()} characters`
        );
      }

      const doc = await db.documents.get(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }

      await withRetry(
        async () => {
          await db.documents.update(id, { content, updatedAt: Date.now() });
          await documentService.updateDocumentLinks(id, content);
        },
        {
          maxRetries: 3,
          shouldRetry: (error, attempt) => {
            showWarningToast(`Save failed, retrying... (${attempt + 1}/3)`);
            return true;
          },
        }
      );

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
   */
  async updateDocumentMetadata(
    id: string,
    metadata: Partial<Pick<DocumentEntity, 'title' | 'badge' | 'badgeClass'>>
  ): Promise<void> {
    try {
      const doc = await db.documents.get(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }
      await withRetry(() => db.documents.update(id, { ...metadata, updatedAt: Date.now() }), {
        maxRetries: 2,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to update document', {
        description: message,
      });
      throw error;
    }
  },

  /**
   * 删除文档并级联删除关联的链接
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      const doc = await db.documents.get(id);
      if (!doc) {
        throw new Error(`Document not found: ${id}`);
      }
      await withRetry(
        async () => {
          await db.documents.delete(id);
          await db.links.where({ sourceId: id }).delete();
          await db.links.where({ targetId: id }).delete();
          await db.inlineTasks.where('docId').equals(id).delete();
        },
        { maxRetries: 2 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to delete document', {
        description: message,
      });
      throw error;
    }
  },

  /**
   * 获取反向链接
   */
  async getBacklinks(id: string): Promise<string[]> {
    try {
      return await withRetry(
        async () => {
          const list = await db.links.where({ targetId: id }).toArray();
          return list.map((item) => item.sourceId);
        },
        { maxRetries: 2 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to load backlinks', {
        description: message,
      });
      return [];
    }
  },

  /**
   * 获取正向链接
   */
  async getForwardLinks(id: string): Promise<string[]> {
    try {
      return await withRetry(
        async () => {
          const list = await db.links.where({ sourceId: id }).toArray();
          return list.map((item) => item.targetId);
        },
        { maxRetries: 2 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      showErrorToast('Failed to load links', {
        description: message,
      });
      return [];
    }
  },

  /**
   * 更新链接表数据
   */
  async updateDocumentLinks(id: string, content: string): Promise<void> {
    try {
      const extractedLinks = parseMarkdownLinks(id, content);
      await withRetry(
        () =>
          db.transaction('rw', db.links, async () => {
            await db.links.where({ sourceId: id }).delete();
            if (extractedLinks.length > 0) {
              await db.links.bulkAdd(extractedLinks);
            }
          }),
        { maxRetries: 2 }
      );
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
