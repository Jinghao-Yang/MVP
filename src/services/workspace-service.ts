/**
 * 工作区服务
 * 封装工作区初始化逻辑，协调其他 Service 和 Store
 * 提供清晰的工作区初始化流程
 */

import { seedDatabase, db } from '@/db/dexie';
import { getDocument, createDocument } from '@/services/document-service';
import { getAllPopupStates } from '@/services/popup-service';
import { getKanbanCards } from '@/db/cards';
import type { KanbanCardEntity, PopoverStateEntity, DocumentEntity } from '@/types';

/**
 * 工作区初始化结果
 */
export interface WorkspaceInitializationResult {
  /** 主编辑器文档内容 */
  mainEditorContent: string;
  /** Kanban 卡片列表 */
  kanbanCards: KanbanCardEntity[];
  /** 弹窗状态列表 */
  popoverStates: PopoverStateEntity[];
}

/**
 * 默认主编辑器文档配置
 */
const DEFAULT_MAIN_EDITOR_DOC: Omit<DocumentEntity, 'updatedAt'> = {
  id: 'main-editor-doc',
  title: 'Topology Math',
  content: `# Compactness in topological spaces

This space maps the foundational structures of topological spaces. It bridges the intuitive notion of [closeness](compactness) without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.

A topological space is a set endowed with a structure, called a topology, which allows defining continuous deformation of subspaces. Generalizing the [Heine–Borel](heine-borel) theorem requires us to move beyond Euclidean constraints.

This brings us to [Tychonoff's Theorem](tychonoff), which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.`,
  badge: 'Active Draft',
  badgeClass: 'tag-badge-blue',
};

/**
 * 初始化工作区
 * 执行完整的工作区初始化流程：
 * 1. 初始化数据库（种子数据）
 * 2. 加载 Kanban 卡片
 * 3. 加载主编辑器文档（不存在则创建默认文档）
 * 4. 恢复弹窗状态
 * @returns 工作区初始化结果
 */
export async function initializeWorkspace(): Promise<WorkspaceInitializationResult> {
  // 1. 初始化数据库（种子数据）
  await seedDatabase();

  // 2. 加载 Kanban 卡片
  const kanbanCards = await getKanbanCards();

  // 3. 加载主编辑器文档
  let mainDoc = await getDocument('main-editor-doc');
  if (!mainDoc) {
    // 如果主编辑器文档不存在，创建默认文档
    mainDoc = {
      ...DEFAULT_MAIN_EDITOR_DOC,
      updatedAt: Date.now(),
    };
    await createDocument(mainDoc);
  }

  // 4. 恢复弹窗状态
  const popoverStates = await getAllPopupStates();

  return {
    mainEditorContent: mainDoc.content,
    kanbanCards,
    popoverStates,
  };
}

/**
 * 加载指定文档及其反向链接
 * @param wikiId - Wiki ID（文档 ID）
 * @returns 文档数据和反向链接，如果文档不存在则返回 null
 */
export async function loadWikiWithBacklinks(
  wikiId: string
): Promise<{ document: DocumentEntity; backlinks: string[] } | null> {
  const document = await getDocument(wikiId);
  if (!document) {
    return null;
  }

  // 获取反向链接
  const backlinks = await db.links
    .where('targetId')
    .equals(wikiId)
    .toArray()
    .then((links) => links.map((link) => link.sourceId));

  return { document, backlinks };
}

/**
 * 恢复弹窗数据
 * 根据弹窗状态和文档数据构建完整的弹窗数据
 * @param popoverStates - 弹窗状态列表
 * @param pinnedMetadata - 固定弹窗元数据（包含固定和最小化状态）
 * @returns 弹窗数据列表
 */
export async function restorePopups(
  popoverStates: PopoverStateEntity[],
  pinnedMetadata: Array<{ id: string; isPinned: boolean; isMinimized: boolean }>
): Promise<
  Array<{
    id: string;
    title: string;
    excerpt: string;
    badge?: string;
    badgeClass?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isPinned: boolean;
    isMinimized: boolean;
    depth: number;
  }>
> {
  const restoredPopups: Array<{
    id: string;
    title: string;
    excerpt: string;
    badge?: string;
    badgeClass?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    isPinned: boolean;
    isMinimized: boolean;
    depth: number;
  }> = [];

  for (const meta of pinnedMetadata) {
    const docData = await getDocument(meta.id);
    const popoverPos = popoverStates.find((state) => state.id === meta.id);

    if (docData) {
      restoredPopups.push({
        id: meta.id,
        title: docData.title,
        excerpt: docData.content.substring(0, 180) + '...',
        badge: docData.badge,
        badgeClass: docData.badgeClass,
        x: popoverPos?.x ?? 120,
        y: popoverPos?.y ?? 120,
        width: popoverPos?.width ?? 500,
        height: popoverPos?.height ?? 320,
        isPinned: meta.isPinned,
        isMinimized: meta.isMinimized,
        depth: 1,
      });
    }
  }

  return restoredPopups;
}

/**
 * 工作区服务对象
 * 提供工作区相关的业务操作
 */
export const workspaceService = {
  initializeWorkspace,
  loadWikiWithBacklinks,
  restorePopups,
};

// 导出便捷方法
export const getWorkspaceInitializationResult = initializeWorkspace;
