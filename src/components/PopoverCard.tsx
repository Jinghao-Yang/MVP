import React, { useEffect, useRef, memo } from "react";
import { Pin, Minimize2 } from "lucide-react";
import type { PopoverCardProps } from "../types";

interface DragState {
  startX: number;
  startY: number;
  initX: number;
  initY: number;
}

interface ResizeState {
  startX: number;
  startY: number;
  initW: number;
  initH: number;
}

interface CardState {
  pos: { x: number; y: number };
  size: { w: number; h: number };
  isDragging: boolean;
  isResizing: boolean;
  dragStart: DragState;
  resizeStart: ResizeState;
}

export const PopoverCard: React.FC<PopoverCardProps> = ({
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
  onDragEnd
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  const cardState = useRef<CardState>({
    pos: { x: popup.x, y: popup.y },
    size: { w: popup.width, h: popup.height },
    isDragging: false,
    isResizing: false,
    dragStart: { startX: 0, startY: 0, initX: 0, initY: 0 },
    resizeStart: { startX: 0, startY: 0, initW: 0, initH: 0 }
  });

  useEffect(() => {
    if (!cardState.current.isDragging) {
      cardState.current.pos = { x: popup.x, y: popup.y };
      if (cardRef.current) {
        cardRef.current.style.transform = `translate3d(${popup.x}px, ${popup.y}px, 0)`;
      }
    }
  }, [popup.x, popup.y]);

  useEffect(() => {
    if (!cardState.current.isResizing) {
      cardState.current.size = { w: popup.width, h: popup.height };
      if (cardRef.current) {
        cardRef.current.style.width = `${popup.width}px`;
        cardRef.current.style.height = `${popup.height}px`;
      }
    }
  }, [popup.width, popup.height]);

  const resetCardStyle = () => {
    if (cardRef.current) {
      cardRef.current.classList.remove('dragging-active');
      cardRef.current.style.backdropFilter = '';
      (cardRef.current.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = '';
      cardRef.current.style.background = '';
      cardRef.current.style.transition = '';
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const state = cardState.current;
      if (state.isDragging && cardRef.current) {
        const dx = e.clientX - state.dragStart.startX;
        const dy = e.clientY - state.dragStart.startY;
        const nextX = state.dragStart.initX + dx;
        const nextY = state.dragStart.initY + dy;
        
        cardRef.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
        state.pos = { x: nextX, y: nextY };
      }
      if (state.isResizing && cardRef.current) {
        const dx = e.clientX - state.resizeStart.startX;
        const dy = e.clientY - state.resizeStart.startY;
        const nextW = Math.max(260, state.resizeStart.initW + dx);
        const nextH = Math.max(160, state.resizeStart.initH + dy);

        cardRef.current.style.width = `${nextW}px`;
        cardRef.current.style.height = `${nextH}px`;
        state.size = { w: nextW, h: nextH };
      }
    };

    const handleMouseUp = () => {
      const state = cardState.current;
      if (state.isDragging) {
        state.isDragging = false;
        resetCardStyle();
        onDragEnd();
        onPositionChange(state.pos.x, state.pos.y);
      }
      if (state.isResizing) {
        state.isResizing = false;
        resetCardStyle();
        onDragEnd();
        onSizeChange(state.size.w, state.size.h);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onPositionChange, onSizeChange, onDragEnd]);

  const activeMove = cardState.current.isDragging || cardState.current.isResizing;

  return (
    <div
      ref={cardRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: popup.width,
        height: popup.height,
        transform: `translate3d(${popup.x}px, ${popup.y}px, 0)`,
        zIndex: 100 + popup.depth,
        transition: activeMove ? 'none' : 'transform 0.75s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease',
        backdropFilter: activeMove ? 'none' : 'blur(24px)',
        WebkitBackdropFilter: activeMove ? 'none' : 'blur(24px)',
        background: activeMove ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.45)'
      }}
      className="glass-panel border border-neutral-300 shadow-[0_12px_40px_rgba(0,0,0,0.06)] text-xs flex flex-col overflow-hidden animate-in fade-in duration-300"
    >
      {/* ⚡ 【美学升级】：高定纯净 1.5s 缓慢飘入容器 popup-inner，彻底摆脱闪动，回归文本画布本源 */}
      <div className="w-full h-full flex flex-col popup-inner">
        {/* 拖动把手 (Header Bar) */}
        <div
          onMouseDown={(e) => {
            e.preventDefault();
            const state = cardState.current;
            state.isDragging = true;
            state.dragStart = {
              startX: e.clientX,
              startY: e.clientY,
              initX: state.pos.x,
              initY: state.pos.y
            };
            if (cardRef.current) {
              cardRef.current.classList.add('dragging-active');
              cardRef.current.style.backdropFilter = 'none';
              (cardRef.current.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = 'none';
              cardRef.current.style.background = 'rgba(255, 255, 255, 0.98)';
              cardRef.current.style.transition = 'none'; 
            }
            onDragStart(); 
          }}
          className="flex items-center justify-between border-b border-black/5 bg-neutral-100/80 p-3 px-4 shrink-0 select-none cursor-move"
        >
          <span className={`tag-badge ${popup.badgeClass}`}>{popup.badge}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPinToggle}
              className={`p-1 hover:bg-black/10 transition-colors border-none cursor-pointer ${popup.isPinned ? "text-[var(--bh-red)]" : "text-neutral-400"}`}
              title="Pin Popover (Sticky)"
            >
              <Pin className="w-3 h-3" />
            </button>
            <button
              onClick={onMinimizeToggle}
              className="p-1 hover:bg-black/10 transition-colors text-neutral-400 hover:text-black border-none cursor-pointer"
              title="Minimize"
            >
              <Minimize2 className="w-3 h-3" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-black/10 transition-colors text-neutral-400 hover:text-black font-bold border-none cursor-pointer text-[10px]"
              title="Close"
            >
              ✕
          </button>
        </div>
      </div>

      <h5 className="font-human text-base font-bold text-black mb-1.5 px-4 pt-4 shrink-0">{popup.title}</h5>

      <div className="flex-1 overflow-y-auto scroll-hide px-4 pb-4">
        {/* ⚡ 【字号完美对齐】：全面应用 prose-reading font-human 的 1.35rem 衬线体，与文章完美融为一体 */}
        <p className="prose-reading font-human outline-none text-neutral-700 leading-relaxed">
          {popup.id === 'heine-borel' ? (
            <>
              In metric spaces, a subset is closed and bounded iff it is{" "}
              <span 
                className="wiki-link font-bold" 
                onMouseEnter={(e) => onLinkHover(e, 'compactness', popup.depth)} 
                onMouseLeave={() => onLinkLeave('compactness')}
              >
                compact
              </span>
              . The theorem generalizes interval compactness to general Euclidean spaces.
            </>
          ) : popup.id === 'tychonoff' ? (
            <>
              Asserts that the product of any collection of compact spaces is compact. It is equivalent to the{" "}
              <span 
                className="wiki-link font-bold" 
                onMouseEnter={(e) => onLinkHover(e, 'axiom-of-choice', popup.depth)} 
                onMouseLeave={() => onLinkLeave('axiom-of-choice')}
              >
                Axiom of Choice
              </span>
              .
            </>
          ) : (
            popup.excerpt
          )}
        </p>
      </div>
    </div>

    {/* 伸缩手柄 */}
    <div
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const state = cardState.current;
        state.isResizing = true;
        state.resizeStart = {
          startX: e.clientX,
          startY: e.clientY,
          initW: state.size.w,
          initH: state.size.h
        };
        if (cardRef.current) {
          cardRef.current.classList.add('dragging-active');
          cardRef.current.style.backdropFilter = 'none';
          (cardRef.current.style as unknown as { webkitBackdropFilter: string }).webkitBackdropFilter = 'none';
          cardRef.current.style.background = 'rgba(255, 255, 255, 0.98)';
          cardRef.current.style.transition = 'none';
        }
        onDragStart();
      }}
      className="absolute bottom-1 right-1 cursor-se-resize select-none"
    >
      <svg width="8" height="8" viewBox="0 0 8 8" className="opacity-40 hover:opacity-100 text-neutral-600">
        <path d="M6 0 L0 6 M8 2 L2 8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  </div>
  );
};

export const PopoverCardMemo = memo(PopoverCard);