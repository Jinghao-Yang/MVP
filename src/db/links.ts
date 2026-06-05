/**
 * 双向链接数据操作
 * 封装文档之间的双向链接关系管理
 */

import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { db } from './dexie';
import type { BidirectionalLinkEntity } from '@/types';

/**
 * 扩展的链接实体，包含链接类型信息
 */
interface ParsedLink {
  /** 链接目标 */
  targetId: string;
  /** 链接类型：link 或 image */
  type: 'link' | 'image';
  /** 链接文本 */
  text: string;
}

/**
 * 递归遍历 token 提取所有链接
 * @param tokens - marked 解析出的 token 数组
 * @returns 提取的链接列表
 */
function extractLinksFromTokens(tokens: Token[]): ParsedLink[] {
  const links: ParsedLink[] = [];

  for (const token of tokens) {
    // 处理链接 token
    if (token.type === 'link') {
      const linkToken = token as Tokens.Link;
      // 跳过空链接和纯 URL 链接
      if (linkToken.href && linkToken.href.trim()) {
        links.push({
          targetId: linkToken.href,
          type: 'link',
          text: linkToken.text || '',
        });
      }
    }

    // 处理图片 token
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

    // 处理列表 token
    if (token.type === 'list') {
      const listToken = token as Tokens.List;
      for (const item of listToken.items) {
        if (item.tokens) {
          links.push(...extractLinksFromTokens(item.tokens));
        }
      }
    }

    // 处理表格中的单元格
    if (token.type === 'table') {
      const tableToken = token as Tokens.Table;
      for (const row of tableToken.rows) {
        for (const cell of row) {
          links.push(...extractLinksFromTokens(cell.tokens));
        }
      }
      // 处理表头
      for (const header of tableToken.header) {
        links.push(...extractLinksFromTokens(header.tokens));
      }
    }

    // 递归处理嵌套的 tokens（如引用块、段落等）
    if ('tokens' in token && Array.isArray(token.tokens)) {
      links.push(...extractLinksFromTokens(token.tokens));
    }
  }

  return links;
}

/**
 * 解析 Markdown 文本中的链接
 * 使用 marked 解析器支持：
 * - 嵌套括号
 * - 转义字符
 * - 图片链接
 * - 表格中的链接
 * - 列表中的链接
 *
 * @param sourceId - 源文档 ID
 * @param text - Markdown 文本
 * @returns 解析出的链接实体数组
 */
function parseMarkdownLinks(sourceId: string, text: string): BidirectionalLinkEntity[] {
  const list: BidirectionalLinkEntity[] = [];

  // 使用 marked 的 lexer 解析 Markdown
  const tokens = marked.lexer(text);

  // 提取所有链接
  const links = extractLinksFromTokens(tokens);

  // 转换为 BidirectionalLinkEntity
  for (const link of links) {
    list.push({
      sourceId,
      targetId: link.targetId,
    });
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

  await db.transaction('rw', db.links, async () => {
    await db.links.where({ sourceId }).delete();
    if (extractedLinks.length > 0) {
      await db.links.bulkAdd(extractedLinks);
    }
  });
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
