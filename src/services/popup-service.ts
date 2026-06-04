/**
 * 弹窗服务
 * 封装弹窗的打开、关闭、位置和尺寸管理逻辑
 * 提供业务层面的抽象，包括位置计算和边界检查
 */

import * as popoverDb from '@/db/popovers';
import * as documentDb from '@/db/documents';
import type { PopupData, PopoverStateEntity } from '@/types';

/**
 * 默认弹窗配置
 */
const DEFAULT_POPUP_CONFIG = {
  /** 默认宽度 */
  width: 500,
  /** 默认高度 */
  height: 320,
  /** 默认 X 偏移量 */
  offsetX: 20,
  /** 默认 Y 偏移量 */
  offsetY: 20,
  /** 最小宽度 */
  minWidth: 300,
  /** 最小高度 */
  minHeight: 200,
  /** 最大宽度 */
  maxWidth: 800,
  /** 最大高度 */
  maxHeight: 600,
} as const;

/**
 * 弹窗打开结果
 */
export interface PopupOpenResult {
  /** 弹窗数据 */
  popup: PopupData;
  /** 是否为新创建的弹窗 */
  isNew: boolean;
}

/**
 * 打开弹窗
 * 获取文档数据并创建弹窗，如果弹窗已存在则恢复其状态
 * @param wikiId - Wiki ID（文档 ID）
 * @param position - 弹窗位置（可选，不提供则使用默认位置或恢复保存的位置）
 * @param depth - 弹窗深度层级（默认为 0）
 * @returns 弹窗打开结果，包含弹窗数据和是否为新创建的标识
 */
export async function openPopup(
  wikiId: string,
  position?: { x: number; y: number },
  depth: number = 0
): Promise<PopupOpenResult | null> {
  // 获取文档数据
  const document = await documentDb.getDocument(wikiId);
  if (!document) {
    console.warn(`Document not found: ${wikiId}`);
    return null;
  }

  // 获取已保存的弹窗状态
  const savedState = await popoverDb.getPopoverState(wikiId);

  // 确定弹窗位置和尺寸
  let x: number;
  let y: number;
  let width: number;
  let height: number;
  let isNew: boolean;

  if (position) {
    // 使用传入的位置，并应用边界检查
    const boundedPosition = ensureWithinBounds(position.x, position.y);
    x = boundedPosition.x;
    y = boundedPosition.y;
    width = savedState?.width ?? DEFAULT_POPUP_CONFIG.width;
    height = savedState?.height ?? DEFAULT_POPUP_CONFIG.height;
    isNew = !savedState;
  } else if (savedState) {
    // 使用保存的位置和尺寸
    x = savedState.x;
    y = savedState.y;
    width = savedState.width;
    height = savedState.height;
    isNew = false;
  } else {
    // 使用默认位置
    const defaultPosition = calculateDefaultPosition(depth);
    x = defaultPosition.x;
    y = defaultPosition.y;
    width = DEFAULT_POPUP_CONFIG.width;
    height = DEFAULT_POPUP_CONFIG.height;
    isNew = true;
  }

  // 创建弹窗数据
  const popup: PopupData = {
    id: wikiId,
    title: document.title,
    excerpt: generateExcerpt(document.content),
    badge: document.badge,
    badgeClass: document.badgeClass,
    x,
    y,
    width,
    height,
    depth,
    isPinned: false,
    isMinimized: false,
  };

  // 保存弹窗状态
  await popoverDb.savePopoverState({
    id: wikiId,
    x,
    y,
    width,
    height,
  });

  return { popup, isNew };
}

/**
 * 关闭弹窗
 * @param id - 弹窗 ID
 * @param persistState - 是否保留弹窗状态（默认为 true）
 */
export async function closePopup(id: string, persistState: boolean = true): Promise<void> {
  if (!persistState) {
    // 删除弹窗状态
    await popoverDb.deletePopoverState(id);
  }
  // 如果 persistState 为 true，保留弹窗状态以便下次恢复
}

/**
 * 更新弹窗位置
 * 包含边界检查逻辑
 * @param id - 弹窗 ID
 * @param x - X 坐标
 * @param y - Y 坐标
 */
export async function updatePopupPosition(id: string, x: number, y: number): Promise<void> {
  // 应用边界检查
  const boundedPosition = ensureWithinBounds(x, y);
  await popoverDb.updatePopoverPosition(id, boundedPosition.x, boundedPosition.y);
}

/**
 * 更新弹窗尺寸
 * 包含最小/最大尺寸限制
 * @param id - 弹窗 ID
 * @param width - 宽度
 * @param height - 高度
 */
export async function updatePopupSize(id: string, width: number, height: number): Promise<void> {
  // 应用尺寸限制
  const constrainedSize = constrainSize(width, height);
  await popoverDb.updatePopoverSize(id, constrainedSize.width, constrainedSize.height);
}

