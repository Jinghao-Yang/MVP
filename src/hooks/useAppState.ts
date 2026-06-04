import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export function useAppState() {
  const [activePage, setActivePage] = useState('project');
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [isZenMode, setZenMode] = useState(false);
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState('System active.');
  const [showStatus, setShowStatus] = useState(true);
  const [quickCaptureText, setQuickCaptureText] = useState('');

  const statusTimeout = useRef<number | null>(null);
  const sidebarLeaveTimer = useRef<number | null>(null);

  const setStatus = useCallback((msg: string) => {
    setStatusMsg(msg);
    setShowStatus(true);
    if (statusTimeout.current) clearTimeout(statusTimeout.current);
    statusTimeout.current = window.setTimeout(() => {
      setShowStatus(false);
    }, 2500);
  }, []);

  useEffect(() => {
    setStatus('System active.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isZenMode) {
      document.body.classList.add('zen-active');
    } else {
      document.body.classList.remove('zen-active');
    }
  }, [isZenMode]);

  const handleSidebarMouseEnter = useCallback(() => {
    if (isZenMode) return;
    if (document.body.classList.contains('dragging-active')) return;

    if (sidebarLeaveTimer.current) {
      clearTimeout(sidebarLeaveTimer.current);
      sidebarLeaveTimer.current = null;
    }
    setIsSidebarHovered(true);
  }, [isZenMode]);

  const handleSidebarMouseLeave = useCallback(() => {
    sidebarLeaveTimer.current = window.setTimeout(() => {
      setIsSidebarHovered(false);
    }, 400);
  }, []);

  const handleOpenPage = useCallback((page: string) => {
    setActivePage(page);
    setZenMode(false);
    document.body.classList.remove('zen-active');
    setIsSidebarHovered(false);
  }, []);

  const getMarginClass = useCallback(() => {
    return 'ml-4';
  }, []);

  const isSidebarActiveCollapsed = useMemo(() => {
    if (isZenMode) return true;
    return !isSidebarHovered;
  }, [isSidebarHovered, isZenMode]);

  return {
    activePage,
    setActivePage: handleOpenPage,
    isSidebarHovered,
    setIsSidebarHovered,
    isZenMode,
    setZenMode,
    isCommandPaletteOpen,
    setCommandPaletteOpen,
    statusMsg,
    showStatus,
    quickCaptureText,
    setQuickCaptureText,
    setStatus,
    handleSidebarMouseEnter,
    handleSidebarMouseLeave,
    getMarginClass,
    isSidebarActiveCollapsed
  };
}