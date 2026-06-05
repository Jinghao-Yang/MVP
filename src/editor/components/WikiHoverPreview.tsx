/* ================================================
   FILE: src/editor/components/WikiHoverPreview.tsx
   ================================================ */
import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { usePopupStore } from '@/stores/popup-store';
import { useShallow } from 'zustand/react/shallow';
import {
  useFloating,
  useHover,
  useInteractions,
  safePolygon,
  offset,
  flip,
  shift,
  inline,
  FloatingPortal,
} from '@floating-ui/react';
import { Pin, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { DocumentEntity } from '@/types';
import { truncateText, removeMarkdownHeaders } from '@/utils/sanitize';

export function WikiHoverPreview() {
  const { hoveredElement, hoveredWikiId, setHoveredLink, pinHoveredLink } = usePopupStore(
    useShallow((state) => ({
      hoveredElement: state.hoveredElement,
      hoveredWikiId: state.hoveredWikiId,
      setHoveredLink: state.setHoveredLink,
      pinHoveredLink: state.pinHoveredLink,
    }))
  );

  const isOpen = hoveredElement !== null && hoveredWikiId !== null;

  // 1. 数据绑定 - 使用 live query 查询悬浮对应的笔记，实现实时动态更新
  const documentData = useLiveQuery(
    () => (hoveredWikiId ? db.documents.get(hoveredWikiId) : Promise.resolve(undefined)),
    [hoveredWikiId]
  ) as DocumentEntity | undefined;

  // 2. 建立 Floating UI 引擎
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) {
        setHoveredLink(null, null);
      }
    },
    middleware: [
      offset(10), // 留出 10px 间隙
      flip(),
      shift({ padding: 12 }),
      inline(), // 完美支持跨折行双链！
    ],
  });

  // 3. 启用极其优雅的 safePolygon（安全路径多边形）
  const hover = useHover(context, {
    handleClose: safePolygon({
      buffer: 8, // 扩大安全区域避免误触发
    }),
    delay: { open: 120, close: 250 }, // 120ms 划过开启，离开 250ms 后关闭
  });

  const { getFloatingProps } = useInteractions([hover]);

  // 动态同步 CodeMirror DOM 节点至 Floating UI
  useEffect(() => {
    if (hoveredElement) {
      refs.setReference(hoveredElement);
    } else {
      refs.setReference(null);
    }
  }, [hoveredElement, refs]);

  const previewText = documentData?.content
    ? truncateText(removeMarkdownHeaders(documentData.content), 150)
    : 'No content configured.';

  return (
    <FloatingPortal>
      <AnimatePresence>
        {isOpen && documentData && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-[var(--z-popover)] pointer-events-auto outline-none"
          >
            {/* 顶级物理回弹微动画 */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.96, y: 8, filter: 'blur(4px)' }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-[320px] glass-panel bg-white/95 border border-neutral-300/80 shadow-[0_16px_48px_rgba(0,0,0,0.08)] p-4 flex flex-col gap-3 font-sys"
            >
              {/* 控制头部 */}
              <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
                <span
                  className={`tag-badge ${documentData.badgeClass || 'bg-neutral-100 text-neutral-400'}`}
                >
                  {documentData.badge || 'Draft'}
                </span>
                <div className="flex items-center gap-1.5">
                  {/* 点击瞬间升格并定死在画布上 */}
                  <button
                    onClick={pinHoveredLink}
                    className="p-1 hover:bg-neutral-100 transition-colors border-none bg-transparent cursor-pointer rounded text-neutral-400 hover:text-bh-red"
                    title="Pin Card on Workspace"
                    aria-label="固定悬浮卡片到工作区"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="space-y-1.5">
                <h6 className="font-human text-base font-bold text-black">{documentData.title}</h6>
                <p className="font-human text-sm text-neutral-500 leading-relaxed italic">
                  {previewText}
                </p>
              </div>

              {/* 尾部引导 */}
              <div className="flex items-center justify-end">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                  Move mouse to hover card <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </FloatingPortal>
  );
}
