/**
 * Document Parse Service
 * 监听文档变更并触发解析操作
 *
 * 使用 Dexie 的观察机制来监听文档变更
 */

import { db } from '@/db/dexie';
import { parserService } from '@/services/parser-service';
import type { SemanticNode } from '@/types';

interface DocumentChangeListener {
  (docId: string, content: string): void;
}

/**
 * 文档解析服务
 * 负责监听文档变更并触发解析操作
 */
class DocumentParseService {
  private listeners: Set<DocumentChangeListener> = new Set();
  private parseDebounceMap: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private readonly PARSE_DEBOUNCE_MS = 300;

  /**
   * 添加文档变更监听器
   */
  addListener(listener: DocumentChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 触发文档解析
   * 使用防抖避免频繁解析
   */
  triggerParse(docId: string, content: string): void {
    // 清除之前的防抖定时器
    const existingTimeout = this.parseDebounceMap.get(docId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // 设置新的防抖定时器
    const timeout = setTimeout(() => {
      this.parseDebounceMap.delete(docId);
      this.parseDocument(docId, content);
    }, this.PARSE_DEBOUNCE_MS);

    this.parseDebounceMap.set(docId, timeout);
  }

  /**
   * 执行文档解析
   */
  private async parseDocument(docId: string, content: string): Promise<void> {
    try {
      // 1. 清除特定内存缓存
      parserService.invalidate(docId);

      // 2. 执行单向增量解析提取（带位置）
      const { nodes, locatedWikiLinks, locatedTags } = parserService.parseMarkdownWithLocation(
        docId,
        content
      );

      // 3. 通知监听器
      this.listeners.forEach((listener) => {
        try {
          listener(docId, content);
        } catch (error) {
          console.error('Document change listener error:', error);
        }
      });

      // 4. 写入多表事务索引
      await this.updateIndexes(docId, nodes, locatedWikiLinks, locatedTags);
    } catch (error) {
      console.error('Failed to parse document:', error);
    }
  }

  /**
   * 更新索引表
   */
  private async updateIndexes(
    docId: string,
    nodes: SemanticNode[],
    locatedWikiLinks: Array<{ targetId: string; start: number; end: number }>,
    locatedTags: Array<{ tag: string; start: number; end: number }>
  ): Promise<void> {
    await db.transaction('rw', [db.semanticNodes, db.links, db.tags], async () => {
      // 更新语义节点
      await db.semanticNodes.where('docId').equals(docId).delete();
      if (nodes.length > 0) {
        await db.semanticNodes.bulkAdd(nodes);
      }

      // 更新链接
      await db.links.where('sourceId').equals(docId).delete();
      const linkEntities = locatedWikiLinks.map((link) => ({
        sourceId: docId,
        targetId: link.targetId,
        start: link.start,
        end: link.end,
      }));
      if (linkEntities.length > 0) {
        await db.links.bulkAdd(linkEntities);
      }

      // 更新标签
      await db.tags.where('docId').equals(docId).delete();
      const tagEntities = locatedTags.map((t) => ({
        docId: docId,
        tag: t.tag,
        start: t.start,
        end: t.end,
      }));
      if (tagEntities.length > 0) {
        await db.tags.bulkAdd(tagEntities);
      }
    });
  }

  /**
   * 清除指定文档的防抖定时器
   */
  clearDebounce(docId: string): void {
    const timeout = this.parseDebounceMap.get(docId);
    if (timeout) {
      clearTimeout(timeout);
      this.parseDebounceMap.delete(docId);
    }
  }

  /**
   * 清除所有防抖定时器
   */
  clearAllDebounces(): void {
    this.parseDebounceMap.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.parseDebounceMap.clear();
  }
}

export const documentParseService = new DocumentParseService();
