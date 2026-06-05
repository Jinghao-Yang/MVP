import { useState, useRef, useCallback } from 'react';
import type React from 'react';
import type { PopupData } from '../types';
import { wikiDb } from '../data/wikiDb';

export function usePopover(setStatus: (msg: string) => void) {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const hoverTimers = useRef<Map<string, number>>(new Map());
  const isUserDraggingOrResizing = useRef(false);

  const clearAllTimers = useCallback(() => {
    hoverTimers.current.forEach((timer) => {
      clearTimeout(timer);
    });
    hoverTimers.current.clear();
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, wikiId: string, depth = 0) => {
      if (isUserDraggingOrResizing.current) return;

      const closeTimerKey = `close-${wikiId}`;
      const existingCloseTimer = hoverTimers.current.get(closeTimerKey);
      if (existingCloseTimer) {
        clearTimeout(existingCloseTimer);
        hoverTimers.current.delete(closeTimerKey);
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const defaultWidth = 540;
      const defaultHeight = 340;

      let adjustedX = rect.left + window.scrollX;
      let adjustedY = rect.bottom + window.scrollY + 8;

      if (adjustedX + defaultWidth > window.innerWidth + window.scrollX) {
        adjustedX = window.innerWidth + window.scrollX - defaultWidth - 24;
      }
      if (adjustedY + defaultHeight > window.innerHeight + window.scrollY) {
        adjustedY = rect.top + window.scrollY - defaultHeight - 12;
      }
      if (adjustedX < 16) adjustedX = 16;

      const timerId = window.setTimeout(() => {
        hoverTimers.current.delete(wikiId);
        if (popups.some((p) => p.id === wikiId)) return;

        const data = wikiDb[wikiId];
        if (data) {
          const newPopup: PopupData = {
            id: wikiId,
            title: data.title,
            excerpt: data.excerpt,
            badge: data.badge,
            badgeClass: data.badgeClass,
            x: adjustedX,
            y: adjustedY,
            width: defaultWidth,
            height: defaultHeight,
            depth: depth + 1,
            isPinned: false,
            isMinimized: false,
          };
          setPopups((prev) => [...prev.filter((p) => p.isPinned || p.depth <= depth), newPopup]);
          setStatus(`Rendered Popover: ${data.title}`);
        }
      }, 750);

      hoverTimers.current.set(wikiId, timerId);
    },
    [popups, setStatus]
  );

  const handleMouseLeave = useCallback((wikiId: string) => {
    if (isUserDraggingOrResizing.current) return;

    const existingTimer = hoverTimers.current.get(wikiId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      hoverTimers.current.delete(wikiId);
    }

    const closeTimerKey = `close-${wikiId}`;
    const timerId = window.setTimeout(() => {
      hoverTimers.current.delete(closeTimerKey);
      setPopups((prev) =>
        prev.filter((p) => (p.id === wikiId && p.isPinned ? true : p.id !== wikiId))
      );
    }, 1000);

    hoverTimers.current.set(closeTimerKey, timerId);
  }, []);

  const handlePopoverMouseEnter = useCallback((wikiId: string) => {
    if (isUserDraggingOrResizing.current) return;

    const closeTimerKey = `close-${wikiId}`;
    const existingCloseTimer = hoverTimers.current.get(closeTimerKey);
    if (existingCloseTimer) {
      clearTimeout(existingCloseTimer);
      hoverTimers.current.delete(closeTimerKey);
    }
  }, []);

  const handlePopoverMouseLeave = useCallback(
    (wikiId: string) => {
      handleMouseLeave(wikiId);
    },
    [handleMouseLeave]
  );

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, x, y, isPinned: true } : p)));
  }, []);

  const handleSizeChange = useCallback((id: string, width: number, height: number) => {
    setPopups((prev) =>
      prev.map((p) => (p.id === id ? { ...p, width, height, isPinned: true } : p))
    );
  }, []);

  const togglePin = useCallback(
    (id: string) => {
      setPopups((prev) => prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p)));
      setStatus('Toggled Popover Pin.');
    },
    [setStatus]
  );

  const toggleMinimize = useCallback(
    (id: string) => {
      setPopups((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isMinimized: !p.isMinimized } : p))
      );
      setStatus('Minimized Popover.');
    },
    [setStatus]
  );

  const closePopup = useCallback((id: string) => {
    setPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const handleDragStart = useCallback(() => {
    isUserDraggingOrResizing.current = true;
    clearAllTimers();
  }, [clearAllTimers]);

  const handleDragEnd = useCallback(() => {
    isUserDraggingOrResizing.current = false;
  }, []);

  return {
    popups,
    handleMouseEnter,
    handleMouseLeave,
    handlePopoverMouseEnter,
    handlePopoverMouseLeave,
    handlePositionChange,
    handleSizeChange,
    togglePin,
    toggleMinimize,
    closePopup,
    handleDragStart,
    handleDragEnd,
  };
}
