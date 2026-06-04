/* ================================================
   FILE: src/types/index.ts
   ================================================ */
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
  history?: string[];
  historyIndex?: number;
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
  openPage: (page: string) => void;
  openCommandPalette: () => void;
  setStatus: (status: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
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
  onLinkHover: (e: MouseEvent | React.MouseEvent<Element>, wikiId: string, depth?: number) => void;
  onLinkLeave: (wikiId: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

export interface EditorPageProps {
  isZenMode: boolean;
  onToggleZen: () => void;
  openPage: (page: string) => void;
}

export interface EditorSidebarProps {
  isZenMode: boolean;
}
