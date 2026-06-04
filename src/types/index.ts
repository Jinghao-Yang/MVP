export interface PopupData {
  id: string;
  title: string;
  excerpt: string;
  badge: string;
  badgeClass: string;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  isPinned: boolean;
  isMinimized: boolean;
}

export interface WikiEntry {
  title: string;
  excerpt: string;
  badge: string;
  badgeClass: string;
}

export type WikiDb = Record<string, WikiEntry>;

export interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  openPage: (page: string) => void;
  openCommandPalette: () => void;
  setStatus: (status: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  activePage: string;
}

import type React from 'react';

export interface PopoverCardProps {
  popup: PopupData;
  onClose: () => void;
  onPinToggle: () => void;
  onMinimizeToggle: () => void;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (w: number, h: number) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onLinkHover: (e: React.MouseEvent<HTMLSpanElement, MouseEvent>, wikiId: string, depth: number) => void;
  onLinkLeave: (wikiId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export interface EditorPageProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  openPage: (page: string) => void;
  setStatus: (status: string) => void;
}

export interface AppState {
  activePage: string;
  isSidebarCollapsed: boolean;
  isSidebarHovered: boolean;
  isZenMode: boolean;
  isCommandPaletteOpen: boolean;
  statusMsg: string;
  showStatus: boolean;
  quickCaptureText: string;
}

export type EditorSidebarTab = 'context' | 'annotations';

export interface EditorSidebarProps {
  isZenMode: boolean;
  activeTab: EditorSidebarTab;
  onTabChange: (tab: EditorSidebarTab) => void;
  setStatus: (status: string) => void;
}