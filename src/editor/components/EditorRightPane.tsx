/* ================================================
   FILE: src/editor/components/EditorRightPane.tsx
   ================================================ */
import { useState, useReducer, useCallback, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Link2, Check, AlertCircle } from 'lucide-react';
import { MarkdownEditor } from './MarkdownEditor';
import { documentService } from '@/services/document-service';
import { useUiStore } from '@/stores/ui-store';

type SaveStatus = 'saved' | 'saving' | 'error';

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
      // 修剪历史记录，保持最大长度
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

export function EditorRightPane() {
  // ================================================
  // 组件内部状态
  // ================================================

  // 文档内容状态
  const [rightPaneWikiTitle, setRightPaneWikiTitle] = useState('');
  const [rightPaneWikiContent, setRightPaneWikiContent] = useState('');
  const [rightPaneBacklinks, setRightPaneBacklinks] = useState<string[]>([]);

  // 保存状态
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');

  // 历史导航状态
  const [historyState, dispatchHistory] = useReducer(historyReducer, {
    documentHistory: [],
    historyIndex: -1,
  });

  // 从全局 Store 获取当前 Wiki ID（跨组件共享）
  const currentWikiId = useUiStore((state) => state.currentWikiId);
  const setCurrentWikiId = useUiStore((state) => state.setCurrentWikiId);

  // 原始内容引用，用于检测是否有未保存的更改
  const originalContentRef = useRef<string>('');

  // 标记是否有未保存的更改
  const hasUnsavedChanges = rightPaneWikiContent !== originalContentRef.current;

  // ================================================
  // 历史导航判断
  // ================================================

  const canGoBack = useCallback(() => historyState.historyIndex > 0, [historyState.historyIndex]);

  const canGoForward = useCallback(
    () => historyState.historyIndex < historyState.documentHistory.length - 1,
    [historyState.historyIndex, historyState.documentHistory.length]
  );

  // ================================================
  // 加载 Wiki 内容
  // ================================================

  const loadWikiContent = useCallback(
    async (wikiId: string) => {
      try {
        const data = await documentService.getDocument(wikiId);
        if (data) {
          const backlinks = await documentService.getBacklinks(wikiId);
          setRightPaneWikiTitle(data.title);
          setRightPaneWikiContent(data.content);
          setRightPaneBacklinks(backlinks);
          setCurrentWikiId(wikiId);
          dispatchHistory({ type: 'LOAD_WIKI', wikiId });
          // 保存原始内容引用
          originalContentRef.current = data.content;
          setSaveStatus('saved');
        }
      } catch (error) {
        console.error('Failed to load wiki content:', error);
      }
    },
    [setCurrentWikiId]
  );

  // ================================================
  // 历史导航方法
  // ================================================

  const goBack = useCallback(async () => {
    if (!canGoBack()) return;

    try {
      const newIndex = historyState.historyIndex - 1;
      const wikiId = historyState.documentHistory[newIndex];
      const data = await documentService.getDocument(wikiId);
      if (data) {
        const backlinks = await documentService.getBacklinks(wikiId);
        setRightPaneWikiTitle(data.title);
        setRightPaneWikiContent(data.content);
        setRightPaneBacklinks(backlinks);
        setCurrentWikiId(wikiId);
        dispatchHistory({ type: 'GO_BACK' });
      }
    } catch (error) {
      console.error('Failed to navigate back:', error);
    }
  }, [historyState.historyIndex, historyState.documentHistory, canGoBack, setCurrentWikiId]);

  const goForward = useCallback(async () => {
    if (!canGoForward()) return;

    try {
      const newIndex = historyState.historyIndex + 1;
      const wikiId = historyState.documentHistory[newIndex];
      const data = await documentService.getDocument(wikiId);
      if (data) {
        const backlinks = await documentService.getBacklinks(wikiId);
        setRightPaneWikiTitle(data.title);
        setRightPaneWikiContent(data.content);
        setRightPaneBacklinks(backlinks);
        setCurrentWikiId(wikiId);
        dispatchHistory({ type: 'GO_FORWARD' });
      }
    } catch (error) {
      console.error('Failed to navigate forward:', error);
    }
  }, [historyState.historyIndex, historyState.documentHistory, canGoForward, setCurrentWikiId]);

  // ================================================
  // 更新内容（仅更新本地状态）
  // ================================================

  const handleContentChange = useCallback((content: string) => {
    setRightPaneWikiContent(content);
  }, []);

  // ================================================
  // 保存内容到数据库
  // ================================================

  const saveContent = useCallback(async () => {
    if (!currentWikiId || !hasUnsavedChanges) return;

    try {
      setSaveStatus('saving');
      await documentService.updateDocumentContent(currentWikiId, rightPaneWikiContent);
      originalContentRef.current = rightPaneWikiContent;
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save document:', error);
      setSaveStatus('error');
    }
  }, [currentWikiId, rightPaneWikiContent, hasUnsavedChanges]);

  // ================================================
  // 组件卸载前强制保存
  // ================================================

  useEffect(() => {
    return () => {
      if (hasUnsavedChanges && currentWikiId) {
        documentService
          .updateDocumentContent(currentWikiId, rightPaneWikiContent)
          .catch(console.error);
      }
    };
  }, [currentWikiId, rightPaneWikiContent, hasUnsavedChanges]);

  // ================================================
  // 失焦时保存
  // ================================================

  const handleBlur = useCallback(() => {
    saveContent();
  }, [saveContent]);

  // ================================================
  // 渲染
  // ================================================

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
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-widest font-bold text-neutral-400">
                Split Pane // Reference
              </span>
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
            </div>
          </header>

          {/* 对照卡片详细内容与实时编辑 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
            <div>
              <span className="font-mono text-[10px] uppercase text-bh-red font-bold tracking-wider mb-2 block">
                CARD INDEX // {currentWikiId.toUpperCase()}
              </span>
              <h3 className="font-human text-2xl font-bold text-black">{rightPaneWikiTitle}</h3>
            </div>

            <div className="prose-split text-[14.5px] leading-relaxed">
              <MarkdownEditor
                docId={currentWikiId}
                value={rightPaneWikiContent}
                onChange={handleContentChange}
                onBlur={handleBlur}
              />
            </div>

            {/* 动态反向引用网络 */}
            <div className="border-t border-black/5 pt-6 space-y-3">
              <h5 className="font-mono text-[10px] uppercase tracking-widest font-bold text-neutral-400 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-bh-blue" /> Linked Mentions (Backlinks)
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
