/* ================================================
   FILE: src/editor/EditorPage.tsx
   ================================================ */
import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@/stores/ui-store';
import { useEditorStore, type EditorState } from '@/stores/editor-store';
import { usePopupStore } from '@/stores/popup-store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { EditorSidebar } from './EditorSidebar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { EditorRightPane } from './components/EditorRightPane';
import { PopupManager } from './components/PopupManager';
import { MinimizedPopups } from './components/MinimizedPopups';
import { WikiHoverPreview } from './components/WikiHoverPreview';
import { DocumentSplitter } from './components/DocumentSplitter';
import { PropertyForm } from './components/PropertyForm'; // Object property sheets
import { MainBacklinksPanel } from './components/MainBacklinksPanel';
import { wysiwygLinkExtension } from './extensions/wysiwyg-link';
import { Maximize2, Minimize2, BookOpen, MessageSquare } from 'lucide-react';
import type { DocumentEntity } from '@/types';
import { exportService } from '@/services/export-service';
import { MAX_DOCUMENT_SIZE } from './components/MarkdownEditor';

export function EditorPage({
  isZenMode,
  onToggleZen,
}: {
  isZenMode: boolean;
  onToggleZen: () => void;
  openPage: (page: string) => void;
}) {
  const documentText = useEditorStore((state: EditorState) => state.documentText);
  const setDocumentText = useEditorStore((state: EditorState) => state.setDocumentText);
  const markAsSaved = useEditorStore((state: EditorState) => state.markAsSaved);
  const setHoveredLink = usePopupStore((state) => state.setHoveredLink);

  const mainWikiId = useUiStore((state) => state.mainWikiId) || 'main-editor-doc';
  const currentWikiId = useUiStore((state) => state.currentWikiId);
  const setCurrentWikiId = useUiStore((state) => state.setCurrentWikiId);

  const mainDocument = useLiveQuery(() => db.documents.get(mainWikiId), [mainWikiId]);
  const allDocs = useLiveQuery(() => db.documents.toArray(), []);
  const [showSplitter, setShowSplitter] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);

  // 1. 同步主编辑器文本至 IndexedDB 实现持久防抖保存
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEditorChange = useCallback(
    (newText: string) => {
      setDocumentText(newText);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        await db.documents.update(mainWikiId, {
          content: newText,
          updatedAt: Date.now(),
        });
        markAsSaved();
      }, 500); // 500ms 极其静默的后台保存
    },
    [mainWikiId, setDocumentText, markAsSaved]
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

  // 3. 处理文档导出
  const handleExport = useCallback(async () => {
    try {
      await exportService.triggerDownload(mainWikiId);
      toast.success('Metadata aggregated! Saved as frontmatter Markdown.');
    } catch {
      toast.error('Failed to aggregate and export node YAML metadata.');
    }
  }, [mainWikiId]);

  // 4. 处理文档分拆
  const handleSplit = useCallback(() => {
    setShowSplitter(true);
  }, []);

  const handleSplitConfirm = useCallback(
    async (sections: Array<{ id: string; title: string; content: string }>) => {
      // 为每个分拆的部分创建新文档
      for (const section of sections) {
        const docId = `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        await db.documents.add({
          id: docId,
          title: section.title,
          content: section.content,
          badge: 'Split',
          badgeClass: 'tag-badge-green',
          updatedAt: Date.now(),
        });
      }

      setShowSplitter(false);

      // 可选：提示用户分拆成功
      console.log(`Successfully split into ${sections.length} documents`);
    },
    []
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsContextPanelOpen((prev) => !prev)}
              className={`p-2 px-3 inline-flex items-center gap-1.5 hover:bg-black/5 transition-colors border-none bg-transparent cursor-pointer rounded-lg text-xs font-semibold ${
                isContextPanelOpen ? 'text-black bg-black/5' : 'text-neutral-500 hover:text-black'
              }`}
              title="Toggle Marginalia Context Panel"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Context Panel</span>
            </button>
            <button
              onClick={() => {
                if (currentWikiId) {
                  setCurrentWikiId(null);
                } else {
                  const firstOther = (allDocs || []).find((d) => d.id !== mainWikiId);
                  setCurrentWikiId(firstOther ? firstOther.id : mainWikiId);
                }
              }}
              className={`p-2 px-3 inline-flex items-center gap-1.5 hover:bg-black/5 transition-colors border-none bg-transparent cursor-pointer rounded-lg text-xs font-semibold ${
                currentWikiId ? 'text-black bg-black/5' : 'text-neutral-500 hover:text-black'
              }`}
              title="Compare Side-by-Side"
            >
              <BookOpen className="w-4 h-4" />
              <span>Split Pane</span>
            </button>
            <button
              onClick={onToggleZen}
              className="p-2.5 hover:bg-black/5 transition-colors border-none bg-transparent cursor-pointer rounded-lg text-neutral-500 hover:text-black"
              aria-label={isZenMode ? '退出禅模式' : '进入禅模式'}
            >
              {isZenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* 主编辑区 */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar flex flex-col">
          <div className="max-w-[720px] mx-auto w-full flex-1 flex flex-col space-y-6">
            <input
              type="text"
              value={mainDocument?.title || ''}
              onChange={async (e) => {
                const newTitle = e.target.value;
                await db.documents.update(mainWikiId, { title: newTitle });
              }}
              className="font-human text-4xl font-normal text-black outline-none tracking-tight leading-snug w-full bg-transparent border-none p-0 focus:ring-0 cursor-text"
              placeholder="Untitled Node"
            />

            {/* Object property sheet (The Capacities Way) */}
            <PropertyForm docId={mainWikiId} />

            <div className="editor-container flex-1 min-h-0">
              <MarkdownEditor
                docId={mainWikiId}
                value={documentText}
                onChange={handleEditorChange}
                extensions={editorExtensions}
                showStats={true}
                onExport={handleExport}
                onSplit={handleSplit}
              />
            </div>

            {/* Backlink panel querying links and structural relations */}
            <MainBacklinksPanel docId={mainWikiId} />
          </div>
        </div>
      </div>

      {/* 右侧关系分裂视口 */}
      <EditorRightPane />

      {/* 极简上下文标注栏 (hidden by default, toggled via toolbar button) */}
      <EditorSidebar isZenMode={!isContextPanelOpen} />

      {/* 桌面级多卡片画布叠加系统 */}
      <PopupManager />

      {/* 高度灵动的 safePolygon 临时预览系统 */}
      <WikiHoverPreview />

      {/* 最小化系统 */}
      <MinimizedPopups />

      {/* 文档分拆工具 */}
      {showSplitter && (
        <DocumentSplitter
          content={documentText}
          onSplit={handleSplitConfirm}
          onClose={() => setShowSplitter(false)}
          maxSize={MAX_DOCUMENT_SIZE}
        />
      )}
    </div>
  );
}
