import { memo, useCallback, useMemo } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { AlertTriangle } from 'lucide-react';

type Extension = NonNullable<ReactCodeMirrorProps['extensions']>[number];

const MAX_DOCUMENT_SIZE = 100000;
const WARNING_THRESHOLD = 0.8;

interface MarkdownEditorProps {
  docId: string;
  value: string;
  onChange: (value: string) => void;
  extensions?: Extension[];
  className?: string;
  onBlur?: () => void;
}

function arePropsEqual(prevProps: MarkdownEditorProps, nextProps: MarkdownEditorProps): boolean {
  return prevProps.docId === nextProps.docId && prevProps.value === nextProps.value;
}

export const MarkdownEditor = memo(function MarkdownEditor({
  value,
  onChange,
  extensions = [],
  className = '',
  onBlur,
}: MarkdownEditorProps) {
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  const defaultExtensions: Extension[] = [markdown(), EditorView.lineWrapping, ...extensions];

  const sizeWarning = useMemo(() => {
    const percentage = value.length / MAX_DOCUMENT_SIZE;
    if (percentage >= 1) {
      return { exceeded: true, percentage: 100 };
    }
    if (percentage >= WARNING_THRESHOLD) {
      return { exceeded: false, percentage: Math.round(percentage * 100) };
    }
    return null;
  }, [value]);

  return (
    <div className="relative">
      {sizeWarning && (
        <div
          className={`absolute -top-8 left-0 right-0 flex items-center gap-2 px-3 py-1.5 rounded text-xs font-sys ${
            sizeWarning.exceeded
              ? 'bg-red-50 border border-red-200 text-red-700'
              : 'bg-amber-50 border border-amber-200 text-amber-700'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          {sizeWarning.exceeded
            ? `Document size exceeded ${MAX_DOCUMENT_SIZE.toLocaleString()} characters`
            : `Document size: ${sizeWarning.percentage}% of limit`}
        </div>
      )}
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
      />
    </div>
  );
}, arePropsEqual);
