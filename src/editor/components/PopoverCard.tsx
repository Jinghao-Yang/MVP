/* ================================================
   FILE: src/editor/components/PopoverCard.tsx
   ================================================ */
import React, { useState, memo, useMemo, useEffect } from 'react';
import { Pin, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import type { PopoverCardProps } from '@/types';
import { useAppStore } from '@/store/useAppStore';

export const PopoverCard: React.FC<PopoverCardProps> = memo(
  ({
    popup,
    onClose,
    onPinToggle,
    onMinimizeToggle,
    onPositionChange,
    onSizeChange,
    onMouseEnter,
    onMouseLeave,
    onLinkHover,
    onLinkLeave,
    onDragStart,
    onDragEnd,
  }) => {
    const bringToFront = useAppStore((state) => state.bringToFront);
    const activePopupId = useAppStore((state) => state.activePopupId);
    const navigatePopover = useAppStore((state) => state.navigatePopover);
    const dragControls = useDragControls();

    const [size, setSize] = useState({ w: popup.width, h: popup.height });
    const [isSmallScreen, setIsSmallScreen] = useState(false);

    const isActive = activePopupId === popup.id;

    useEffect(() => {
      const checkScreenSize = () => {
        setIsSmallScreen(window.innerWidth <= 768);
      };

      checkScreenSize();
      window.addEventListener('resize', checkScreenSize);
      return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const hasBack = useMemo(
      () => popup.history && (popup.historyIndex ?? 0) > 0,
      [popup.history, popup.historyIndex]
    );
    const hasForward = useMemo(
      () => popup.history && (popup.historyIndex ?? 0) < popup.history.length - 1,
      [popup.history, popup.historyIndex]
    );

    const handleResizeStart = (e: React.PointerEvent) => {
      e.preventDefault();
      bringToFront(popup.id);
      onDragStart();

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = size.w;
      const startH = size.h;

      const onMove = (moveEvent: PointerEvent) => {
        setSize({
          w: Math.max(300, startW + (moveEvent.clientX - startX)),
          h: Math.max(200, startH + (moveEvent.clientY - startY)),
        });
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        onSizeChange(size.w, size.h);
        onDragEnd();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };

    return (
      <motion.div
        drag={!isSmallScreen}
        dragControls={dragControls}
        dragListener={false}
        // 🌟 手感重塑：彻底抛弃滑移感和橡皮筋，采用绝对 1:1 干脆追踪映射，像真的一张实体卡片被按住一样
        dragMomentum={false}
        dragElastic={0}
        // 🌟 入场重塑：极简的高端弹性展开与光学模糊解开
        initial={{ opacity: 0, y: popup.y + 16, scale: 0.96, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: popup.y, scale: 1, filter: 'blur(0px)' }}
        // 高手感弹簧阻尼模型，强力无抖动
        transition={{ type: 'spring', stiffness: 500, damping: 40, mass: 0.8 }}
        onPointerDown={() => bringToFront(popup.id)}
        onDragStart={() => {
          bringToFront(popup.id);
          onDragStart();
        }}
        onDragEnd={(e: unknown, info: { offset: { x: number; y: number } }) => {
          const nextX = popup.x + info.offset.x;
          const nextY = popup.y + info.offset.y;
          onPositionChange(nextX, nextY);
          onDragEnd();
        }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        // 拖拽时：取消所有的旋转，只做轻微抓取放大和阴影强化，极具克制感
        whileDrag={{
          scale: 1.015,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.15)',
          cursor: 'grabbing',
        }}
        style={{
          position: isSmallScreen ? 'fixed' : 'absolute',
          top: isSmallScreen ? '50%' : 'auto',
          left: isSmallScreen ? '50%' : 'auto',
          transform: isSmallScreen ? 'translate(-50%, -50%)' : 'none',
          width: isSmallScreen ? '90vw' : size.w,
          height: isSmallScreen ? 'auto' : size.h,
          maxHeight: isSmallScreen ? '80vh' : 'none',
          zIndex: isActive ? 200 : 100 + popup.depth,
        }}
        className={`glass-panel border border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden transition-colors ${
          isActive ? 'bg-white/95 border-neutral-400' : 'bg-white/70'
        }`}
      >
        <div className="w-full h-full flex flex-col popup-inner">
          <div
            onPointerDown={isSmallScreen ? undefined : (e) => dragControls.start(e)}
            className={`drag-handle flex items-center justify-between border-b border-black/5 bg-neutral-100/80 p-3 px-4 shrink-0 ${isSmallScreen ? 'cursor-default' : 'cursor-move'}`}
          >
            <div className="flex items-center gap-2">
              <span className={`tag-badge ${popup.badgeClass}`}>{popup.badge}</span>
              {popup.history && popup.history.length > 1 && (
                <div className="flex items-center bg-black/5 rounded px-1">
                  <button
                    disabled={!hasBack}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigatePopover(popup.id, 'backward');
                    }}
                    className={`p-0.5 border-none bg-transparent transition-colors ${hasBack ? 'text-neutral-700 hover:text-black cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={!hasForward}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigatePopover(popup.id, 'forward');
                    }}
                    className={`p-0.5 border-none bg-transparent transition-colors ${hasForward ? 'text-neutral-700 hover:text-black cursor-pointer' : 'text-neutral-300 cursor-not-allowed'}`}
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPinToggle();
                }}
                className={`p-1 hover:bg-black/10 transition-colors border-none cursor-pointer ${popup.isPinned ? 'text-[var(--bh-red)]' : 'text-neutral-400'}`}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimizeToggle();
                }}
                className="p-1 hover:bg-black/10 transition-colors text-neutral-400 hover:text-black border-none cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 hover:bg-black/10 transition-colors text-neutral-400 hover:text-black font-bold border-none cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>
          </div>

          <h5 className="font-human text-lg font-bold text-black mb-1.5 px-4 pt-4 shrink-0">
            {popup.title}
          </h5>

          <div className="flex-1 overflow-y-auto scroll-hide px-4 pb-4">
            <p className="prose-reading font-human outline-none text-neutral-700 leading-relaxed">
              {popup.id === 'heine-borel' ? (
                <>
                  In metric spaces, a subset is closed and bounded iff it is{' '}
                  <span
                    className="cm-link font-bold"
                    onMouseEnter={(e: React.MouseEvent) => {
                      // 内联链接也受防选与防拖拽机制拦截保护
                      if (useAppStore.getState().isUserDragging) return;
                      if (window.getSelection()?.toString().trim().length) return;
                      onLinkHover(e, 'compactness', popup.depth);
                    }}
                    onMouseLeave={() => onLinkLeave('compactness')}
                  >
                    compact
                  </span>
                  . The theorem generalizes interval compactness to general Euclidean spaces.
                </>
              ) : (
                popup.excerpt
              )}
            </p>
          </div>
        </div>

        {!isSmallScreen && (
          <div
            onPointerDown={handleResizeStart}
            className="absolute bottom-1 right-1 cursor-se-resize p-1"
          >
            <svg
              width="8"
              height="8"
              viewBox="0 0 8 8"
              className="opacity-40 hover:opacity-100 text-neutral-600"
            >
              <path d="M6 0 L0 6 M8 2 L2 8" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
        )}
      </motion.div>
    );
  }
);