/**
 * 更新弹窗位置和尺寸
 * @param id - 弹窗 ID
 * @param x - X 坐标
 * @param y - Y 坐标
 * @param width - 宽度
 * @param height - 高度
 */
export async function updatePopupPositionAndSize(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  // 应用边界检查和尺寸限制
  const boundedPosition = ensureWithinBounds(x, y);
  const constrainedSize = constrainSize(width, height);

  await popoverDb.updatePopoverPositionAndSize(
    id,
    boundedPosition.x,
    boundedPosition.y,
    constrainedSize.width,
    constrainedSize.height
  );
}

/**
 * 获取弹窗状态
 * @param id - 弹窗 ID
 * @returns 弹窗状态实体或 undefined
 */
export async function getPopupState(id: string): Promise<PopoverStateEntity | undefined> {
  return await popoverDb.getPopoverState(id);
}

/**
 * 保存弹窗状态
 * @param id - 弹窗 ID
 * @param state - 弹窗状态（部分字段）
 */
export async function savePopupState(
  id: string,
  state: Partial<Omit<PopoverStateEntity, 'id'>>
): Promise<void> {
  // 获取现有状态
  const existingState = await popoverDb.getPopoverState(id);

  // 合并状态
  const newState: PopoverStateEntity = {
    id,
    x: state.x ?? existingState?.x ?? 100,
    y: state.y ?? existingState?.y ?? 100,
    width: state.width ?? existingState?.width ?? DEFAULT_POPUP_CONFIG.width,
    height: state.height ?? existingState?.height ?? DEFAULT_POPUP_CONFIG.height,
  };

  // 应用边界检查和尺寸限制
  const boundedPosition = ensureWithinBounds(newState.x, newState.y);
  const constrainedSize = constrainSize(newState.width, newState.height);

  await popoverDb.savePopoverState({
    ...newState,
    x: boundedPosition.x,
    y: boundedPosition.y,
    width: constrainedSize.width,
    height: constrainedSize.height,
  });
}

/**
 * 获取所有弹窗状态
 * @returns 所有弹窗状态实体数组
 */
export async function getAllPopupStates(): Promise<PopoverStateEntity[]> {
  return await popoverDb.getAllPopoverStates();
}

/**
 * 清空所有弹窗状态
 */
export async function clearAllPopupStates(): Promise<void> {
  await popoverDb.clearAllPopoverStates();
}

/**
 * 计算默认弹窗位置
 * 根据深度层级计算偏移位置，实现层叠效果
 * @param depth - 弹窗深度层级
 * @returns 计算出的位置
 */
function calculateDefaultPosition(depth: number): { x: number; y: number } {
  const offset = depth * 30; // 每层偏移 30px
  return {
    x: DEFAULT_POPUP_CONFIG.offsetX + offset,
    y: DEFAULT_POPUP_CONFIG.offsetY + offset,
  };
}

/**
 * 确保位置在屏幕边界内
 * @param x - X 坐标
 * @param y - Y 坐标
 * @returns 边界检查后的位置
 */
function ensureWithinBounds(x: number, y: number): { x: number; y: number } {
  // 获取视口尺寸（如果在浏览器环境中）
  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 确保 X 坐标不超出右边界
    const maxX = viewportWidth - DEFAULT_POPUP_CONFIG.minWidth;
    const boundedX = Math.max(0, Math.min(x, maxX));

    // 确保 Y 坐标不超出下边界
    const maxY = viewportHeight - DEFAULT_POPUP_CONFIG.minHeight;
    const boundedY = Math.max(0, Math.min(y, maxY));

    return { x: boundedX, y: boundedY };
  }

  // 非浏览器环境，直接返回原值
  return { x, y };
}

/**
 * 限制尺寸在最小和最大范围内
 * @param width - 宽度
 * @param height - 高度
 * @returns 限制后的尺寸
 */
function constrainSize(width: number, height: number): { width: number; height: number } {
  return {
    width: Math.max(DEFAULT_POPUP_CONFIG.minWidth, Math.min(width, DEFAULT_POPUP_CONFIG.maxWidth)),
    height: Math.max(
      DEFAULT_POPUP_CONFIG.minHeight,
      Math.min(height, DEFAULT_POPUP_CONFIG.maxHeight)
    ),
  };
}

/**
 * 从文档内容生成摘要
 * 提取文档内容的前 150 个字符作为摘要
 * @param content - 文档内容（Markdown 格式）
 * @returns 摘要文本
 */
function generateExcerpt(content: string): string {
  // 移除 Markdown 标记
  const plainText = content
    .replace(/#{1,6}\s/g, '') // 移除标题标记
    .replace(/\*\*|__/g, '') // 移除粗体标记
    .replace(/\*|_/g, '') // 移除斜体标记
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // 移除内部链接标记
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除外部链接标记
    .replace(/\n/g, ' ') // 将换行替换为空格
    .trim();

  // 截取前 150 个字符
  return plainText.length > 150 ? plainText.substring(0, 150) + '...' : plainText;
}
