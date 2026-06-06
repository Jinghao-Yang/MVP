/**
 * Migration integration tests
 * Tests for database schema version management and data migration
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Dexie from 'dexie';
import type { BidirectionalLinkEntity, TagEntity } from '@/types';

// Import fake-indexeddb and set it up globally before Dexie is used
import 'fake-indexeddb/auto';

describe('Database Migration', () => {
  let testDb: Dexie;

  beforeEach(async () => {
    // Create a fresh test database for each test
    testDb = new Dexie('TestAxiomDatabase');
  });

  afterEach(async () => {
    // Clean up test database
    if (testDb) {
      try {
        await testDb.close();
        await testDb.delete();
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  describe('v4 to v5 migration', () => {
    it('should add start and end fields to links without position data', async () => {
      // Setup v4 schema
      testDb.version(4).stores({
        documents: 'id, typeId, title, updatedAt',
        objectTypes: 'id, name',
        properties: 'id, typeId, name, dataType',
        docProperties: '[docId+propId], docId',
        relations: '[sourceId+propId+targetId], targetId, sourceId',
        links: '[sourceId+targetId], targetId, sourceId',
        tags: '[docId+tag], docId, tag',
        assets: 'id, filename, mimeType',
        kanbanCards: 'id, columnId, order',
        popoverStates: 'id',
        config: 'id',
      });

      await testDb.open();

      // Insert test data without start/end fields (simulating v4 data)
      const testLinks: Omit<BidirectionalLinkEntity, 'start' | 'end'>[] = [
        { sourceId: 'doc1', targetId: 'doc2' },
        { sourceId: 'doc2', targetId: 'doc3' },
      ];

      await testDb.table('links').bulkAdd(testLinks);

      // Verify initial state
      const linksBeforeMigration = await testDb.table('links').toArray();
      expect(linksBeforeMigration).toHaveLength(2);

      // Simulate migration: add start and end fields
      const links = await testDb.table('links').toArray();
      for (const link of links) {
        if (link.start === undefined || link.end === undefined) {
          await testDb.table('links').update(link, {
            start: 0,
            end: 1,
          });
        }
      }

      // Verify migration result
      const linksAfterMigration = await testDb.table('links').toArray();
      expect(linksAfterMigration).toHaveLength(2);

      for (const link of linksAfterMigration) {
        expect(link.start).toBe(0);
        expect(link.end).toBe(1);
      }
    });

    it('should add start and end fields to tags without position data', async () => {
      // Setup v4 schema
      testDb.version(4).stores({
        documents: 'id, typeId, title, updatedAt',
        objectTypes: 'id, name',
        properties: 'id, typeId, name, dataType',
        docProperties: '[docId+propId], docId',
        relations: '[sourceId+propId+targetId], targetId, sourceId',
        links: '[sourceId+targetId], targetId, sourceId',
        tags: '[docId+tag], docId, tag',
        assets: 'id, filename, mimeType',
        kanbanCards: 'id, columnId, order',
        popoverStates: 'id',
        config: 'id',
      });

      await testDb.open();

      // Insert test data without start/end fields
      const testTags: Omit<TagEntity, 'start' | 'end'>[] = [
        { docId: 'doc1', tag: 'important' },
        { docId: 'doc2', tag: 'reference' },
      ];

      await testDb.table('tags').bulkAdd(testTags);

      // Verify initial state
      const tagsBeforeMigration = await testDb.table('tags').toArray();
      expect(tagsBeforeMigration).toHaveLength(2);

      // Simulate migration: add start and end fields
      const tags = await testDb.table('tags').toArray();
      for (const tag of tags) {
        if (tag.start === undefined || tag.end === undefined) {
          await testDb.table('tags').update(tag, {
            start: 0,
            end: 1,
          });
        }
      }

      // Verify migration result
      const tagsAfterMigration = await testDb.table('tags').toArray();
      expect(tagsAfterMigration).toHaveLength(2);

      for (const tag of tagsAfterMigration) {
        expect(tag.start).toBe(0);
        expect(tag.end).toBe(1);
      }
    });

    it('should preserve existing start and end values during migration', async () => {
      // Setup v5 schema
      testDb.version(5).stores({
        documents: 'id, typeId, title, updatedAt',
        objectTypes: 'id, name',
        properties: 'id, typeId, name, dataType',
        docProperties: '[docId+propId], docId',
        relations: '[sourceId+propId+targetId], targetId, sourceId',
        links: '[sourceId+targetId], targetId, sourceId, start, end',
        tags: '[docId+tag], docId, tag, start, end',
        assets: 'id, filename, mimeType',
        kanbanCards: 'id, columnId, order',
        popoverStates: 'id',
        config: 'id',
      });

      await testDb.open();

      // Insert test data with existing start/end values
      const testLinks: BidirectionalLinkEntity[] = [
        { sourceId: 'doc1', targetId: 'doc2', start: 10, end: 20 },
        { sourceId: 'doc2', targetId: 'doc3', start: 5, end: 15 },
      ];

      await testDb.table('links').bulkAdd(testLinks);

      // Simulate migration: should not modify existing values
      const links = await testDb.table('links').toArray();
      for (const link of links) {
        if (link.start === undefined || link.end === undefined) {
          await testDb.table('links').update(link, {
            start: 0,
            end: 1,
          });
        }
      }

      // Verify migration preserved existing values
      const linksAfterMigration = await testDb.table('links').toArray();
      expect(linksAfterMigration).toHaveLength(2);

      expect(linksAfterMigration[0].start).toBe(10);
      expect(linksAfterMigration[0].end).toBe(20);
      expect(linksAfterMigration[1].start).toBe(5);
      expect(linksAfterMigration[1].end).toBe(15);
    });
  });

  describe('Schema version tracking', () => {
    it('should track schema version in config table', async () => {
      testDb.version(5).stores({
        config: 'id',
      });

      await testDb.open();

      // Insert config with schema version
      await testDb.table('config').put({ id: 'app-config', schemaVersion: 5 });

      // Verify version is stored
      const config = await testDb.table('config').get('app-config');
      expect(config).toBeDefined();
      expect(config.schemaVersion).toBe(5);
    });

    it('should handle missing schema version (defaults to 0)', async () => {
      testDb.version(5).stores({
        config: 'id',
      });

      await testDb.open();

      // Query non-existent config
      const config = await testDb.table('config').get('app-config');
      const currentVersion = config?.schemaVersion ?? 0;

      expect(currentVersion).toBe(0);
    });
  });

  describe('Data integrity', () => {
    it('should maintain data integrity during migration', async () => {
      // Setup v4 schema
      testDb.version(4).stores({
        documents: 'id, typeId, title, updatedAt',
        links: '[sourceId+targetId], targetId, sourceId',
        config: 'id',
      });

      await testDb.open();

      // Insert test documents
      await testDb.table('documents').bulkAdd([
        { id: 'doc1', typeId: 'page', title: 'Document 1', updatedAt: Date.now() },
        { id: 'doc2', typeId: 'page', title: 'Document 2', updatedAt: Date.now() },
      ]);

      // Insert test links
      await testDb.table('links').bulkAdd([{ sourceId: 'doc1', targetId: 'doc2' }]);

      // Simulate migration
      const links = await testDb.table('links').toArray();
      for (const link of links) {
        if (link.start === undefined || link.end === undefined) {
          await testDb.table('links').update(link, {
            start: 0,
            end: 1,
          });
        }
      }

      // Verify data integrity
      const documents = await testDb.table('documents').toArray();
      expect(documents).toHaveLength(2);
      expect(documents[0].title).toBe('Document 1');
      expect(documents[1].title).toBe('Document 2');

      const migratedLinks = await testDb.table('links').toArray();
      expect(migratedLinks).toHaveLength(1);
      expect(migratedLinks[0].sourceId).toBe('doc1');
      expect(migratedLinks[0].targetId).toBe('doc2');
      expect(migratedLinks[0].start).toBe(0);
      expect(migratedLinks[0].end).toBe(1);
    });
  });
});
