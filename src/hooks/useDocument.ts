/**
 * useDocument Hook
 * 封装文档数据访问，提供文档加载、更新等功能
 */
import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { useUiStore } from '@/stores/ui-store';
import { documentService } from '@/services/document-service';
import type { DocumentEntity } from '@/types';

/**
 * 文档 Hook 返回值
 */
export interface UseDocumentReturn {
  /** 当前 Wiki ID */
  currentWikiId: string | null;
  /** 文档文本 */
  documentText: string;

  /** 设置当前 Wiki ID */
  setCurrentWikiId: (id: string | null) => void;
  /** 设置文档文本 */
  setDocumentText: (text: string) => void;
  /** 加载文档内容 */
  loadDocumentText: (documentId: string) => Promise<void>;

  /** 获取文档 */
  getDocument: (id: string) => Promise<DocumentEntity | undefined>;
  /** 获取所有文档 */
  getAllDocuments: () => Promise<DocumentEntity[]>;
  /** 创建文档 */
  createDocument: (document: DocumentEntity) => Promise<void>;
  /** 更新文档内容 */
  updateDocumentContent: (id: string, content: string) => Promise<void>;
  /** 更新文档元数据 */
  updateDocumentMetadata: (
    id: string,
    metadata: Partial<Pick<DocumentEntity, 'title' | 'badge' | 'badgeClass'>>
  ) => Promise<void>;
  /** 删除文档 */
  deleteDocument: (id: string) => Promise<void>;
  /** 获取正向链接 */
  getForwardLinks: (id: string) => Promise<string[]>;
  /** 获取反向链接 */
  getBacklinks: (id: string) => Promise<string[]>;
}

/**
 * 文档数据访问 Hook
 * 封装文档的加载、更新等操作
 * 整合了 Editor Store 和 Document Service 的功能
 */
export function useDocument(): UseDocumentReturn {
  // 从 Editor Store 获取状态和方法
  const documentText = useEditorStore((state) => state.documentText);
  const setDocumentText = useEditorStore((state) => state.setDocumentText);
  const loadDocumentText = useEditorStore((state) => state.loadDocumentText);

  // 从 UI Store 获取跨组件共享状态
  const currentWikiId = useUiStore((state) => state.currentWikiId);
  const setCurrentWikiId = useUiStore((state) => state.setCurrentWikiId);

  // 封装 Document Service 方法
  const getDocument = useCallback(async (id: string) => {
    return await documentService.getDocument(id);
  }, []);

  const getAllDocuments = useCallback(async () => {
    return await documentService.getAllDocuments();
  }, []);

  const createDocument = useCallback(async (document: DocumentEntity) => {
    await documentService.createDocument(document);
  }, []);

  const updateDocumentContent = useCallback(async (id: string, content: string) => {
    await documentService.updateDocumentContent(id, content);
  }, []);

  const updateDocumentMetadata = useCallback(
    async (
      id: string,
      metadata: Partial<Pick<DocumentEntity, 'title' | 'badge' | 'badgeClass'>>
    ) => {
      await documentService.updateDocumentMetadata(id, metadata);
    },
    []
  );

  const deleteDocument = useCallback(async (id: string) => {
    await documentService.deleteDocument(id);
  }, []);

  const getForwardLinks = useCallback(async (id: string) => {
    return await documentService.getForwardLinks(id);
  }, []);

  const getBacklinks = useCallback(async (id: string) => {
    return await documentService.getBacklinks(id);
  }, []);

  return {
    // 状态
    currentWikiId,
    documentText,

    // Store 方法
    setCurrentWikiId,
    setDocumentText,
    loadDocumentText,

    // Document Service 方法
    getDocument,
    getAllDocuments,
    createDocument,
    updateDocumentContent,
    updateDocumentMetadata,
    deleteDocument,
    getForwardLinks,
    getBacklinks,
  };
}
