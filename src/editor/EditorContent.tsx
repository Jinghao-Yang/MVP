/* ================================================
   FILE: src/editor/EditorContent.tsx
   ================================================ */
import { memo, useCallback, useEffect, useReducer } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePopupStore, type PopupState } from '@/stores/popup-store';
import { useEditorStore, type EditorState } from '@/stores/editor-store';
import { useUiStore } from '@/stores/ui-store';
import { documentService } from '@/services/document-service';
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

// ================================================
// 历史导航 Reducer
// ================================================

interface HistoryState {
  documentHistory: string[];
  historyIndex: number;
}

type HistoryAction =
  | { type: 'LOAD_WIKI'; wikiId: string }
  | { type: 'GO_BACK' }
  | { type: 'GO_FORWARD' };

const MAX_HISTORY_LENGTH = 50;

const historyReducer = (state: HistoryState, action: HistoryAction): HistoryState => {
  switch (action.type) {
    case 'LOAD_WIKI': {
      const newHistory = state.documentHistory.slice(0, state.historyIndex + 1);
      if (newHistory[newHistory.length - 1] !== action.wikiId) {
        newHistory.push(action.wikiId);
      }
      const trimmedHistory =
        newHistory.length > MAX_HISTORY_LENGTH ? newHistory.slice(-MAX_HISTORY_LENGTH) : newHistory;
      return {
        documentHistory: trimmedHistory,
        historyIndex: trimmedHistory.length - 1,
      };
    }
    case 'GO_BACK':
      if (state.historyIndex > 0) {
        return { ...state, historyIndex: state.historyIndex - 1 };
      }
      return state;
    case 'GO_FORWARD':
      if (state.historyIndex < state.documentHistory.length - 1) {
        return { ...state, historyIndex: state.historyIndex + 1 };
      }
      return state;
    default:
      return state;
  }
};

export function EditorContent({ isZenMode, onToggleZen, onOpenPage }: EditorContentProps) {
  const [historyState, dispatchHistory] = useReducer(historyReducer, {
    documentHistory: [],
    historyIndex: -1,
  });

  const setDocumentText = useEditorStore((state: EditorState) => state.setDocumentText);
  const documentText = useEditorStore((state: EditorState) => state.documentText);
  const handleMouseEnter = usePopupStore((state: PopupState) => state.handleMouseEnter);
  const handleMouseLeave = usePopupStore((state: PopupState) => state.handleMouseLeave);
  const setStatus = useUiStore((state) => state.setStatus);

  const canGoBack = useCallback(() => historyState.historyIndex > 0, [historyState.historyIndex]);
  const canGoForward = useCallback(
    () => historyState.historyIndex < historyState.documentHistory.length - 1,
    [historyState.historyIndex, historyState.documentHistory.length]
  );
  const currentWikiId = historyState.documentHistory[historyState.historyIndex] || null;

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
  // 历史导航方法
  // ================================================

  const loadWikiContent = useCallback(
    async (wikiId: string) => {
      try {
        const data = await documentService.getDocument(wikiId);
        if (data) {
          setDocumentText(data.content);
          dispatchHistory({ type: 'LOAD_WIKI', wikiId });
        }
      } catch (error) {
        console.error('Failed to load wiki content:', error);
      }
    },
    [setDocumentText]
  );

  const goBack = useCallback(async () => {
    if (!canGoBack()) return;

    try {
      const newIndex = historyState.historyIndex - 1;
      const wikiId = historyState.documentHistory[newIndex];
      const data = await documentService.getDocument(wikiId);
      if (data) {
        setDocumentText(data.content);
        dispatchHistory({ type: 'GO_BACK' });
      }
    } catch (error) {
      console.error('Failed to navigate back:', error);
    }
  }, [historyState.historyIndex, historyState.documentHistory, canGoBack, setDocumentText]);

  const goForward = useCallback(async () => {
    if (!canGoForward()) return;

    try {
      const newIndex = historyState.historyIndex + 1;
      const wikiId = historyState.documentHistory[newIndex];
      const data = await documentService.getDocument(wikiId);
      if (data) {
        setDocumentText(data.content);
        dispatchHistory({ type: 'GO_FORWARD' });
      }
    } catch (error) {
      console.error('Failed to navigate forward:', error);
    }
  }, [historyState.historyIndex, historyState.documentHistory, canGoForward, setDocumentText]);

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
    [handleMouseEnter, handleMouseLeave, loadWikiContent, setDocumentText]
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
