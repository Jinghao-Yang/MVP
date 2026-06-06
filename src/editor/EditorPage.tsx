import { useEffect, useRef, useCallback, useState } from 'react';
import { toast } from 'sonner';
import { useUiStore } from '@/stores/ui-store';
import { useEditorStore, type EditorState } from '@/stores/editor-store';
import { usePopupStore } from '@/stores/popup-store';
import { useEntityGraphStore } from '@/stores/entity-graph-store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { parserService } from '@/services/parser-service';
import { EditorSidebar } from './EditorSidebar';
import { MarkdownEditor } from './components/MarkdownEditor';
import { EditorRightPane } from './components/EditorRightPane';
import { PopupManager } from './components/PopupManager';
import { MinimizedPopups } from './components/MinimizedPopups';
import { WikiHoverPreview } from './components/WikiHoverPreview';
import { DocumentSplitter } from './components/DocumentSplitter';
import { PropertyForm } from './components/PropertyForm';
import { MainBacklinksPanel } from './components/MainBacklinksPanel';
import { wysiwygLinkExtension } from './extensions/wysiwyg-link';
import { Maximize2, Minimize2, BookOpen, MessageSquare } from 'lucide-react';
import type { DocumentEntity } from '@/types';
import { exportService } from '@/services/export-service';
import { DOCUMENT } from '@/utils/constants';

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
  const registerNodesToGraph = useEntityGraphStore((state) => state.registerNodes);

  const mainWikiId = useUiStore((state) => state.mainWikiId) || 'main-editor-doc';
  const currentWikiId = useUiStore((state) => state.currentWikiId);
  const setCurrentWikiId = useUiStore((state) => state.setCurrentWikiId);

  const mainDocument = useLiveQuery(() => db.documents.get(mainWikiId), [mainWikiId]);
  const allDocs = useLiveQuery(() => db.documents.toArray(), []);
  const [showSplitter, setShowSplitter] = useState(false);
  const [isContextPanelOpen, setIsContextPanelOpen] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 🌟 【Save Gate 绝对闭环设计】
   * 只有在输入停顿 500ms 后才触发关系写盘，保护编辑器的极致性能
   */
  const handleEditorChange = useCallback(
    (newText: string) => {
      setDocumentText(newText);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      saveTimeoutRef.current = setTimeout(async () => {
        // 1. 真相写盘
        await db.documents.update(mainWikiId, {
          content: newText,
          updatedAt: Date.now(),
        });

        // 2. 清除特定内存缓存
        parserService.invalidate(mainWikiId);

        // 3. 执行单向增量解析提取
        const { nodes, wikiLinks, tags } = parserService.parseMarkdown(mainWikiId, newText);

        // 4. 将提取出的实体立刻同步至 Reactive Entity Graph 触发 UI 响应
        registerNodesToGraph(nodes);

        // 5. 写入多表事务索引
        await db.transaction('rw', [db.semanticNodes, db.links, db.tags], async () => {
          await db.semanticNodes.where('docId').equals(mainWikiId).delete();
          if (nodes.length > 0) {
            await db.semanticNodes.bulkAdd(nodes);
          }

          await db.links.where('sourceId').equals(mainWikiId).delete();
          const legacyLinks = wikiLinks.map((target) => ({
            sourceId: mainWikiId,
            targetId: target,
          }));
          if (legacyLinks.length > 0) {
            await db.links.bulkAdd(legacyLinks);
          }

          await db.tags.where('docId').equals(mainWikiId).delete();
          const tagEntities = tags.map((t) => ({
            docId: mainWikiId,
            tag: t,
          }));
          if (tagEntities.length > 0) {
            await db.tags.bulkAdd(tagEntities);
          }
        });

        markAsSaved();
      }, 500);
    },
    [mainWikiId, setDocumentText, markAsSaved, registerNodesToGraph]
  );

  useEffect(() => {
    if (mainDocument) {
      const doc = mainDocument as unknown as DocumentEntity;
      setDocumentText(doc.content);
    }
  }, [mainDocument, setDocumentText]);

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

  const handleExport = useCallback(async () => {
    try {
      await exportService.triggerDownload(mainWikiId);
      toast.success('Metadata aggregated! Saved as frontmatter Markdown.');
    } catch {
      toast.error('Failed to aggregate and export node YAML metadata.');
    }
  }, [mainWikiId]);

  const handleSplit = useCallback(() => {
    setShowSplitter(true);
  }, []);

  const handleSplitConfirm = useCallback(
    async (sections: Array<{ id: string; title: string; content: string }>) => {
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
    },
    []
  );

  const editorExtensions = [wysiwygLinkExtension(handleLinkEvent)];

  return (
    <div className="flex-1 flex overflow-hidden h-full relative">
      <div className="flex-1 flex flex-col h-full bg-transparent overflow-hidden">
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

            <MainBacklinksPanel docId={mainWikiId} />
          </div>
        </div>
      </div>

      <EditorRightPane />
      <EditorSidebar isZenMode={!isContextPanelOpen} />
      <PopupManager />
      <WikiHoverPreview />
      <MinimizedPopups />

      {showSplitter && (
        <DocumentSplitter
          content={documentText}
          onSplit={handleSplitConfirm}
          onClose={() => setShowSplitter(false)}
          maxSize={DOCUMENT.MAX_DOCUMENT_SIZE}
        />
      )}
    </div>
  );
}
