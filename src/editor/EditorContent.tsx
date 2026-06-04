/* ================================================
   FILE: src/editor/EditorContent.tsx
   ================================================ */
import { memo, useCallback } from 'react';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { usePopupStore, type PopupState } from '@/stores/popup-store';
import { useEditorStore, type EditorState } from '@/stores/editor-store';
import { wysiwygLinkFolderPlugin } from './extensions/wysiwyg-link';

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

  const handleCodeMirrorChange = useCallback(
    (value: string) => {
      setDocumentText(value);
    },
    [setDocumentText]
  );

  const linkHoverExtension = useCallback(() => {
    return EditorView.domEventHandlers({
      click: (event, view) => {
        const target = event.target as HTMLElement;
        if (target && target.classList.contains('cm-wysiwyg-link')) {
          const wikiId = target.getAttribute('data-target');
          if (wikiId) {
            event.preventDefault();
            loadWikiContent(wikiId);
            return true;
          }
        }

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          const line = view.state.doc.lineAt(pos);
          const offset = pos - line.from;
          const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
          let match;

          while ((match = regex.exec(line.text)) !== null) {
            if (offset >= match.index && offset <= match.index + match[0].length) {
              const wikiId = match[2];
              event.preventDefault();
              loadWikiContent(wikiId);
              return true;
            }
          }
        }
        return false;
      },
      mousemove: (event, view) => {
        if (usePopupStore.getState().isUserDragging) return;

        if (window.getSelection()?.toString().trim().length) {
          handleMouseLeave('any');
          return;
        }

        const el = event.target as HTMLElement;
        if (el && el.classList.contains('cm-wysiwyg-link')) {
          const targetWikiId = el.getAttribute('data-target');
          if (targetWikiId) {
            handleMouseEnter(event, targetWikiId, 0);
            return;
          }
        }

        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          const coords = view.coordsAtPos(pos);
          if (coords && (event.clientY < coords.top || event.clientY > coords.bottom)) {
            handleMouseLeave('any');
            return;
          }

          const line = view.state.doc.lineAt(pos);
          const offset = pos - line.from;
          const regex = /\[([^\]]+)\]\(([^)]+)\)/g;
          let match;
          let found = false;

          while ((match = regex.exec(line.text)) !== null) {
            if (offset >= match.index && offset <= match.index + match[0].length) {
              const wikiId = match[2];
              handleMouseEnter(event, wikiId, 0);
              found = true;
              break;
            }
          }
          if (!found) handleMouseLeave('any');
        } else {
          handleMouseLeave('any');
        }
      },
      mouseleave: () => {
        handleMouseLeave('any');
      },
    });
  }, [handleMouseEnter, handleMouseLeave, loadWikiContent])();

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
            <span className="font-sys text-[11px] uppercase tracking-widest text-[var(--bh-red)] block mb-4">
              ACTIVE DOCUMENT // MAIN DRAFT
            </span>
          </div>

          <div className="animate-in fade-in duration-150">
            <CodeMirror
              value={documentText}
              onChange={handleCodeMirrorChange}
              extensions={[
                markdown(),
                linkHoverExtension,
                wysiwygLinkFolderPlugin,
                EditorView.lineWrapping,
              ]}
              theme="none"
              basicSetup={{
                lineNumbers: false,
                foldGutter: false,
                highlightActiveLine: false,
                bracketMatching: false,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default memo(EditorContent);
