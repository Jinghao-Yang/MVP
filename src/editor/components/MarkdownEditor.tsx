import { memo, useCallback, useMemo, useState } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { DocumentStats } from './DocumentStats';

type Extension = NonNullable<ReactCodeMirrorProps['extensions']>[number];

export const MAX_DOCUMENT_SIZE = 100000;
export const WARNING_THRESHOLD = 0.8;

interface MarkdownEditorProps {
  docId: string;
  value: string;
  onChange: (value: string) => void;
  extensions?: Extension[];
  className?: string;
  onBlur?: () => void;
  showStats?: boolean;
  onExport?: () => void;
  onSplit?: () => void;
}

function arePropsEqual(prevProps: MarkdownEditorProps, nextProps: MarkdownEditorProps): boolean {
  return (
    prevProps.docId === nextProps.docId &&
    prevProps.value === nextProps.value &&
    prevProps.showStats === nextProps.showStats
  );
}

export const MarkdownEditor = memo(function MarkdownEditor({
  value,
  onChange,
  extensions = [],
  className = '',
  onBlur,
  showStats = true,
  onExport,
  onSplit,
}: MarkdownEditorProps) {
  const [isReadOnly, setIsReadOnly] = useState(false);

  const handleChange = useCallback(
    (val: string) => {
      if (!isReadOnly) {
        onChange(val);
      }
    },
    [onChange, isReadOnly]
  );

  const handleToggleReadOnly = useCallback(() => {
    setIsReadOnly((prev) => !prev);
  }, []);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
    } else {
      // 默认导出逻辑
      const blob = new Blob([value], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `document-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }, [value, onExport]);

  const handleSplit = useCallback(() => {
    if (onSplit) {
      onSplit();
    } else {
      // 默认分拆逻辑 - 简单示例：按标题分拆
      console.log('Split document functionality - to be implemented');
    }
  }, [onSplit]);

  const defaultExtensions: Extension[] = [
    markdown(),
    EditorView.lineWrapping,
    EditorView.editable.of(!isReadOnly),
    ...extensions,
  ];

  const shouldShowWarning = useMemo(() => {
    const percentage = value.length / MAX_DOCUMENT_SIZE;
    return percentage >= WARNING_THRESHOLD;
  }, [value]);

  return (
    <div className="space-y-4">
      {/* 文档统计信息 */}
      {showStats && (
        <DocumentStats
          content={value}
          maxSize={MAX_DOCUMENT_SIZE}
          warningThreshold={WARNING_THRESHOLD}
          onExport={shouldShowWarning ? handleExport : undefined}
          onSplit={shouldShowWarning ? handleSplit : undefined}
          onToggleReadOnly={shouldShowWarning ? handleToggleReadOnly : undefined}
          isReadOnly={isReadOnly}
        />
      )}

      {/* 编辑器主体 */}
      <div className={`relative ${isReadOnly ? 'opacity-75' : ''}`}>
        <CodeMirror
          value={value}
          onChange={handleChange}
          extensions={defaultExtensions}
          theme="none"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: false,
            bracketMatching: false,
          }}
          className={className}
          onBlur={onBlur}
          editable={!isReadOnly}
        />
        {isReadOnly && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed pointer-events-none" />
        )}
      </div>
    </div>
  );
}, arePropsEqual);
