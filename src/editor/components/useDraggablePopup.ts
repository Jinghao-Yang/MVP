import { useState, useCallback } from 'react';

interface UseDraggablePopupReturn {
  size: { w: number; h: number };
  handleResizeStart: (
    e: React.PointerEvent,
    onDragStart: () => void,
    onDragEnd: () => void,
    onSizeChange: (w: number, h: number) => void,
    onSizeSave: () => void
  ) => void;
}

export function useDraggablePopup(
  initialWidth: number,
  initialHeight: number
): UseDraggablePopupReturn {
  const [size, setSize] = useState({ w: initialWidth, h: initialHeight });

  const handleResizeStart = useCallback(
    (
      e: React.PointerEvent,
      onDragStart: () => void,
      onDragEnd: () => void,
      onSizeChange: (w: number, h: number) => void,
      onSizeSave: () => void
    ) => {
      e.preventDefault();
      onDragStart();

      const startX = e.clientX;
      const startY = e.clientY;
      const startW = size.w;
      const startH = size.h;

      const onMove = (moveEvent: PointerEvent) => {
        const nextW = Math.max(320, startW + (moveEvent.clientX - startX));
        const nextH = Math.max(200, startH + (moveEvent.clientY - startY));
        setSize({ w: nextW, h: nextH });
        onSizeChange(nextW, nextH);
      };

      const onUp = () => {
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        onSizeSave();
        onDragEnd();
      };

      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [size]
  );

  return { size, handleResizeStart };
}
