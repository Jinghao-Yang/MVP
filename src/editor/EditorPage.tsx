/* ================================================
   FILE: src/editor/EditorPage.tsx
   ================================================ */
import { useEffect, useRef, useCallback } from 'react';
import { useUiStore, type UiState } from '@/stores/ui-store';
import { usePopupStore } from '@/stores/popup-store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { EditorSidebar } from './EditorSidebar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { EditorRightPane } from './components/EditorRightPane';
import { PopupManager } from './components/PopupManager';
import { MinimizedPopups } from './components/MinimizedPopups';
import { WikiHoverPreview } from './components/WikiHoverPreview'; // 新增
import { wysiwygLinkExtension } from './extensions/wysiwyg-link';
import { Maximize2, Minimize2 } from 'lucide-react';
import type { DocumentEntity } from '@/types';

export function EditorPage({
  isZenMode,
  onToggleZen,
}: {
  isZenMode: boolean;
  onToggleZen: () => void;
  openPage: (page: string) => void;
}) {
  const documentText = useUiStore((state: UiState) => state.documentText);
  const setDocumentText = useUiStore((state: UiState) => state.setDocumentText);
  const setHoveredLink = usePopupStore((state) => state.setHoveredLink);

  const mainDocument = useLiveQuery(() => db.documents.get('main-editor-doc'), []);

  // 1. 同步主编辑器文本至 IndexedDB 实现持久防抖保存
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorChange = useCallback(
    (newText: string) => {
      setDocumentText(newText);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        await db.documents.update('main-editor-doc', {
          content: newText,
          updatedAt: Date.now(),
        });
      }, 500); // 500ms 极其静默的后台保存
    },
    [setDocumentText]
  );

  useEffect(() => {
    if (mainDocument) {
      const doc = mainDocument as unknown as DocumentEntity;
      setDocumentText(doc.content);
    }
  }, [mainDocument, setDocumentText]);

  // 2. 处理 CodeMirror 双链派发的 LinkEvent
  const handleLinkEvent = useCallback(
    (ev: { type: string; target: string; element?: HTMLElement }) => {
      if (ev.type === 'link-hover' && ev.element) {
        setHoveredLink(ev.element, ev.target);
      } else if (ev.type === 'link-leave') {
        setHoveredLink(null, null);
      } else if (ev.type === 'link-click') {
        useUiStore.getState().setCurrentWikiId(ev.target);
      }
    },
    [setHoveredLink]
  );

  // 注入 CodeMirror 高性能悬停代理
  const editorExtensions = [wysiwygLinkExtension(handleLinkEvent)];

  return (
    <div className="flex-1 flex overflow-hidden h-full relative">
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
        {/* 编辑器操作栏 */}
        <header className="h-14 px-8 border-b border-black/5 flex items-center justify-between shrink-0 bg-white/40 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <span className="tag-badge bg-bh-red/10 text-bh-red">Active Workspace</span>
          </div>
          <button
            onClick={onToggleZen}
            className="p-2.5 hover:bg-black/5 transition-colors border-none bg-transparent cursor-pointer rounded-lg text-neutral-500 hover:text-black"
          >
            {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </header>

        {/* 主编辑区 */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex flex-col">
          <div className="max-w-[720px] mx-auto w-full flex-1 flex flex-col space-y-6">
            <h1 className="font-human text-4xl font-normal text-black outline-none tracking-tight leading-snug">
              Topology Math
            </h1>
            <div className="editor-container flex-1">
              <MarkdownEditor
                docId="main-editor-doc"
                value={documentText}
                onChange={handleEditorChange}
                extensions={editorExtensions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 右侧关系分裂视口 */}
      <EditorRightPane />

      {/* 极简上下文标注栏 */}
      <EditorSidebar isZenMode={isZenMode} />

      {/* 桌面级多卡片画布叠加系统 */}
      <PopupManager />

      {/* 高度灵动的 safePolygon 临时预览系统 */}
      <WikiHoverPreview />

      {/* 最小化系统 */}
      <MinimizedPopups />
    </div>
  );
}
