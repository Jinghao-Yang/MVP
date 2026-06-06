/* ================================================
   FILE: src/services/parser-service.ts
   ================================================ */
import { db } from '@/db/dexie';

interface CachedDocPayload {
  blocks: Map<string, string>; // Map<nodeId, contentText>
  timestamp: number;
}

interface LocatedWikiLink {
  targetId: string;
  start: number;
  end: number;
}

interface LocatedTag {
  tag: string;
  start: number;
  end: number;
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
    wikiLinks: string[];
    tags: string[];
  } {
    const result = this.parseMarkdownWithLocation(docId, content);
    return {
      wikiLinks: result.locatedWikiLinks.map((link) => link.targetId),
      tags: result.locatedTags.map((tag) => tag.tag),
    };
  }

  /**
   * 解析 Markdown 并返回带有位置信息的实体
   */
  public parseMarkdownWithLocation(
    docId: string,
    content: string
  ): {
    locatedWikiLinks: LocatedWikiLink[];
    locatedTags: LocatedTag[];
  } {
    const locatedWikiLinks: LocatedWikiLink[] = [];
    const locatedTags: LocatedTag[] = [];

    let insideBlock = false;

    // 逐行扫描并跟踪位置
    let currentOffset = 0;
    const lines = content.split('\n');

    for (const line of lines) {
      const lineLength = line.length + 1; // +1 for the newline character
      const lineStart = currentOffset;

      // 1. 扫描块头部: ::: type { "id": "thm-hb", "title": "Heine-Borel" }
      const startMatch = line.match(/^:::\s*[a-zA-Z0-9_-]+\s*(?:\{.+\})?\s*$/);
      if (startMatch && !insideBlock) {
        insideBlock = true;
        currentOffset += lineLength;
        continue;
      }

      // 2. 扫描块尾部: :::
      if (line.trim() === ':::' && insideBlock) {
        insideBlock = false;
        currentOffset += lineLength;
        continue;
      }

      // 提取全局/内部双链和标签
      this.extractFromLine(line, lineStart, locatedWikiLinks, locatedTags);

      currentOffset += lineLength;
    }

    return { locatedWikiLinks, locatedTags };
  }

  /**
   * 从单行文本中提取链接和标签，并记录位置信息
   */
  private extractFromLine(
    line: string,
    lineStart: number,
    locatedWikiLinks: LocatedWikiLink[],
    locatedTags: LocatedTag[]
  ) {
    // 提取双链
    const wikiLinkMatches = line.matchAll(/\[\[([a-zA-Z0-9_-]+)(?:\|[^\]]+)?\]\]/g);
    for (const match of wikiLinkMatches) {
      if (match.index !== undefined) {
        locatedWikiLinks.push({
          targetId: match[1],
          start: lineStart + match.index,
          end: lineStart + match.index + match[0].length,
        });
      }
    }

    // 提取标签
    const tagMatches = line.matchAll(/#([a-zA-Z0-9_-]+)/g);
    for (const match of tagMatches) {
      if (match.index !== undefined) {
        locatedTags.push({
          tag: match[1].toLowerCase(),
          start: lineStart + match.index,
          end: lineStart + match.index + match[0].length,
        });
      }
    }
  }

  /**
   * 增量解析：仅解析受变更影响的文档片段
   */
  public incrementalParse(
    docId: string,
    content: string,
    from: number,
    to: number,
    inserted: string,
    _removed: string
  ): {
    locatedWikiLinks: LocatedWikiLink[];
    locatedTags: LocatedTag[];
    affectedRange: { start: number; end: number };
  } {
    // 扩大解析范围：前后各扩展 200 字符，避免遗漏跨边界的链接或标签
    const CONTEXT_RADIUS = 200;
    const parseStart = Math.max(0, from - CONTEXT_RADIUS);
    const parseEnd = Math.min(content.length, to + inserted.length + CONTEXT_RADIUS);

    // 先检查受影响范围内是否有语义块，如果有则回退到全量解析
    const affectedFragment = content.slice(parseStart, parseEnd);
    const contextBefore = content.slice(Math.max(0, parseStart - 500), parseStart);
    const contextAfter = content.slice(parseEnd, Math.min(content.length, parseEnd + 500));

    if (
      affectedFragment.includes(':::') ||
      contextBefore.includes(':::') ||
      contextAfter.includes(':::')
    ) {
      // 回退到全量解析
      const fullResult = this.parseMarkdownWithLocation(docId, content);
      return {
        ...fullResult,
        affectedRange: { start: 0, end: content.length },
      };
    }

    // 解析受影响片段，然后重新定位到全局位置
    const fragmentResult = this.parseMarkdownWithLocation(docId, affectedFragment);

    // 重新定位位置到全局
    const repositionedLinks = fragmentResult.locatedWikiLinks.map((link) => ({
      ...link,
      start: link.start + parseStart,
      end: link.end + parseStart,
    }));

    const repositionedTags = fragmentResult.locatedTags.map((tag) => ({
      ...tag,
      start: tag.start + parseStart,
      end: tag.end + parseStart,
    }));

    return {
      locatedWikiLinks: repositionedLinks,
      locatedTags: repositionedTags,
      affectedRange: { start: parseStart, end: parseEnd },
    };
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
