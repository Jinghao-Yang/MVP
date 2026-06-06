/**
 * SafeText 组件 - 安全渲染用户内容，防范 XSS 攻击
 * 支持两种模式：
 * - sanitize: 使用 DOMPurify 清洗 HTML，保留安全的标签
 * - escape: 纯文本模式，React 自动转义（默认）
 */
import { sanitizeHtml } from '@/utils/sanitize';

export interface SafeTextProps {
  /** 需要渲染的内容 */
  content: string;
  /** 渲染模式：sanitize（清洗 HTML）或 escape（纯文本模式，React 自动转义） */
  mode?: 'sanitize' | 'escape';
  /** 最大长度，超过则截断 */
  maxLength?: number;
  /** 截断后缀 */
  suffix?: string;
  /** 自定义类名 */
  className?: string;
  /** 元素标签，默认为 span */
  as?: 'span' | 'div' | 'p';
}

/**
 * 安全渲染文本内容的组件
 * 用于渲染来自用户输入或数据库的内容，防范 XSS 攻击
 *
 * @example
 * // 纯文本模式（默认）- React 自动转义
 * <SafeText content={userInput} />
 *
 * @example
 * // 清洗 HTML，保留安全标签
 * <SafeText content={htmlContent} mode="sanitize" />
 *
 * @example
 * // 截断文本
 * <SafeText content={longText} maxLength={100} />
 */
export function SafeText({
  content,
  mode = 'escape',
  maxLength,
  suffix = '...',
  className,
  as: Component = 'span',
}: SafeTextProps) {
  const processedContent = (() => {
    if (!content) return '';

    let text = content;

    // 先截断（如果需要）
    if (maxLength && text.length > maxLength) {
      text = text.substring(0, maxLength) + suffix;
    }

    // 根据模式处理
    if (mode === 'sanitize') {
      return sanitizeHtml(text);
    }

    // escape 模式：直接返回文本，React 会自动转义
    return text;
  })();

  // 如果是 sanitize 模式，使用 dangerouslySetInnerHTML
  if (mode === 'sanitize') {
    return (
      <Component className={className} dangerouslySetInnerHTML={{ __html: processedContent }} />
    );
  }

  // escape 模式，React 会自动转义
  return <Component className={className}>{processedContent}</Component>;
}
