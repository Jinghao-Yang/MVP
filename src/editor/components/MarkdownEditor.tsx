import { memo, useCallback } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';

type Extension = NonNullable<ReactCodeMirrorProps['extensions']>[number];

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

  return (
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
  );
}, arePropsEqual);
