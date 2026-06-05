/* ================================================
   FILE: src/services/export-service.ts
   ================================================ */
import { db } from '@/db/dexie';

export const exportService = {
  /**
   * Generates a valid Markdown string decorated with aggregated YAML frontmatter.
   * Compiles custom properties from 'docProperties' and relationships from 'relations'.
   */
  async generateMarkdownWithFrontmatter(docId: string): Promise<string> {
    const doc = await db.documents.get(docId);
    if (!doc) return '';

    // Query both docProperties and relations tables
    const docProperties = await db.docProperties.where('docId').equals(docId).toArray();
    const relations = await db.relations.where('sourceId').equals(docId).toArray();
    const properties = await db.properties.toArray();

    // YAML key-value map initialization
    const frontmatter: Record<string, unknown> = {};

    // Standard structural attributes
    frontmatter.id = doc.id;
    frontmatter.title = doc.title;
    frontmatter.type = doc.typeId || 'page';
    frontmatter.badge = doc.badge || 'Evergreen';
    frontmatter.updated_at = new Date(doc.updatedAt).toISOString();

    // Map doc properties (e.g. status, priority, due date)
    docProperties.forEach((dp) => {
      const propDefinition = properties.find((p) => p.id === dp.propId);
      if (propDefinition && dp.value) {
        const normalizedKey = propDefinition.name.toLowerCase().replace(/\s+/g, '_');
        frontmatter[normalizedKey] = dp.value;
      }
    });

    // Map structural relations (e.g. Author linking to a Person document)
    for (const rel of relations) {
      const propDefinition = properties.find((p) => p.id === rel.propId);
      if (propDefinition) {
        const targetNode = await db.documents.get(rel.targetId);
        if (targetNode) {
          const normalizedKey = propDefinition.name.toLowerCase().replace(/\s+/g, '_');
          if (!frontmatter[normalizedKey]) {
            frontmatter[normalizedKey] = [];
          }
          if (Array.isArray(frontmatter[normalizedKey])) {
            frontmatter[normalizedKey].push({
              id: rel.targetId,
              title: targetNode.title,
            });
          }
        }
      }
    }

    // Convert JavaScript object map to physical formatted YAML block
    let frontmatterYaml = '---\n';
    Object.entries(frontmatter).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        frontmatterYaml += `${key}:\n`;
        val.forEach((item) => {
          frontmatterYaml += `  - id: "${item.id}"\n    title: "${item.title}"\n`;
        });
      } else {
        // Escape special characters by wrapping strings in quotes
        const escapedVal = typeof val === 'string' ? val.replace(/"/g, '\\"') : val;
        frontmatterYaml += `${key}: "${escapedVal}"\n`;
      }
    });
    frontmatterYaml += '---\n\n';

    return frontmatterYaml + doc.content;
  },

  /**
   * Generates frontmatter aggregated Markdown file and triggers interactive browser download.
   */
  async triggerDownload(docId: string): Promise<void> {
    const doc = await db.documents.get(docId);
    if (!doc) {
      throw new Error(`Target document ${docId} not found in knowledge base.`);
    }

    const payload = await this.generateMarkdownWithFrontmatter(docId);
    const blob = new Blob([payload], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Dynamic invisible anchor triggers download
    const anchor = document.createElement('a');
    anchor.href = url;
    const sanitizedTitle = doc.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    anchor.download = `${sanitizedTitle || 'axiom-node'}.md`;
    document.body.appendChild(anchor);
    anchor.click();

    // Clean viewport structures
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },
};
