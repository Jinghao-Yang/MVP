/* ================================================
   FILE: src/editor/EditorContent.tsx
   ================================================ */
import { memo, useCallback, useEffect } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePopupStore, type PopupState } from '@/stores/popup-store';
import { useEditorStore, type EditorState } from '@/stores/editor-store';
import { useUiStore } from '@/stores/ui-store';
import {
  wysiwygLinkExtensions,
  wysiwygLinkExtension,
  type LinkEvent,
} from './extensions/wysiwyg-link';
import { MarkdownEditor } from './components/MarkdownEditor';
import { useDebouncedCallback } from '@/hooks/useDebouncedCallback';
import { updateDocumentContent } from '@/db/documents';

interface EditorContentProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  onOpenPage: (page: string) => void;
}

export function EditorContent({ isZenMode, onToggleZen, onOpenPage }: EditorContentProps) {
  const setDocumentText = useEditorStore((state: EditorState) => state.setDocumentText);
  const documentText = useEditorStore((state: EditorState) => state.documentText);
  const handleMouseEnter = usePopupStore((state: PopupState) => state.handleMouseEnter);
  const handleMouseLeave = usePopupStore((state: PopupState) => state.handleMouseLeave);
  const loadWikiContent = useEditorStore((state: EditorState) => state.loadWikiContent);
  const goBack = useEditorStore((state: EditorState) => state.goBack);
  const goForward = useEditorStore((state: EditorState) => state.goForward);
  const canGoBack = useEditorStore((state: EditorState) => state.canGoBack);
  const canGoForward = useEditorStore((state: EditorState) => state.canGoForward);
  const currentWikiId = useEditorStore((state: EditorState) => state.currentWikiId);
  const setStatus = useUiStore((state) => state.setStatus);

  const debouncedSave = useDebouncedCallback(async (text: string) => {
    try {
      await updateDocumentContent('main-editor-doc', text);
      setStatus('Auto-saved');
    } catch (error) {
      console.error('Failed to save document:', error);
      setStatus('Failed to auto-save. Please check storage.');
    }
  }, 500);

  // ================================================
  // beforeunload 最后防线
  // ================================================

  useEffect(() => {
    const handleBeforeUnload = async (_event: BeforeUnloadEvent) => {
      try {
        await updateDocumentContent('main-editor-doc', documentText);
      } catch (error) {
        console.error('Failed to save on beforeunload:', error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [documentText]);

  const handleCodeMirrorChange = useCallback(
    (value: string) => {
      setDocumentText(value);
      debouncedSave(value);
    },
    [setDocumentText, debouncedSave]
  );

  const handleLinkEvent = useCallback(
    (event: LinkEvent) => {
      if (event.type === 'link-click') {
        loadWikiContent(event.target);
      } else if (event.type === 'link-hover') {
        if (
          !usePopupStore.getState().isUserDragging &&
          !window.getSelection()?.toString().trim().length
        ) {
          handleMouseEnter(event.event!, event.target, 0);
        }
      } else if (event.type === 'link-leave') {
        handleMouseLeave('any');
      }
    },
    [handleMouseEnter, handleMouseLeave, loadWikiContent]
  );

  const linkHoverExtension = wysiwygLinkExtension(handleLinkEvent);

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto custom-scrollbar">
      <header className="h-20 flex items-center justify-between px-12 z-10 shrink-0 sticky top-0 bg-gradient-to-b from-[var(--bg-canvas)] to-transparent">
        <div className="font-sys text-xs uppercase tracking-[0.12em] text-[var(--text-muted)] flex items-center gap-3">
          {currentWikiId && (
            <div className="flex items-center gap-1 mr-2">
              <button
                onClick={goBack}
                disabled={!canGoBack()}
                className={`p-1 border-none bg-transparent transition-colors ${canGoBack() ? 'text-neutral-700 hover:text-black cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
                title="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goForward}
                disabled={!canGoForward()}
                className={`p-1 border-none bg-transparent transition-colors ${canGoForward() ? 'text-neutral-700 hover:text-black cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
                title="Go forward"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <span
            className="hover:text-[var(--text-main)] cursor-pointer transition-colors"
            onClick={() => onOpenPage('project')}
          >
            Topology Math
          </span>
          <span className="font-serif italic text-sm opacity-50">/</span>
          <span className="text-[var(--text-main)] font-semibold font-sys">Focus Mode</span>
        </div>

        {/* 🌟 极致净化：完全移除 Annotations 控制块与竖线，仅留禅模式切换按钮 */}
        <div className="flex items-center p-1 bg-white/30 backdrop-blur-md border border-black/5">
          <button
            onClick={onToggleZen}
            className="hover-ui p-1.5 cursor-pointer border-none rounded-none bg-transparent"
            title="Zen Toggle"
          >
            {isZenMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="px-12 lg:px-20 pt-10 pb-64 flex justify-center">
        <div className="w-full max-w-[680px] relative">
          <div className="mb-4">
            <span className="font-sys text-[11px] uppercase tracking-widest text-bh-red block mb-4">
              ACTIVE DOCUMENT // MAIN DRAFT
            </span>
          </div>

          <div className="animate-in fade-in duration-150">
            <MarkdownEditor
              docId="main-editor-doc"
              value={documentText}
              onChange={handleCodeMirrorChange}
              extensions={[...wysiwygLinkExtensions, linkHoverExtension]}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(EditorContent);
