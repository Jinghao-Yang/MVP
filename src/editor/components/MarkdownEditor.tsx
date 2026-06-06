import { memo, useCallback, useMemo, useState, useEffect, useRef } from 'react';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { DocumentStats } from './DocumentStats';
import { assetService } from '@/services/asset-service';
import { toast } from 'sonner';
import { DOCUMENT } from '@/utils/constants';

type Extension = NonNullable<ReactCodeMirrorProps['extensions']>[number];

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
  onUpdate?: (update: ViewUpdate) => void;
}

function arePropsEqual(prevProps: MarkdownEditorProps, nextProps: MarkdownEditorProps): boolean {
  return (
    prevProps.docId === nextProps.docId &&
    prevProps.value === nextProps.value &&
    prevProps.showStats === nextProps.showStats
  );
}

const processImageFile = async (file: File, fileName?: string): Promise<string> => {
  const axiomUrl = await assetService.saveAsset(file);
  return `\n![${fileName || file.name}](${axiomUrl})\n`;
};

export const MarkdownEditor = memo(function MarkdownEditor({
  value,
  onChange,
  extensions = [],
  className = '',
  onBlur,
  showStats = true,
  onExport,
  onSplit,
  onUpdate,
}: MarkdownEditorProps) {
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [resolvedAssets, setResolvedAssets] = useState<Record<string, string>>({});
  const resolvedAssetsRef = useRef(resolvedAssets);

  useEffect(() => {
    resolvedAssetsRef.current = resolvedAssets;
  }, [resolvedAssets]);

  // Compile matching assets from document string periodically
  useEffect(() => {
    const regex = /axiom:\/\/asset\/[a-zA-Z0-9-]+/g;
    const matches = value.match(regex) || [];

    const resolveAll = async () => {
      const currentResolved = resolvedAssetsRef.current;
      const newResolved: Record<string, string> = { ...currentResolved };
      let updated = false;

      for (const rawUrl of matches) {
        if (!newResolved[rawUrl]) {
          const resolved = await assetService.resolveAssetUrl(rawUrl);
          newResolved[rawUrl] = resolved;
          updated = true;
        }
      }

      if (updated) {
        setResolvedAssets(newResolved);
      }
    };

    resolveAll();
  }, [value]);

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
      console.log('Split document functionality - to be implemented');
    }
  }, [onSplit]);

  // Drag Interceptor for OPFS
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        let textToInsert = '';
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            e.preventDefault();
            const markdown = await processImageFile(file);
            textToInsert += markdown;
          }
        }
        if (textToInsert) {
          onChange(value + textToInsert);
          toast.success('Stored asset to sandboxed OPFS bucket!');
        }
      }
    },
    [value, onChange]
  );

  // Paste Interceptor for OPFS
  const handlePaste = useCallback(
    async (e: React.ClipboardEvent<HTMLDivElement>) => {
      const items = e.clipboardData.items;
      let textToInsert = '';
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            const markdown = await processImageFile(file, 'pasted_image.png');
            textToInsert += markdown;
          }
        }
      }
      if (textToInsert) {
        onChange(value + textToInsert);
        toast.success('Pasted asset written to OPFS storage!');
      }
    },
    [value, onChange]
  );

  const defaultExtensions: Extension[] = [
    markdown(),
    EditorView.lineWrapping,
    EditorView.editable.of(!isReadOnly),
    ...extensions,
  ];

  const shouldShowWarning = useMemo(() => {
    const percentage = value.length / DOCUMENT.MAX_DOCUMENT_SIZE;
    return percentage >= DOCUMENT.WARNING_THRESHOLD;
  }, [value]);

  const assetUrls = Object.keys(resolvedAssets);

  return (
    <div className="space-y-4">
      {/* 文档统计信息 */}
      {showStats && (
        <DocumentStats
          content={value}
          maxSize={DOCUMENT.MAX_DOCUMENT_SIZE}
          warningThreshold={DOCUMENT.WARNING_THRESHOLD}
          onExport={shouldShowWarning ? handleExport : undefined}
          onSplit={shouldShowWarning ? handleSplit : undefined}
          onToggleReadOnly={shouldShowWarning ? handleToggleReadOnly : undefined}
          isReadOnly={isReadOnly}
        />
      )}

      {/* 编辑器主体 */}
      <div
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPaste={handlePaste}
        className={`relative ${isReadOnly ? 'opacity-75' : ''}`}
      >
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
          onUpdate={onUpdate}
          editable={!isReadOnly}
        />
        {isReadOnly && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed pointer-events-none" />
        )}
      </div>

      {/* OPFS Media Tracing Panel */}
      {assetUrls.length > 0 && (
        <div className="border border-neutral-200/50 rounded-2xl p-4 bg-neutral-50/30 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase font-bold text-neutral-400">
            <span>OPFS Media Pipeline</span>
            <span className="text-[9px] bg-neutral-200 px-1.5 py-0.5 rounded text-neutral-500 font-bold">
              {assetUrls.length} Files
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {assetUrls.map((rawUrl) => (
              <div
                key={rawUrl}
                className="flex flex-col items-center gap-1 bg-white p-2 border border-neutral-200 rounded-lg group shadow-sm"
              >
                <img
                  src={resolvedAssets[rawUrl]}
                  alt="OPFS Content preview"
                  className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-90 active:scale-95 transition-all"
                  referrerPolicy="no-referrer"
                  onClick={() => {
                    navigator.clipboard.writeText(`![Image](${rawUrl})`);
                    toast.info('Asset markdown copied!');
                  }}
                />
                <span className="font-mono text-[8px] text-neutral-400 max-w-[80px] break-all select-all">
                  {rawUrl.replace('axiom://asset/', '')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}, arePropsEqual);
