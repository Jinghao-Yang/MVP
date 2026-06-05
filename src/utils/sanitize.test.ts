/**
 * 安全内容处理工具测试
 * 验证 XSS 防范措施的有效性
 */
import { describe, it, expect } from 'vitest';
import { sanitizeHtml, truncateText, escapeHtml, removeMarkdownHeaders } from './sanitize';

describe('sanitize.ts - XSS 防范测试', () => {
  describe('sanitizeHtml', () => {
    it('应该移除 script 标签', () => {
      const malicious = '<script>alert("XSS")</script>Hello World';
      const result = sanitizeHtml(malicious);
      expect(result).toBe('Hello World');
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('应该移除 onclick 等事件处理器', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('alert');
    });

    it('应该移除 javascript: 协议', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('javascript:');
    });

    it('应该保留安全的 HTML 标签', () => {
      const safe = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHtml(safe);
      expect(result).toContain('<p>');
      expect(result).toContain('<strong>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('应该保留安全的链接', () => {
      const safe = '<a href="https://example.com" title="Example">Link</a>';
      const result = sanitizeHtml(safe);
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('title="Example"');
      expect(result).toContain('Link');
    });

    it('应该移除不安全的标签如 iframe', () => {
      const malicious = '<iframe src="https://evil.com"></iframe><p>Safe</p>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('<p>Safe</p>');
    });

    it('应该处理嵌套的恶意内容', () => {
      const malicious = '<p><script>alert("XSS")</script>Safe text</p>';
      const result = sanitizeHtml(malicious);
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe text');
    });

    it('应该处理空字符串', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });
  });

  describe('truncateText', () => {
    it('应该正确截断长文本', () => {
      const text = 'This is a very long text that needs to be truncated';
      const result = truncateText(text, 20);
      expect(result).toBe('This is a very long ...');
      expect(result.length).toBe(23); // 20 + 3 ('...')
    });

    it('不应该截断短文本', () => {
      const text = 'Short text';
      const result = truncateText(text, 20);
      expect(result).toBe(text);
    });

    it('应该使用自定义后缀', () => {
      const text = 'This is a very long text';
      const result = truncateText(text, 10, '…');
      expect(result).toBe('This is a …');
    });

    it('应该处理空字符串', () => {
      const result = truncateText('', 10);
      expect(result).toBe('');
    });

    it('应该处理 undefined', () => {
      const result = truncateText(undefined as unknown as string, 10);
      expect(result).toBe(undefined);
    });
  });

  describe('escapeHtml', () => {
    it('应该转义特殊字符', () => {
      const text = '<script>alert("XSS")</script>';
      const result = escapeHtml(text);
      expect(result).toContain('&lt;script&gt;');
      expect(result).toContain('&quot;XSS&quot;');
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).toContain('&#x2F;'); // 斜杠也会被转义
    });

    it('应该转义 & 符号', () => {
      const text = 'Tom & Jerry';
      const result = escapeHtml(text);
      expect(result).toBe('Tom &amp; Jerry');
    });

    it('应该转义引号', () => {
      const text = 'He said "Hello" and \'Goodbye\'';
      const result = escapeHtml(text);
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
    });

    it('应该处理空字符串', () => {
      const result = escapeHtml('');
      expect(result).toBe('');
    });
  });

  describe('removeMarkdownHeaders', () => {
    it('应该移除一级标题', () => {
      const markdown = '# Title\n\nContent here';
      const result = removeMarkdownHeaders(markdown);
      expect(result).not.toContain('# Title');
      expect(result).toContain('Content here');
    });

    it('应该移除多级标题', () => {
      const markdown = '# Main Title\n## Subtitle\n### Sub-subtitle\nContent';
      const result = removeMarkdownHeaders(markdown);
      expect(result).not.toContain('# Main Title');
      expect(result).not.toContain('## Subtitle');
      expect(result).not.toContain('### Sub-subtitle');
      expect(result).toContain('Content');
    });

    it('应该保留非标题内容', () => {
      const markdown = 'This is **bold** and *italic* text';
      const result = removeMarkdownHeaders(markdown);
      expect(result).toBe(markdown);
    });

    it('应该处理空字符串', () => {
      const result = removeMarkdownHeaders('');
      expect(result).toBe('');
    });
  });

  describe('XSS 攻击场景测试', () => {
    it('应该防范基于标签的 XSS', () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
        '<body onload=alert("XSS")>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('onerror');
        expect(result).not.toContain('onload');
      });
    });

    it('应该防范基于事件处理器的 XSS', () => {
      const attacks = [
        '<div onclick="alert(\'XSS\')">Click</div>',
        '<a href="#" onmouseover="alert(\'XSS\')">Hover</a>',
        '<input onfocus="alert(\'XSS\')" autofocus>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('onclick');
        expect(result).not.toContain('onmouseover');
        expect(result).not.toContain('onfocus');
        expect(result).not.toContain('alert');
      });
    });

    it('应该防范基于协议的 XSS', () => {
      const attacks = [
        '<a href="javascript:alert(\'XSS\')">Link</a>',
        '<a href="JAVASCRIPT:alert(\'XSS\')">Link</a>',
        '<a href="data:text/html,<script>alert(\'XSS\')</script>">Link</a>',
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('JAVASCRIPT:');
        expect(result).not.toContain('data:text/html');
      });
    });

    it('应该防范基于样式的 XSS', () => {
      const attacks = [
        '<div style="background:url(javascript:alert(\'XSS\'))">Div</div>',
        "<style>body{background:url(javascript:alert('XSS'))}</style>",
      ];

      attacks.forEach((attack) => {
        const result = sanitizeHtml(attack);
        expect(result).not.toContain('javascript:');
        expect(result).not.toContain('alert');
      });
    });
  });
});
