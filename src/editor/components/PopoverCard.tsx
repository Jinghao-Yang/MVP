/* ================================================
   FILE: src/editor/components/PopoverCard.tsx
   ================================================ */
import React, { useState, memo, useEffect } from 'react';
import { Pin, Minimize2 } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import type { PopoverCardProps } from '@/types';
import { usePopupStore } from '@/stores/popup-store';

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
    const bringToFront = usePopupStore((state) => state.bringToFront);
    const activePopupId = usePopupStore((state) => state.activePopupId);
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

    const handleResizeStart = (e: React.PointerEvent) => {
      e.preventDefault();
      bringToFront(popup.id);
      onDragStart();

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = size.w;
      const startH = size.h;

      const onMove = (moveEvent: PointerEvent) => {
        const nextW = Math.max(320, startW + (moveEvent.clientX - startX));
        const nextH = Math.max(200, startH + (moveEvent.clientY - startY));
        setSize({ w: nextW, h: nextH });
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
        // 极致的物理追手，彻底剥离拖拽后的残留动量及不真实偏移
        dragMomentum={false}
        dragElastic={0}
        initial={{ opacity: 0, y: popup.y + 16, scale: 0.96, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: popup.y, scale: 1, filter: 'blur(0px)' }}
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
        whileDrag={{
          scale: 1.01,
          boxShadow: '0 24px 48px -12px rgba(0,0,0,0.12)',
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
        className={`glass-panel border border-neutral-300/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden transition-colors ${
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
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPinToggle();
                }}
                className={`p-1 hover:bg-black/10 transition-colors border-none cursor-pointer bg-transparent ${popup.isPinned ? 'text-[var(--bh-red)]' : 'text-neutral-400'}`}
              >
                <Pin className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMinimizeToggle();
                }}
                className="p-1 hover:bg-black/10 transition-colors text-neutral-400 hover:text-black border-none cursor-pointer bg-transparent"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                className="p-1 hover:bg-black/10 transition-colors text-neutral-400 hover:text-black font-bold border-none cursor-pointer text-xs bg-transparent"
              >
                ✕
              </button>
            </div>
          </div>

          <h5 className="font-human text-lg font-bold text-black mb-1.5 px-4 pt-4 shrink-0">
            {popup.title}
          </h5>

          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4">
            <p className="prose-reading font-human outline-none text-neutral-700 leading-relaxed text-[15px]">
              {popup.id === 'heine-borel' ? (
                <>
                  In metric spaces, a subset is closed and bounded iff it is{' '}
                  <span
                    className="cm-wysiwyg-link font-medium text-[var(--bh-red)] relative px-0.5 cursor-pointer"
                    onMouseEnter={(e: React.MouseEvent) => {
                      if (usePopupStore.getState().isUserDragging) return;
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
