/**
 * 弹窗相关类型定义
 * 包含弹窗数据、弹窗状态、弹窗卡片 Props 等类型
 */

import type React from 'react';

/**
 * 弹窗数据类型
 * 定义弹窗显示所需的所有数据
 */
export interface PopupData {
  /** 弹窗唯一标识符 */
  id: string;
  /** 弹窗标题 */
  title: string;
  /** 弹窗摘要内容 */
  excerpt: string;
  /** 标签名称 */
  badge: string;
  /** 标签样式类名 */
  badgeClass: string;
  /** 弹窗 X 坐标 */
  x: number;
  /** 弹窗 Y 坐标 */
  y: number;
  /** 弹窗宽度 */
  width: number;
  /** 弹窗高度 */
  height: number;
  /** 弹窗堆叠层级索引 */
  stackIndex: number;
  /** 是否固定 */
  isPinned: boolean;
  /** 是否最小化 */
  isMinimized: boolean;
  /** 历史记录 ID 列表 */
  history?: string[];
  /** 当前历史记录索引 */
  historyIndex?: number;
}

/**
 * 弹窗状态实体类型
 * 存储在 IndexedDB 中的弹窗状态数据
 */
export interface PopoverStateEntity {
  /** 关联的 wikiId */
  id: string;
  /** 弹窗 X 坐标 */
  x: number;
  /** 弹窗 Y 坐标 */
  y: number;
  /** 弹窗宽度 */
  width: number;
  /** 弹窗高度 */
  height: number;
  /** 是否固定 */
  isPinned: boolean;
  /** 是否最小化 */
  isMinimized: boolean;
}

/**
 * 弹窗卡片组件 Props 类型
 */
export interface PopoverCardProps {
  /** 弹窗数据 */
  popup: PopupData;
  /** 关闭弹窗回调 */
  onClose: () => void;
  /** 切换固定状态回调 */
  onPinToggle: () => void;
  /** 切换最小化状态回调 */
  onMinimizeToggle: () => void;
  /** 位置变化回调（仅更新内存状态） */
  onPositionChange: (x: number, y: number) => void;
  /** 尺寸变化回调（仅更新内存状态） */
  onSizeChange: (w: number, h: number) => void;
  /** 位置持久化回调（拖拽结束时调用） */
  onPositionSave: () => void;
  /** 尺寸持久化回调（调整大小结束时调用） */
  onSizeSave: () => void;
  /** 鼠标进入回调 */
  onMouseEnter: () => void;
  /** 鼠标离开回调 */
  onMouseLeave: () => void;
  /** 链接悬停回调 */
  onLinkHover: (
    e: MouseEvent | React.MouseEvent<Element>,
    wikiId: string,
    stackIndex?: number
  ) => void;
  /** 链接离开回调 */
  onLinkLeave: (wikiId: string) => void;
  /** 链接点击回调（触摸设备使用） */
  onLinkClick: (wikiId: string, stackIndex?: number) => void;
  /** 拖拽开始回调 */
  onDragStart: () => void;
  /** 拖拽结束回调 */
  onDragEnd: () => void;
}
