/**
 * useDocument Hook
 * 封装文档数据访问，提供文档加载、更新、历史导航等功能
 */
import { useCallback } from 'react';
import { useEditorStore } from '@/stores/editor-store';
import { documentService } from '@/services/document-service';
import type { DocumentEntity } from '@/types';

/**
 * 文档 Hook 返回值
 */
export interface UseDocumentReturn {
  /** 当前 Wiki ID */
  currentWikiId: string | null;
  /** 右侧面板 Wiki 标题 */
  rightPaneWikiTitle: string;
  /** 右侧面板 Wiki 内容 */
  rightPaneWikiContent: string;
  /** 右侧面板反向链接 */
  rightPaneBacklinks: string[];
  /** 文档文本 */
  documentText: string;
  /** 是否可以后退 */
  canGoBack: boolean;
  /** 是否可以前进 */
  canGoForward: boolean;

  /** 设置当前 Wiki ID */
  setCurrentWikiId: (id: string | null) => void;
  /** 设置文档文本（带防抖保存） */
  setDocumentText: (text: string) => void;
  /** 设置右侧面板内容（带防抖保存） */
  setRightPaneWikiContent: (text: string) => void;
  /** 加载 Wiki 内容 */
  loadWikiContent: (wikiId: string) => Promise<void>;
  /** 后退 */
  goBack: () => Promise<void>;
  /** 前进 */
  goForward: () => Promise<void>;

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
}

/**
 * 文档数据访问 Hook
 * 封装文档的加载、更新、历史导航等操作
 * 整合了 Editor Store 和 Document Service 的功能
 */
export function useDocument(): UseDocumentReturn {
  // 从 Editor Store 获取状态和方法
  const currentWikiId = useEditorStore((state) => state.currentWikiId);
  const rightPaneWikiTitle = useEditorStore((state) => state.rightPaneWikiTitle);
  const rightPaneWikiContent = useEditorStore((state) => state.rightPaneWikiContent);
  const rightPaneBacklinks = useEditorStore((state) => state.rightPaneBacklinks);
  const documentText = useEditorStore((state) => state.documentText);

  const setCurrentWikiId = useEditorStore((state) => state.setCurrentWikiId);
  const setDocumentText = useEditorStore((state) => state.setDocumentText);
  const setRightPaneWikiContent = useEditorStore((state) => state.setRightPaneWikiContent);
  const loadWikiContent = useEditorStore((state) => state.loadWikiContent);
  const goBack = useEditorStore((state) => state.goBack);
  const goForward = useEditorStore((state) => state.goForward);
  const canGoBack = useEditorStore((state) => state.canGoBack);
  const canGoForward = useEditorStore((state) => state.canGoForward);

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

  return {
    // 状态
    currentWikiId,
    rightPaneWikiTitle,
    rightPaneWikiContent,
    rightPaneBacklinks,
    documentText,
    canGoBack: canGoBack(),
    canGoForward: canGoForward(),

    // Editor Store 方法
    setCurrentWikiId,
    setDocumentText,
    setRightPaneWikiContent,
    loadWikiContent,
    goBack,
    goForward,

    // Document Service 方法
    getDocument,
    getAllDocuments,
    createDocument,
    updateDocumentContent,
    updateDocumentMetadata,
    deleteDocument,
    getForwardLinks,
  };
}
