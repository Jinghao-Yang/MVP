import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

export function useAppState() {
  const [activePage, setActivePage] = useState('project');
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  }, [setStatus]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (quickCaptureText.trim()) {
          setStatus('Captured: ' + quickCaptureText);
          setQuickCaptureText('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickCaptureText, setStatus]);

  useEffect(() => {
    if (isZenMode) {
      document.body.classList.add('zen-active');
    } else {
      document.body.classList.remove('zen-active');
    }
  }, [isZenMode]);

  const handleSidebarMouseEnter = useCallback(() => {
    if (isZenMode) return;
    if (document.querySelector('.dragging-active')) return;

    if (sidebarLeaveTimer.current) {
      clearTimeout(sidebarLeaveTimer.current);
      sidebarLeaveTimer.current = null;
    }
    setIsSidebarHovered(true);
  }, [isZenMode]);

  const handleSidebarMouseLeave = useCallback(() => {
    if (activePage === 'editor') {
      sidebarLeaveTimer.current = window.setTimeout(() => {
        setIsSidebarHovered(false);
      }, 600);
    } else {
      setIsSidebarHovered(false);
    }
  }, [activePage]);

  const handleOpenPage = useCallback((page: string) => {
    setActivePage(page);
    if (page === 'project') {
      setZenMode(false);
      setIsSidebarHovered(false);
    }
    if (page === 'editor') {
      setIsSidebarHovered(true);
    }
  }, []);

  const getSidebarCollapsedState = useCallback(() => {
    if (activePage === 'editor') {
      return !isSidebarHovered;
    }
    return isSidebarCollapsed;
  }, [activePage, isSidebarHovered, isSidebarCollapsed]);

  const getMarginClass = useCallback(() => {
    if (activePage === 'editor') return 'ml-4';
    return 'ml-[272px]';
  }, [activePage]);

  const isSidebarActiveCollapsed = useMemo(() => {
    if (activePage === 'editor') {
      return !isSidebarHovered;
    }
    return isSidebarCollapsed;
  }, [activePage, isSidebarHovered, isSidebarCollapsed]);

  const isZenActive = useMemo(() => {
    return activePage === 'editor' && isSidebarActiveCollapsed;
  }, [activePage, isSidebarActiveCollapsed]);

  return {
    activePage,
    setActivePage: handleOpenPage,
    isSidebarCollapsed,
    setSidebarCollapsed,
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
    getSidebarCollapsedState,
    getMarginClass,
    isSidebarActiveCollapsed,
    isZenActive
  };
}