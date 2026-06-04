/* ================================================
   FILE: src/editor/components/EditorRightPane.tsx
   ================================================ */
import { useShallow } from 'zustand/react/shallow';
import { useEditorStore, type EditorState } from '@/stores/editor-store';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { ChevronLeft, ChevronRight, BookOpen, Link2 } from 'lucide-react';

export function EditorRightPane() {
  const {
    currentWikiId,
    rightPaneWikiTitle,
    rightPaneWikiContent,
    rightPaneBacklinks,
    setRightPaneWikiContent,
    loadWikiContent,
    goBack,
    goForward,
    canGoBack,
    canGoForward,
  } = useEditorStore(
    useShallow((state: EditorState) => ({
      currentWikiId: state.currentWikiId,
      rightPaneWikiTitle: state.rightPaneWikiTitle,
      rightPaneWikiContent: state.rightPaneWikiContent,
      rightPaneBacklinks: state.rightPaneBacklinks,
      setRightPaneWikiContent: state.setRightPaneWikiContent,
      loadWikiContent: state.loadWikiContent,
      goBack: state.goBack,
      goForward: state.goForward,
      canGoBack: state.canGoBack,
      canGoForward: state.canGoForward,
    }))
  );

  return (
    <aside
      id="editor-context-panel"
      style={{ width: '480px' }}
      className="bg-white/40 backdrop-blur-xl flex flex-col shrink-0 border-l border-neutral-200/60 h-full overflow-hidden transition-all duration-300"
    >
      {currentWikiId ? (
        <div className="flex-1 flex flex-col h-full animate-in fade-in duration-300">
          {/* 对照控制栏 */}
          <header className="h-14 px-6 border-b border-black/5 flex items-center justify-between shrink-0 bg-neutral-50/50">
            <div className="flex items-center gap-1">
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
            <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-neutral-400">
              Split Pane // Reference
            </span>
          </header>

          {/* 对照卡片详细内容与实时编辑 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div>
              <span className="font-mono text-[10px] uppercase text-[var(--bh-red)] font-bold tracking-wider mb-2 block">
                CARD INDEX // {currentWikiId.toUpperCase()}
              </span>
              <h3 className="font-human text-2xl font-bold text-black">{rightPaneWikiTitle}</h3>
            </div>

            <div className="prose-split text-[14.5px] leading-relaxed">
              <CodeMirror
                value={rightPaneWikiContent}
                onChange={(val) => setRightPaneWikiContent(val)}
                extensions={[markdown(), EditorView.lineWrapping]}
                theme="none"
                basicSetup={{
                  lineNumbers: false,
                  foldGutter: false,
                  highlightActiveLine: false,
                  bracketMatching: false,
                }}
              />
            </div>

            {/* 动态反向引用网络 */}
            <div className="border-t border-black/5 pt-6 space-y-3">
              <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[var(--bh-blue)]" /> Linked Mentions (Backlinks)
              </h5>
              {rightPaneBacklinks.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {rightPaneBacklinks.map((linkId) => (
                    <button
                      key={linkId}
                      onClick={() => loadWikiContent(linkId)}
                      className="px-2.5 py-1.5 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/50 rounded-lg text-xs font-sys font-medium text-neutral-700 cursor-pointer transition-colors"
                    >
                      {linkId === 'main-editor-doc' ? 'Topology Math (Main)' : linkId}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="font-mono text-[9px] uppercase text-neutral-400 italic block">
                  No backward linkages mapped.
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        // 未开启对照卡片时的空白引导态
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 h-full">
          <BookOpen className="w-8 h-8 text-neutral-300 stroke-[1.5]" />
          <h4 className="font-sys text-sm font-bold text-neutral-500 uppercase tracking-widest">
            Compare Side-by-Side
          </h4>
          <p className="font-sys text-xs text-neutral-400 leading-relaxed max-w-[280px]">
            Click any bidirectional link in the main editor to open the card side-by-side.
          </p>
        </div>
      )}
    </aside>
  );
}
