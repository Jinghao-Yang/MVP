/**
 * 安全内容处理工具
 * 用于防范 XSS 攻击，确保用户内容安全显示
 */
import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

/**
 * 清洗 HTML 内容，移除恶意脚本和不安全的标签
 * @param html - 需要清洗的 HTML 字符串
 * @param options - DOMPurify 配置选项
 * @returns 清洗后的安全 HTML 字符串
 */
export function sanitizeHtml(html: string, options?: Config): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
    ...options,
  });
}

/**
 * 安全地截断文本内容
 * @param text - 需要截断的文本
 * @param maxLength - 最大长度
 * @param suffix - 截断后添加的后缀，默认为 '...'
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + suffix;
}

/**
 * 转义 HTML 特殊字符（用于纯文本显示）
 * 注意：React JSX 默认会转义，此函数用于非 JSX 场景或显式转义需求
 * @param text - 需要转义的文本
 * @returns 转义后的文本
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  return text.replace(/[&<>"'/]/g, (char) => map[char]);
}

/**
 * 移除 Markdown 标题标记（用于预览文本）
 * @param content - Markdown 内容
 * @returns 移除标题后的内容
 */
export function removeMarkdownHeaders(content: string): string {
  return content.replace(/^#+\s+.*\n?/gm, '');
}
