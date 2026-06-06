/**
 * Document Parse Service
 * 监听文档变更并触发解析操作
 *
 * 使用 Dexie 的观察机制来监听文档变更
 */

import { db } from '@/db/dexie';
import { parserService } from '@/services/parser-service';
import type { InlineTaskEntity } from '@/types';

interface DocumentChangeListener {
  (docId: string, content: string): void;
}

/**
 * Extract checklist/inline tasks from document markdown text
 */
export function extractInlineTasks(
  docId: string,
  docTitle: string,
  content: string
): InlineTaskEntity[] {
  const list: InlineTaskEntity[] = [];
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
    if (match) {
      const completed = match[1].toLowerCase() === 'x';
      let text = match[2].trim();

      let date: string | null = null;
      const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        date = dateMatch[1];
        text = text.replace(/@\d{4}-\d{2}-\d{2}/, '').trim();
      }

      let priority = 'Medium';
      const pMatch = text.match(/!(High|Medium|Low)/gi);
      if (pMatch) {
        priority = pMatch[0].substring(1);
        priority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
        text = text.replace(/!(High|Medium|Low)/gi, '').trim();
      }

      list.push({
        id: `${docId}-inline-${index}`,
        docId,
        docTitle,
        text,
        completed,
        date,
        priority,
      });
    }
  });
  return list;
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
   * 执行文档解析 (公开，供初始化等使用)
   */
  async parseDocument(docId: string, content: string): Promise<void> {
    try {
      // 1. 清除特定内存缓存
      parserService.invalidate(docId);

      const doc = await db.documents.get(docId);
      const docTitle = doc?.title || 'Untitled';
      const inlineTasks =
        doc?.typeId === 'task' ? [] : extractInlineTasks(docId, docTitle, content);

      // 2. 执行单向增量解析提取（带位置）
      const { locatedWikiLinks, locatedTags } = parserService.parseMarkdownWithLocation(
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
      await this.updateIndexes(docId, locatedWikiLinks, locatedTags, inlineTasks);
    } catch (error) {
      console.error('Failed to parse document:', error);
    }
  }

  /**
   * 更新索引表
   */
  private async updateIndexes(
    docId: string,
    locatedWikiLinks: Array<{ targetId: string; start: number; end: number }>,
    locatedTags: Array<{ tag: string; start: number; end: number }>,
    inlineTasks: InlineTaskEntity[]
  ): Promise<void> {
    await db.transaction('rw', [db.links, db.tags, db.inlineTasks], async () => {
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

      // 更新 inlineTasks
      await db.inlineTasks.where('docId').equals(docId).delete();
      if (inlineTasks.length > 0) {
        await db.inlineTasks.bulkAdd(inlineTasks);
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
