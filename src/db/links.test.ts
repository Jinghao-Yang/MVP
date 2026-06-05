/**
 * parseMarkdownLinks 函数的单元测试
 * 测试使用 marked 解析器提取 Markdown 链接
 */

import { marked } from 'marked';
import type { Token, Tokens } from 'marked';
import { describe, it, expect } from 'vitest';

/**
 * 扩展的链接实体，包含链接类型信息
 */
interface ParsedLink {
  targetId: string;
  type: 'link' | 'image';
  text: string;
}

/**
 * 递归遍历 token 提取所有链接
 */
function extractLinksFromTokens(tokens: Token[]): ParsedLink[] {
  const links: ParsedLink[] = [];

  for (const token of tokens) {
    if (token.type === 'link') {
      const linkToken = token as Tokens.Link;
      if (linkToken.href && linkToken.href.trim()) {
        links.push({
          targetId: linkToken.href,
          type: 'link',
          text: linkToken.text || '',
        });
      }
    }

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
      for (const header of tableToken.header) {
        links.push(...extractLinksFromTokens(header.tokens));
      }
    }

    // 递归处理嵌套的 tokens
    if ('tokens' in token && Array.isArray(token.tokens)) {
      links.push(...extractLinksFromTokens(token.tokens));
    }
  }

  return links;
}

/**
 * 解析 Markdown 文本中的链接
 */
function parseMarkdownLinks(
  sourceId: string,
  text: string
): { sourceId: string; targetId: string }[] {
  const tokens = marked.lexer(text);
  const links = extractLinksFromTokens(tokens);
  return links.map((link) => ({ sourceId, targetId: link.targetId }));
}

describe('parseMarkdownLinks', () => {
  describe('基础链接解析', () => {
    it('应该解析普通链接', () => {
      const markdown = '这是一个 [链接](https://example.com) 测试';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        sourceId: 'doc-1',
        targetId: 'https://example.com',
      });
    });

    it('应该解析多个链接', () => {
      const markdown = '第一个 [链接1](url1) 和第二个 [链接2](url2)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(2);
      expect(result[0].targetId).toBe('url1');
      expect(result[1].targetId).toBe('url2');
    });

    it('应该处理空文本', () => {
      const result = parseMarkdownLinks('doc-1', '');
      expect(result).toHaveLength(0);
    });

    it('应该处理没有链接的文本', () => {
      const markdown = '这是一段普通文本，没有链接。';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(0);
    });
  });

  describe('图片链接解析', () => {
    it('应该解析图片链接', () => {
      const markdown = '这是一个图片 ![图片描述](https://example.com/image.png)';
      const tokens = marked.lexer(markdown);
      const links = extractLinksFromTokens(tokens);
      expect(links).toHaveLength(1);
      expect(links[0].type).toBe('image');
      expect(links[0].targetId).toBe('https://example.com/image.png');
    });

    it('应该同时解析图片和普通链接', () => {
      const markdown = '![图片](img.png) 和 [链接](url)';
      const tokens = marked.lexer(markdown);
      const links = extractLinksFromTokens(tokens);
      expect(links).toHaveLength(2);
      expect(links[0].type).toBe('image');
      expect(links[1].type).toBe('link');
    });
  });

  describe('嵌套括号处理', () => {
    it('应该正确处理 URL 中的嵌套括号', () => {
      const markdown = '链接 [维基百科](https://zh.wikipedia.org/wiki/数学_(学科)) 测试';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('https://zh.wikipedia.org/wiki/数学_(学科)');
    });

    it('应该处理多层嵌套括号', () => {
      const markdown = '链接 [测试](https://example.com/path(a(b)c)) 结束';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('https://example.com/path(a(b)c)');
    });
  });

  describe('转义字符处理', () => {
    it('应该正确处理转义的方括号', () => {
      const markdown = '文本 \\[非链接\\] 和 [真实链接](url)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('url');
    });

    it('应该正确处理转义的圆括号', () => {
      const markdown = '链接 [测试](https://example.com/path\\(with\\(parens\\))';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
    });

    it('应该正确处理转义的反斜杠', () => {
      const markdown = '链接 [测试](https://example.com/path\\\\slash)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
    });
  });

  describe('复杂场景', () => {
    it('应该解析列表中的链接', () => {
      const markdown = `
- 项目1 [链接1](url1)
- 项目2 [链接2](url2)
- 项目3
`;
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(2);
      expect(result[0].targetId).toBe('url1');
      expect(result[1].targetId).toBe('url2');
    });

    it('应该解析引用块中的链接', () => {
      const markdown = `
> 这是一个引用
> 包含 [链接](url)
`;
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('url');
    });

    it('应该解析表格中的链接', () => {
      const markdown = `
| 列1 | 列2 |
|-----|-----|
| [链接1](url1) | [链接2](url2) |
`;
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(2);
      expect(result[0].targetId).toBe('url1');
      expect(result[1].targetId).toBe('url2');
    });

    it('应该解析标题中的链接', () => {
      const markdown = '# 标题包含 [链接](url)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('url');
    });

    it('应该解析代码块外的链接（不解析代码块内的）', () => {
      const markdown = `
正常链接 [外部链接](url1)

\`\`\`
代码块中的 [假链接](fake-url)
\`\`\`

另一个 [真实链接](url2)
`;
      const result = parseMarkdownLinks('doc-1', markdown);
      // marked 默认不解析代码块内的链接
      expect(result).toHaveLength(2);
      expect(result[0].targetId).toBe('url1');
      expect(result[1].targetId).toBe('url2');
    });
  });

  describe('边界情况', () => {
    it('应该跳过空链接', () => {
      const markdown = '空链接 []( ) 和 [有效链接](url)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('url');
    });

    it('应该处理只有空格的链接', () => {
      const markdown = '[空格链接](   ) 和 [有效链接](url)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('url');
    });

    it('应该处理特殊字符 URL', () => {
      const markdown = '链接 [测试](https://example.com/path?query=value&foo=bar#anchor)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('https://example.com/path?query=value&foo=bar#anchor');
    });

    it('应该处理相对路径链接', () => {
      const markdown = '相对路径 [文档](./other-doc) 和 [上级](../parent)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(2);
      expect(result[0].targetId).toBe('./other-doc');
      expect(result[1].targetId).toBe('../parent');
    });

    it('应该处理 wiki 风格链接', () => {
      const markdown = 'Wiki 链接 [文档名](wiki-document-id)';
      const result = parseMarkdownLinks('doc-1', markdown);
      expect(result).toHaveLength(1);
      expect(result[0].targetId).toBe('wiki-document-id');
    });
  });
});
