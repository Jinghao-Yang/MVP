/* ================================================
   FILE: src/services/parser-service.ts
   ================================================ */
import { db } from '@/db/dexie';
import type { SemanticNode } from '@/types';

interface CachedDocPayload {
  blocks: Map<string, string>; // Map<nodeId, contentText>
  timestamp: number;
}

class ParserService {
  private cache = new Map<string, CachedDocPayload>();
  private readonly MAX_CACHE_SIZE = 50;

  /**
   * 完美的单线增量解析器：提取语义卡片、关系、以及扁平标签
   * 采用高度精确的 regexp 消除复杂的 AST 解析器体积
   */
  public parseMarkdown(
    docId: string,
    content: string
  ): {
    nodes: SemanticNode[];
    wikiLinks: string[];
    tags: string[];
  } {
    const lines = content.split('\n');
    const nodes: SemanticNode[] = [];
    const wikiLinks: string[] = [];
    const tags: string[] = [];

    let insideBlock = false;
    let currentType = '';
    let currentMeta: Record<string, unknown> = {};
    let currentLines: string[] = [];

    for (const line of lines) {
      // 1. 扫描块头部: ::: type { "id": "thm-hb", "title": "Heine-Borel" }
      const startMatch = line.match(/^:::\s*([a-zA-Z0-9_-]+)\s*(?:\{(.+)\})?\s*$/);
      if (startMatch && !insideBlock) {
        insideBlock = true;
        currentType = startMatch[1];
        currentLines = [];

        const jsonStrRaw = startMatch[2];
        if (jsonStrRaw) {
          try {
            // 支持合法的严格 JSON 解析
            currentMeta = JSON.parse(`{${jsonStrRaw}}`);
          } catch {
            currentMeta = {};
          }
        } else {
          currentMeta = {};
        }
        continue;
      }

      // 2. 扫描块尾部: :::
      if (line.trim() === ':::' && insideBlock) {
        insideBlock = false;
        const blockId = (currentMeta.id as string) || `node-${docId}-${nodes.length}`;
        const blockContent = currentLines.join('\n');

        // 在当前块内提取 references [[nodeId]]
        const references: string[] = [];
        const matches = blockContent.matchAll(/\[\[([a-zA-Z0-9_-]+)(?:\|[^\]]+)?\]\]/g);
        for (const match of matches) {
          references.push(match[1]);
        }

        nodes.push({
          id: blockId,
          docId,
          type: currentType,
          title: (currentMeta.title as string) || 'Untitled Block',
          properties: currentMeta,
          references,
        });
        continue;
      }

      if (insideBlock) {
        currentLines.push(line);
      } else {
        // 3. 提取全局常规双链
        const globalMatches = line.matchAll(/\[\[([a-zA-Z0-9_-]+)(?:\|[^\]]+)?\]\]/g);
        for (const match of globalMatches) {
          wikiLinks.push(match[1]);
        }

        // 4. 提取全局标签 #tag
        const tagMatches = line.matchAll(/#([a-zA-Z0-9_-]+)/g);
        for (const match of tagMatches) {
          tags.push(match[1].toLowerCase());
        }
      }
    }

    return { nodes, wikiLinks, tags };
  }

  /**
   * 动态按需切片内存 AST 的正文映射
   */
  public async getCachedDocument(docId: string): Promise<CachedDocPayload> {
    const cached = this.cache.get(docId);
    if (cached) {
      cached.timestamp = Date.now();
      return cached;
    }

    const doc = await db.documents.get(docId);
    const blocks = new Map<string, string>();
    if (!doc) return { blocks, timestamp: Date.now() };

    const lines = doc.content.split('\n');
    let insideBlock = false;
    let currentId = '';
    let currentLines: string[] = [];

    for (const line of lines) {
      const startMatch = line.match(/^:::\s*[a-zA-Z0-9_-]+\s*(?:\{(.+)\})?\s*$/);
      if (startMatch && !insideBlock) {
        insideBlock = true;
        const jsonStrRaw = startMatch[1];
        try {
          const meta = JSON.parse(`{${jsonStrRaw}}`);
          currentId = meta.id;
        } catch {
          currentId = '';
        }
        currentLines = [];
        continue;
      }
      if (line.trim() === ':::' && insideBlock) {
        insideBlock = false;
        if (currentId) {
          blocks.set(currentId, currentLines.join('\n'));
        }
        continue;
      }
      if (insideBlock) {
        currentLines.push(line);
      }
    }

    const newCache = { blocks, timestamp: Date.now() };
    this.evictIfNeeded();
    this.cache.set(docId, newCache);
    return newCache;
  }

  /**
   * 动态拉取指定语义块的切片正文 (高效率，零漂移)
   */
  public async getNodeContent(docId: string, nodeId: string): Promise<string> {
    const payload = await this.getCachedDocument(docId);
    return payload.blocks.get(nodeId) || '';
  }

  /**
   * 失效内存解析缓存
   */
  public invalidate(docId: string): void {
    this.cache.delete(docId);
  }

  private evictIfNeeded() {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldest = [...this.cache.entries()].sort(
        (a, b) => a[1].timestamp - b[1].timestamp
      )[0][0];
      this.cache.delete(oldest);
    }
  }
}

export const parserService = new ParserService();
