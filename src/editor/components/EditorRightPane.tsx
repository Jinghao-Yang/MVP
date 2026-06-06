/* ==================================================
   FILE: src/editor/components/EditorRightPane.tsx
   ================================================== */
import { ChevronLeft, ChevronRight, BookOpen, X } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useUiStore } from '@/stores';
import { db } from '@/db/dexie';
import { useDocumentHistory } from './DocumentHistoryNav';
import { SplitEditor } from './SplitEditor';
import { BacklinksPanel } from './BacklinksPanel';
import type { DocumentEntity } from '@/types';

export function EditorRightPane() {
  // 从全局 Store 获取当前 Wiki ID（跨组件共享）
  const currentWikiId = useUiStore((state) => state.currentWikiId);
  const setCurrentWikiId = useUiStore((state) => state.setCurrentWikiId);

  // 使用 useLiveQuery 订阅文档数据
  const currentDocument = useLiveQuery(
    () => (currentWikiId ? db.documents.get(currentWikiId) : Promise.resolve(undefined)),
    [currentWikiId]
  ) as DocumentEntity | undefined;

  // 历史导航 Hook
  const { canGoBack, canGoForward, goBack, goForward, loadWiki } =
    useDocumentHistory(setCurrentWikiId);

  return (
    <aside
      id="editor-context-panel"
      style={{ width: currentWikiId ? '480px' : '0px' }}
      className={`bg-white/40 backdrop-blur-xl flex flex-col shrink-0 transition-all duration-300 h-full overflow-hidden ${
        currentWikiId
          ? 'border-l border-neutral-200/60 opacity-100 pointer-events-auto'
          : 'border-l-0 opacity-0 pointer-events-none'
      }`}
    >
      {currentWikiId && currentDocument ? (
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
            <div className="flex items-center gap-3">
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-neutral-400">
                Split Pane // Reference
              </span>
              <button
                onClick={() => setCurrentWikiId(null)}
                className="p-1 hover:bg-black/5 text-neutral-400 hover:text-black border-none bg-transparent rounded cursor-pointer transition-colors"
                title="Close split pane"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 对照卡片详细内容与实时编辑 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <SplitEditor wikiId={currentWikiId} document={currentDocument} />

            {/* 动态反向引用网络 */}
            <BacklinksPanel wikiId={currentWikiId} onLinkClick={loadWiki} variant="simple" />
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
