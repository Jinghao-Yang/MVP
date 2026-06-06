/* ================================================
   FILE: src/services/export-service.ts
   ================================================ */
import { db } from '@/db/dexie';
import { showErrorToast } from '@/utils/error-handler';

export const exportService = {
  /**
   * 生成带有 YAML frontmatter 的 Markdown 文档
   * 聚合文档属性和关系数据，生成标准化的导出格式
   *
   * @param docId - 文档 ID
   * @returns 带有 YAML frontmatter 的 Markdown 字符串，文档不存在或生成失败时返回空字符串
   *
   * @remarks
   * - frontmatter 包含：id、title、type、badge、updated_at 等标准字段
   * - 自动聚合 docProperties 表中的自定义属性
   * - 自动聚合 relations 表中的关联关系
   * - 属性名会被转换为小写并替换空格为下划线
   * - 生成失败时会显示错误提示
   */
  async generateMarkdownWithFrontmatter(docId: string): Promise<string> {
    try {
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
    } catch (error) {
      console.error('Failed to generate markdown', error);
      showErrorToast('Failed to generate export content');
      return '';
    }
  },

  /**
   * 触发文档下载
   * 生成 Markdown 文件并启动浏览器下载
   *
   * @param docId - 文档 ID
   * @throws 如果文档不存在时抛出错误
   *
   * @remarks
   * - 文件名基于文档标题生成（小写、连字符分隔）
   * - 文件格式为 .md，编码为 UTF-8
   * - 下载完成后自动清理创建的 DOM 元素和 Blob URL
   * - 下载失败时会显示错误提示并重新抛出错误
   */
  async triggerDownload(docId: string): Promise<void> {
    try {
      const doc = await db.documents.get(docId);
      if (!doc) {
        throw new Error(`Document ${docId} not found`);
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
    } catch (error) {
      console.error('Failed to trigger download', error);
      showErrorToast('Failed to download document');
      throw error;
    }
  },
};
