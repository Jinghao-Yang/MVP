/* ==================================================
   FILE: src/editor/components/SplitEditor.tsx
   ================================================== */
import { useState, useCallback, useEffect, useRef } from 'react';
import { Check, AlertCircle } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { documentService } from '@/services/document-service';
import { showErrorToast } from '@/utils/error-handler';
import type { DocumentEntity } from '@/types';

type SaveStatus = 'saved' | 'saving' | 'error';

interface SplitEditorProps {
  wikiId: string;
  document: DocumentEntity;
}

export function SplitEditor({ wikiId, document }: SplitEditorProps) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [localContent, setLocalContent] = useState(document.content);
  const [localTitle, setLocalTitle] = useState(document.title);
  const originalContentRef = useRef<string>(document.content);

  // 同步文档数据到本地状态
  useEffect(() => {
    setLocalTitle(document.title);
    if (localContent === originalContentRef.current) {
      setLocalContent(document.content);
      originalContentRef.current = document.content;
    }
  }, [document]);

  // 标记是否有未保存的更改
  const hasUnsavedChanges = localContent !== originalContentRef.current;

  // 更新内容（仅更新本地状态）
  const handleContentChange = useCallback((content: string) => {
    setLocalContent(content);
  }, []);

  // 保存内容到数据库
  const saveContent = useCallback(async () => {
    if (!wikiId || !hasUnsavedChanges) return;

    try {
      setSaveStatus('saving');
      await documentService.updateDocumentContent(wikiId, localContent);
      originalContentRef.current = localContent;
      setSaveStatus('saved');
    } catch {
      showErrorToast('Failed to save document');
      setSaveStatus('error');
    }
  }, [wikiId, localContent, hasUnsavedChanges]);

  // 组件卸载前强制保存
  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && wikiId) {
        documentService
          .updateDocumentContent(wikiId, localContent)
          .catch(() => showErrorToast('Failed to save document'));
      }
    };
  }, [wikiId, localContent, hasUnsavedChanges]);

  // 失焦时保存
  const handleBlur = useCallback(() => {
    saveContent();
  }, [saveContent]);

  return (
    <>
      <div>
        <span className="font-mono text-[10px] uppercase text-bh-red font-bold tracking-wider mb-2 block">
          CARD INDEX // {wikiId.toUpperCase()}
        </span>
        <h3 className="font-human text-2xl font-bold text-black">{localTitle}</h3>
      </div>

      <div className="prose-split text-[14.5px] leading-relaxed">
        <MarkdownEditor
          docId={wikiId}
          value={localContent}
          onChange={handleContentChange}
          onBlur={handleBlur}
        />
      </div>

      {/* 保存状态指示器 */}
      <div className="flex items-center gap-1">
        {saveStatus === 'saving' && (
          <span className="font-mono text-[8px] text-blue-500 uppercase animate-pulse">
            Saving...
          </span>
        )}
        {saveStatus === 'saved' && hasUnsavedChanges && (
          <span className="font-mono text-[8px] text-amber-500 uppercase">Unsaved</span>
        )}
        {saveStatus === 'saved' && !hasUnsavedChanges && (
          <Check className="w-3 h-3 text-green-500" />
        )}
        {saveStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-500" />}
      </div>
    </>
  );
}
