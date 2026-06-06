/* ================================================
   FILE: src/services/search-indexing-service.ts
   ================================================ */
import { db } from '@/db/dexie';
import type { DocumentEntity } from '@/types';

export interface IndexedDocument {
  id: string;
  title: string;
  content: string;
  badge?: string;
  updatedAt: number;
  plainText: string;
  keywords: string[];
}

export interface SearchMatch {
  doc: DocumentEntity;
  relevance: number; // 0 to 1 score
  matchedSnippet: string;
}

class SearchIndexingService {
  private index: Map<string, IndexedDocument> = new Map();
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isIndexingActive: boolean = false;

  /**
   * Start periodic crawl of the Dexie store
   */
  public startIndexing(intervalMs: number = 10000): void {
    if (this.isIndexingActive) return;
    this.isIndexingActive = true;

    // Run initial crawling sync immediately
    this.crawlAndIndex();

    // Setup periodic crawl
    this.intervalId = setInterval(() => {
      this.crawlAndIndex();
    }, intervalMs);

    console.log('[SearchIndex] Periodical indexing service booted.');
  }

  /**
   * Stop periodic indexing
   */
  public stopIndexing(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isIndexingActive = false;
    console.log('[SearchIndex] Periodical indexing service paused.');
  }

  /**
   * Force manual indexing recreation synchronously
   */
  public async forceReindex(): Promise<void> {
    await this.crawlAndIndex();
  }

  /**
   * Perform the object store crawling and text tokenization
   */
  private async crawlAndIndex(): Promise<void> {
    try {
      const documents = await db.documents.toArray();
      const updatedIndex = new Map<string, IndexedDocument>();

      for (const doc of documents) {
        const plainText = this.stripMarkdown(doc.content || '');
        const keywords = this.tokenize(doc.title + ' ' + plainText + ' ' + (doc.badge || ''));

        updatedIndex.set(doc.id, {
          id: doc.id,
          title: doc.title,
          content: doc.content || '',
          badge: doc.badge,
          updatedAt: doc.updatedAt,
          plainText,
          keywords,
        });
      }

      this.index = updatedIndex;
    } catch (error) {
      console.error('[SearchIndex] Crawling and indexing failure:', error);
    }
  }

  /**
   * Strip typical MD tokens to obtain clean readable content
   */
  private stripMarkdown(md: string): string {
    return md
      .replace(/#+\s+/g, '') // strip headers
      .replace(/\[\d*\]/g, '') // strip references/citations
      .replace(/\[\[(.*?)\]\]/g, '$1') // strip wiki double brackets but keep anchor label
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1') // strip standard links
      .replace(/[*_`]/g, '') // strip markers
      .replace(/\s+/g, ' ') // normalize whitespace
      .trim();
  }

  /**
   * Tokenize and normalize input string into comparable components
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, ' ') // support alphanumeric + CJK characters
      .split(/\s+/)
      .filter((word) => word.length > 0);
  }

  /**
   * Queries the indexed document store
   * Returns a sorted list of matching documentation and scored snippets
   */
  public search(query: string): SearchMatch[] {
    const cleanQuery = query.trim().toLowerCase();
    if (!cleanQuery) {
      return Array.from(this.index.values()).map((idoc) => ({
        doc: {
          id: idoc.id,
          title: idoc.title,
          content: idoc.content,
          badge: idoc.badge,
          updatedAt: idoc.updatedAt,
        } as DocumentEntity,
        relevance: 1,
        matchedSnippet: idoc.plainText.slice(0, 100) + (idoc.plainText.length > 100 ? '...' : ''),
      }));
    }

    const queryWords = this.tokenize(cleanQuery);
    const matches: SearchMatch[] = [];

    for (const idoc of this.index.values()) {
      let score = 0;

      // Word matches
      const titleLower = idoc.title.toLowerCase();
      const plainTextLower = idoc.plainText.toLowerCase();

      for (const word of queryWords) {
        if (titleLower.includes(word)) {
          score += 10; // weight title matches heavily
        }
        if (plainTextLower.includes(word)) {
          score += 1;
        }
      }

      // Check perfect match with subqueries
      if (titleLower.includes(cleanQuery)) {
        score += 25;
      }
      if (plainTextLower.includes(cleanQuery)) {
        score += 15;
      }

      if (score > 0) {
        const totalPossibleHits = queryWords.length;
        const relevance = Math.min(1, score / (25 + totalPossibleHits * 10));

        // Generate precise snippet context around match
        const matchedSnippet = this.generateSnippet(idoc.plainText, queryWords);

        matches.push({
          doc: {
            id: idoc.id,
            title: idoc.title,
            content: idoc.content,
            badge: idoc.badge,
            updatedAt: idoc.updatedAt,
          } as DocumentEntity,
          relevance,
          matchedSnippet,
        });
      }
    }

    // Sort by relevance score first then date
    return matches.sort((a, b) => b.relevance - a.relevance || b.doc.updatedAt - a.doc.updatedAt);
  }

  /**
   * Generates a snippet showing matched words in context
   */
  private generateSnippet(text: string, queryWords: string[]): string {
    const textLower = text.toLowerCase();
    let bestIndex = 0;
    let minIdx = -1;

    // Find the first matching query keyword
    for (const d of queryWords) {
      const idx = textLower.indexOf(d);
      if (idx !== -1 && (minIdx === -1 || idx < minIdx)) {
        minIdx = idx;
      }
    }

    if (minIdx !== -1) {
      bestIndex = minIdx;
    }

    const start = Math.max(0, bestIndex - 40);
    const end = Math.min(text.length, bestIndex + 120);

    let snippet = text.slice(start, end);

    if (start > 0) {
      snippet = '...' + snippet;
    }
    if (end < text.length) {
      snippet = snippet + '...';
    }

    return snippet;
  }
}

export const searchIndexingService = new SearchIndexingService();
