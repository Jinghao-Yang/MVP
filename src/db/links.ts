/**
 * 双向链接数据操作
 * 封装文档之间的双向链接关系管理
 */

import { db } from './dexie';
import type { BidirectionalLinkEntity } from '@/types';

/**
 * 解析 Markdown 文本中的链接
 * @param sourceId - 源文档 ID
 * @param text - Markdown 文本
 * @returns 解析出的链接实体数组
 */
function parseMarkdownLinks(sourceId: string, text: string): BidirectionalLinkEntity[] {
  const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const list: BidirectionalLinkEntity[] = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    list.push({ sourceId, targetId: match[2] });
  }
  return list;
}

/**
 * 更新文档的双向链接关系
 * 删除旧链接并添加新链接
 * @param sourceId - 源文档 ID
 * @param content - 文档内容（Markdown 格式）
 */
export async function updateDocumentLinks(sourceId: string, content: string): Promise<void> {
  const extractedLinks = parseMarkdownLinks(sourceId, content);
  await db.links.where({ sourceId }).delete();
  if (extractedLinks.length > 0) {
    await db.links.bulkAdd(extractedLinks);
  }
}

/**
 * 获取指向目标文档的所有反向链接
 * @param targetId - 目标文档 ID
 * @returns 源文档 ID 数组
 */
export async function getBacklinks(targetId: string): Promise<string[]> {
  const list = await db.links.where({ targetId }).toArray();
  return list.map((item) => item.sourceId);
}

/**
 * 获取源文档指向的所有正向链接
 * @param sourceId - 源文档 ID
 * @returns 目标文档 ID 数组
 */
export async function getForwardLinks(sourceId: string): Promise<string[]> {
  const list = await db.links.where({ sourceId }).toArray();
  return list.map((item) => item.targetId);
}

/**
 * 获取所有链接关系
 * @returns 所有链接实体数组
 */
export async function getAllLinks(): Promise<BidirectionalLinkEntity[]> {
  return await db.links.toArray();
}

/**
 * 删除文档的所有链接关系
 * @param docId - 文档 ID
 */
export async function deleteDocumentLinks(docId: string): Promise<void> {
  await db.links.where({ sourceId: docId }).delete();
  await db.links.where({ targetId: docId }).delete();
}
