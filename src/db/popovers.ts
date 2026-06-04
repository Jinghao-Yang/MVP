/**
 * 弹窗状态持久化操作
 * 封装弹窗位置和尺寸的存储与恢复
 */

import { db } from './dexie';
import type { PopoverStateEntity } from '@/types';

/**
 * 获取弹窗的保存状态
 * @param id - 弹窗 ID（通常与 wikiId 相同）
 * @returns 弹窗状态实体或 undefined
 */
export async function getPopoverState(id: string): Promise<PopoverStateEntity | undefined> {
  return await db.popoverStates.get(id);
}

/**
 * 保存弹窗状态
 * @param state - 弹窗状态实体
 */
export async function savePopoverState(state: PopoverStateEntity): Promise<void> {
  await db.popoverStates.put(state);
}

/**
 * 更新弹窗位置
 * @param id - 弹窗 ID
 * @param x - X 坐标
 * @param y - Y 坐标
 */
export async function updatePopoverPosition(id: string, x: number, y: number): Promise<void> {
  await db.popoverStates.update(id, { x, y }).catch(async () => {
    // 如果记录不存在，创建新记录
    await db.popoverStates.put({ id, x, y, width: 500, height: 320 });
  });
}

/**
 * 更新弹窗尺寸
 * @param id - 弹窗 ID
 * @param width - 宽度
 * @param height - 高度
 */
export async function updatePopoverSize(id: string, width: number, height: number): Promise<void> {
  await db.popoverStates.update(id, { width, height }).catch(async () => {
    // 如果记录不存在，创建新记录
    await db.popoverStates.put({ id, x: 100, y: 100, width, height });
  });
}

/**
 * 更新弹窗位置和尺寸
 * @param id - 弹窗 ID
 * @param x - X 坐标
 * @param y - Y 坐标
 * @param width - 宽度
 * @param height - 高度
 */
export async function updatePopoverPositionAndSize(
  id: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  await db.popoverStates.put({ id, x, y, width, height });
}

/**
 * 删除弹窗状态
 * @param id - 弹窗 ID
 */
export async function deletePopoverState(id: string): Promise<void> {
  await db.popoverStates.delete(id);
}

/**
 * 获取所有弹窗状态
 * @returns 所有弹窗状态实体数组
 */
export async function getAllPopoverStates(): Promise<PopoverStateEntity[]> {
  return await db.popoverStates.toArray();
}

/**
 * 清空所有弹窗状态
 */
export async function clearAllPopoverStates(): Promise<void> {
  await db.popoverStates.clear();
}
