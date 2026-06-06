/**
 * SafeText 组件测试
 * 验证 XSS 防护效果
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeText } from './SafeText';

describe('SafeText 组件', () => {
  describe('escape 模式（默认）', () => {
    it('应该安全显示 HTML 内容（React 自动转义）', () => {
      const malicious = '<script>alert("XSS")</script>';
      render(<SafeText content={malicious} />);

      // React 会自动转义，所以应该显示原始文本
      expect(screen.getByText('<script>alert("XSS")</script>')).toBeInTheDocument();
    });

    it('应该安全显示特殊字符', () => {
      const text = 'Tom & Jerry said "Hello"';
      render(<SafeText content={text} />);

      // React 会自动转义，所以应该显示原始文本
      expect(screen.getByText('Tom & Jerry said "Hello"')).toBeInTheDocument();
    });

    it('应该正常显示安全文本', () => {
      const safeText = 'Hello World';
      render(<SafeText content={safeText} />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('应该处理空字符串', () => {
      const { container } = render(<SafeText content="" />);
      expect(container.textContent).toBe('');
    });
  });

  describe('sanitize 模式', () => {
    it('应该移除 script 标签', () => {
      const malicious = '<script>alert("XSS")</script>Hello World';
      render(<SafeText content={malicious} mode="sanitize" />);

      // 应该只显示文本，不包含 script
      expect(screen.getByText('Hello World')).toBeInTheDocument();
      expect(screen.queryByText('alert')).not.toBeInTheDocument();
    });

    it('应该移除事件处理器', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      render(<SafeText content={malicious} mode="sanitize" />);

      // 应该显示文本，但不包含 onclick
      const element = screen.getByText('Click me');
      expect(element).toBeInTheDocument();
      expect(element.getAttribute('onclick')).toBeNull();
    });

    it('应该保留安全的 HTML 标签', () => {
      const safe = '<p>Hello <strong>World</strong></p>';
      const { container } = render(<SafeText content={safe} mode="sanitize" />);

      // 应该渲染 HTML 标签
      expect(container.querySelector('p')).toBeInTheDocument();
      expect(container.querySelector('strong')).toBeInTheDocument();
    });

    it('应该保留安全的链接', () => {
      const safe = '<a href="https://example.com">Link</a>';
      const { container } = render(<SafeText content={safe} mode="sanitize" />);

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link?.getAttribute('href')).toBe('https://example.com');
    });

    it('应该移除 javascript: 协议', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Link</a>';
      const { container } = render(<SafeText content={malicious} mode="sanitize" />);

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      const href = link?.getAttribute('href');
      expect(href).toBeNull(); // javascript: 协议被移除，href 应该为 null
    });

    it('应该移除不安全的标签如 iframe', () => {
      const malicious = '<iframe src="https://evil.com"></iframe><p>Safe</p>';
      const { container } = render(<SafeText content={malicious} mode="sanitize" />);

      expect(container.querySelector('iframe')).toBeNull();
      expect(container.querySelector('p')).toBeInTheDocument();
    });
  });

  describe('截断功能', () => {
    it('应该截断长文本', () => {
      const longText = 'This is a very long text that needs to be truncated';
      render(<SafeText content={longText} maxLength={20} />);

      expect(screen.getByText('This is a very long ...')).toBeInTheDocument();
    });

    it('不应该截断短文本', () => {
      const shortText = 'Short text';
      render(<SafeText content={shortText} maxLength={20} />);

      expect(screen.getByText('Short text')).toBeInTheDocument();
    });

    it('应该使用自定义后缀', () => {
      const longText = 'This is a very long text';
      render(<SafeText content={longText} maxLength={10} suffix="…" />);

      expect(screen.getByText('This is a …')).toBeInTheDocument();
    });

    it('应该在 sanitize 模式下正确截断纯文本', () => {
      const longText = 'This is a very long text that needs to be truncated';
      const { container } = render(<SafeText content={longText} mode="sanitize" maxLength={20} />);

      expect(container.textContent).toBe('This is a very long ...');
    });
  });

  describe('自定义元素标签', () => {
    it('应该支持 div 标签', () => {
      const { container } = render(<SafeText content="Hello" as="div" />);
      expect(container.querySelector('div')).toBeInTheDocument();
    });

    it('应该支持 p 标签', () => {
      const { container } = render(<SafeText content="Hello" as="p" />);
      expect(container.querySelector('p')).toBeInTheDocument();
    });

    it('默认应该使用 span 标签', () => {
      const { container } = render(<SafeText content="Hello" />);
      expect(container.querySelector('span')).toBeInTheDocument();
    });
  });

  describe('自定义类名', () => {
    it('应该应用自定义类名', () => {
      const { container } = render(<SafeText content="Hello" className="custom-class" />);
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });
  });

  describe('XSS 攻击场景测试', () => {
    it('应该防范基于标签的 XSS（escape 模式）', () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
      ];

      attacks.forEach((attack) => {
        const { container } = render(<SafeText content={attack} />);
        // React 会自动转义，所以应该显示原始文本，而不是执行脚本
        expect(container.textContent).toBe(attack);
        // 确保没有实际的 HTML 元素被创建
        expect(container.querySelector('script')).toBeNull();
        expect(container.querySelector('img')).toBeNull();
        expect(container.querySelector('svg')).toBeNull();
      });
    });

    it('应该防范基于标签的 XSS（sanitize 模式）', () => {
      const attacks = [
        '<script>alert("XSS")</script>',
        '<img src=x onerror=alert("XSS")>',
        '<svg onload=alert("XSS")>',
      ];

      attacks.forEach((attack) => {
        const { container } = render(<SafeText content={attack} mode="sanitize" />);
        expect(container.innerHTML).not.toContain('alert');
        expect(container.innerHTML).not.toContain('onerror');
        expect(container.innerHTML).not.toContain('onload');
      });
    });

    it('应该防范基于事件处理器的 XSS', () => {
      const attacks = [
        '<div onclick="alert(\'XSS\')">Click</div>',
        '<a href="#" onmouseover="alert(\'XSS\')">Hover</a>',
      ];

      attacks.forEach((attack) => {
        const { container } = render(<SafeText content={attack} mode="sanitize" />);
        expect(container.innerHTML).not.toContain('onclick');
        expect(container.innerHTML).not.toContain('onmouseover');
        expect(container.innerHTML).not.toContain('alert');
      });
    });

    it('应该防范基于协议的 XSS', () => {
      const attacks = [
        '<a href="javascript:alert(\'XSS\')">Link</a>',
        '<a href="JAVASCRIPT:alert(\'XSS\')">Link</a>',
      ];

      attacks.forEach((attack) => {
        const { container } = render(<SafeText content={attack} mode="sanitize" />);
        expect(container.innerHTML.toLowerCase()).not.toContain('javascript:');
      });
    });
  });
});
