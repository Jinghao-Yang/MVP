/* ================================================
   FILE: src/context/PopoverContext.tsx
   ================================================ */
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import type { PopupData } from '../types';
import { wikiDb } from '../data/wikiDb';

interface PopoverContextType {
  popups: PopupData[];
  loadingWikiId: string | null;
  handleMouseEnter: (e: React.MouseEvent<HTMLSpanElement>, wikiId: string, depth?: number) => void;
  handleMouseLeave: (wikiId: string) => void;
  handlePopoverMouseEnter: (wikiId: string) => void;
  handlePopoverMouseLeave: (wikiId: string) => void;
  handlePositionChange: (id: string, x: number, y: number) => void;
  handleSizeChange: (id: string, width: number, height: number) => void;
  togglePin: (id: string) => void;
  toggleMinimize: (id: string) => void;
  closePopup: (id: string) => void;
  navigatePopover: (popupId: string, targetWikiId: string, direction: 'forward' | 'backward' | 'new') => void;
  isUserDragging: boolean;
  setIsUserDragging: (val: boolean) => void;
}

const PopoverContext = createContext<PopoverContextType | undefined>(undefined);

export function PopoverProvider({ children, setStatus }: { children: React.ReactNode; setStatus: (msg: string) => void }) {
  const [popups, setPopups] = useState<PopupData[]>([]);
  const [loadingWikiId, setLoadingWikiId] = useState<string | null>(null);
  const [isUserDragging, setIsUserDragging] = useState(false);
  const hoverTimers = useRef<Map<string, number>>(new Map());
  const popupsRef = useRef<PopupData[]>([]);
  useEffect(() => { popupsRef.current = popups; }, [popups]);

  const handleMouseEnter = useCallback((
    e: React.MouseEvent<HTMLSpanElement>,
    wikiId: string,
    depth = 0
  ) => {
    if (isUserDragging) return;

    const closeTimerKey = `close-${wikiId}`;
    const existingCloseTimer = hoverTimers.current.get(closeTimerKey);
    if (existingCloseTimer) {
      clearTimeout(existingCloseTimer);
      hoverTimers.current.delete(closeTimerKey);
    }

    setLoadingWikiId(wikiId);

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const defaultWidth = 540;
    const defaultHeight = 340;

    let adjustedX = rect.left + window.scrollX;
    let adjustedY = rect.bottom + window.scrollY + 8;

    if (adjustedX + defaultWidth > window.innerWidth) {
      adjustedX = window.innerWidth - defaultWidth - 24;
    }
    if (adjustedY + defaultHeight > window.innerHeight) {
      adjustedY = rect.top + window.scrollY - defaultHeight - 12;
    }
    if (adjustedX < 16) adjustedX = 16;

    const timerId = window.setTimeout(() => {
      hoverTimers.current.delete(wikiId);
      setLoadingWikiId(null);

      if (popupsRef.current.some((p: PopupData) => p.id === wikiId)) return;

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
          history: [wikiId],
          historyIndex: 0
        };
        setPopups((prev: PopupData[]) => [...prev.filter((p: PopupData) => p.isPinned || p.depth <= depth), newPopup]);
        setStatus(`Rendered: ${data.title}`);
      }
    }, 600);

    hoverTimers.current.set(wikiId, timerId);
  }, [isUserDragging, setStatus]);

  const handleMouseLeave = useCallback((wikiId: string) => {
    setLoadingWikiId(null);
    if (isUserDragging) return;

    const existingTimer = hoverTimers.current.get(wikiId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      hoverTimers.current.delete(wikiId);
    }

    const closeTimerKey = `close-${wikiId}`;
    const timerId = window.setTimeout(() => {
      hoverTimers.current.delete(closeTimerKey);
      setPopups((prev: PopupData[]) => prev.filter((p: PopupData) => p.id === wikiId && p.isPinned ? true : p.id !== wikiId));
    }, 800);

    hoverTimers.current.set(closeTimerKey, timerId);
  }, [isUserDragging]);

  const handlePopoverMouseEnter = useCallback((wikiId: string) => {
    if (isUserDragging) return;
    const closeTimerKey = `close-${wikiId}`;
    const existingCloseTimer = hoverTimers.current.get(closeTimerKey);
    if (existingCloseTimer) {
      clearTimeout(existingCloseTimer);
      hoverTimers.current.delete(closeTimerKey);
    }
  }, [isUserDragging]);

  const handlePopoverMouseLeave = useCallback((wikiId: string) => {
    handleMouseLeave(wikiId);
  }, [handleMouseLeave]);

const navigatePopover = useCallback((popupId: string, targetWikiId: string, direction: 'forward' | 'backward' | 'new') => {
    setPopups((prev: PopupData[]) => prev.map((p: PopupData) => {
      if (p.id !== popupId) return p;

      let newHistory = [...(p.history || [p.id])];
      let newIndex = p.historyIndex ?? 0;

      if (direction === 'new') {
        newHistory = newHistory.slice(0, newIndex + 1);
        newHistory.push(targetWikiId);
        newIndex = newHistory.length - 1;
      } else if (direction === 'backward') {
        newIndex = Math.max(0, newIndex - 1);
      } else if (direction === 'forward') {
        newIndex = Math.min(newHistory.length - 1, newIndex + 1);
      }

      const activeId = newHistory[newIndex];
      // ⚡ 补齐默认值属性，彻底修复类型不存在属性报错
      const data = wikiDb[activeId] || { 
        title: activeId, 
        excerpt: "Concept unmapped.",
        badge: 'Seedling',
        badgeClass: 'tag-badge-yellow'
      };

      return {
        ...p,
        title: data.title,
        excerpt: data.excerpt,
        badge: data.badge,
        badgeClass: data.badgeClass,
        history: newHistory,
        historyIndex: newIndex
      };
    }));
  }, []);

  const handlePositionChange = useCallback((id: string, x: number, y: number) => {
    setPopups((prev: PopupData[]) => prev.map((p: PopupData) => p.id === id ? { ...p, x, y, isPinned: true } : p));
  }, []);

  const handleSizeChange = useCallback((id: string, width: number, height: number) => {
    setPopups((prev: PopupData[]) => prev.map((p: PopupData) => p.id === id ? { ...p, width, height, isPinned: true } : p));
  }, []);

  const togglePin = useCallback((id: string) => {
    setPopups((prev: PopupData[]) => prev.map((p: PopupData) => p.id === id ? { ...p, isPinned: !p.isPinned } : p));
    setStatus('Pinned node to canvas.');
  }, [setStatus]);

  const toggleMinimize = useCallback((id: string) => {
    setPopups((prev: PopupData[]) => prev.map((p: PopupData) => p.id === id ? { ...p, isMinimized: !p.isMinimized } : p));
    setStatus('Minimized focus card.');
  }, [setStatus]);

  const closePopup = useCallback((id: string) => {
    setPopups((prev: PopupData[]) => prev.filter((p: PopupData) => p.id !== id));
  }, []);

  return (
    <PopoverContext.Provider value={{
      popups,
      loadingWikiId,
      handleMouseEnter,
      handleMouseLeave,
      handlePopoverMouseEnter,
      handlePopoverMouseLeave,
      handlePositionChange,
      handleSizeChange,
      togglePin,
      toggleMinimize,
      closePopup,
      navigatePopover,
      isUserDragging,
      setIsUserDragging
    }}>
      {children}
    </PopoverContext.Provider>
  );
}

export function usePopoverContext() {
  const context = useContext(PopoverContext);
  if (!context) throw new Error('usePopoverContext must be used within PopoverProvider');
  return context;
}