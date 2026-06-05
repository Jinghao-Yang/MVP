/* ==================================================
   FILE: src/editor/components/DocumentHistoryNav.tsx
   ================================================== */
import { useReducer, useCallback } from 'react';

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

// ================================================
// 自定义 Hook
// ================================================

export function useDocumentHistory(onNavigate: (wikiId: string) => void) {
  const [historyState, dispatchHistory] = useReducer(historyReducer, {
    documentHistory: [],
    historyIndex: -1,
  });

  const canGoBack = useCallback(() => historyState.historyIndex > 0, [historyState.historyIndex]);

  const canGoForward = useCallback(
    () => historyState.historyIndex < historyState.documentHistory.length - 1,
    [historyState.historyIndex, historyState.documentHistory.length]
  );

  const goBack = useCallback(() => {
    if (!canGoBack()) return;

    const newIndex = historyState.historyIndex - 1;
    const wikiId = historyState.documentHistory[newIndex];
    onNavigate(wikiId);
    dispatchHistory({ type: 'GO_BACK' });
  }, [historyState.historyIndex, historyState.documentHistory, canGoBack, onNavigate]);

  const goForward = useCallback(() => {
    if (!canGoForward()) return;

    const newIndex = historyState.historyIndex + 1;
    const wikiId = historyState.documentHistory[newIndex];
    onNavigate(wikiId);
    dispatchHistory({ type: 'GO_FORWARD' });
  }, [historyState.historyIndex, historyState.documentHistory, canGoForward, onNavigate]);

  const loadWiki = useCallback(
    (wikiId: string) => {
      onNavigate(wikiId);
      dispatchHistory({ type: 'LOAD_WIKI', wikiId });
    },
    [onNavigate]
  );

  return {
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    loadWiki,
  };
}
