/* ================================================
   FILE: src/editor/EditorContent.tsx
   ================================================ */
import { memo, useCallback } from 'react';
import { Eye, EyeOff, MessageSquareText, ChevronLeft, ChevronRight } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { useAppStore } from '@/store/useAppStore';

interface EditorContentProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  onOpenPage: (page: string) => void;
}

const INITIAL_TEXT = `# Compactness in topological spaces

This space maps the foundational structures of topological spaces. It bridges the intuitive notion of [closeness](compactness) without relying on strict metrics. The essence of compactness captures the idea that a space is, in some sense, "not too large" or "manageable", even if it contains infinitely many points.

A topological space is a set endowed with a structure, called a topology, which allows defining continuous deformation of subspaces. Generalizing the [Heine–Borel](heine-borel) theorem requires us to move beyond Euclidean constraints.

This brings us to [Tychonoff's Theorem](tychonoff), which extends compactness to arbitrary products — a deep result relying on the Axiom of Choice.`;

export function EditorContent({ isZenMode, onToggleZen, onOpenPage }: EditorContentProps) {
  const setDocumentText = useAppStore((state) => state.setDocumentText);
  const documentText = useAppStore((state) => state.documentText);
  const handleMouseEnter = useAppStore((state) => state.handleMouseEnter);
  const handleMouseLeave = useAppStore((state) => state.handleMouseLeave);
  const loadWikiContent = useAppStore((state) => state.loadWikiContent);
  const goBack = useAppStore((state) => state.goBack);
  const goForward = useAppStore((state) => state.goForward);
  const canGoBack = useAppStore((state) => state.canGoBack);
  const canGoForward = useAppStore((state) => state.canGoForward);
  const currentWikiId = useAppStore((state) => state.currentWikiId);

  const handleCodeMirrorChange = useCallback(
    (value: string) => {
      setDocumentText(value);
    },
    [setDocumentText]
  );

  const linkHoverExtension = useCallback(() => {
    return EditorView.domEventHandlers({
      click: (event, view) => {
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
        if (useAppStore.getState().isUserDragging) return;

        if (window.getSelection()?.toString().trim().length) {
          handleMouseLeave('any');
          return;
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
    <main className="flex-1 flex flex-col h-full overflow-y-auto scroll-hide">
      <header className="h-20 flex items-center justify-between px-12 z-10 shrink-0 sticky top-0 bg-gradient-to-b from-[var(--bg-canvas)] to-transparent">
        <div className="font-sys text-xs uppercase tracking-[0.12em] text-[var(--text-muted)] flex items-center gap-3">
          {/* 导航按钮 */}
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

        <div className="flex items-center gap-1.5 p-1 bg-white/30 backdrop-blur-md border border-black/5">
          <div className="px-3 py-1.5 text-[11px] uppercase tracking-widest font-bold text-black bg-white/60 shadow-sm flex items-center gap-2 select-none">
            <MessageSquareText className="w-3.5 h-3.5" />
            Annotations
            <span className="bg-[var(--bh-red)] text-white px-1.5 py-0.5 rounded-full text-[10px] leading-none font-sans ml-1">
              2
            </span>
          </div>
          <div className="w-px h-3 bg-black/10 mx-1"></div>
          <button
            onClick={onToggleZen}
            className="hover-ui p-1.5 cursor-pointer border-none rounded-none"
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
              Document // 01
            </span>
          </div>

          <div className="animate-in fade-in duration-150">
            <CodeMirror
              value={documentText || INITIAL_TEXT}
              onChange={handleCodeMirrorChange}
              extensions={[markdown(), linkHoverExtension, EditorView.lineWrapping]}
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
