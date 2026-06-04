/**
 * 文档数据操作
 * 封装文档的 CRUD 操作
 */

import { db } from './dexie';
import { updateDocumentLinks, getBacklinks } from './links';
import type { DocumentEntity } from '@/types';

/**
 * 获取指定 ID 的文档
 * @param id - 文档 ID
 * @returns 文档实体或 undefined
 */
export async function getDocument(id: string): Promise<DocumentEntity | undefined> {
  return await db.documents.get(id);
}

/**
 * 获取所有文档
 * @returns 所有文档实体数组
 */
export async function getAllDocuments(): Promise<DocumentEntity[]> {
  return await db.documents.toArray();
}

/**
 * 创建新文档
 * @param document - 文档实体
 */
export async function createDocument(document: DocumentEntity): Promise<void> {
  await db.documents.add(document);
}

/**
 * 更新文档内容
 * 同时更新文档的双向链接关系
 * @param id - 文档 ID
 * @param content - 新的文档内容（Markdown 格式）
 */
export async function updateDocumentContent(id: string, content: string): Promise<void> {
  await db.documents.update(id, { content, updatedAt: Date.now() });
  await updateDocumentLinks(id, content);
}

/**
 * 更新文档元数据
 * @param id - 文档 ID
 * @param updates - 要更新的字段
 */
export async function updateDocumentMetadata(
  id: string,
  updates: Partial<Pick<DocumentEntity, 'title' | 'badge' | 'badgeClass'>>
): Promise<void> {
  await db.documents.update(id, { ...updates, updatedAt: Date.now() });
}

/**
 * 删除文档
 * 同时删除相关的链接关系
 * @param id - 文档 ID
 */
export async function deleteDocument(id: string): Promise<void> {
  await db.documents.delete(id);
  // 删除相关链接
  await db.links.where({ sourceId: id }).delete();
  await db.links.where({ targetId: id }).delete();
}

// 重新导出 getBacklinks 以保持向后兼容
export { getBacklinks };
