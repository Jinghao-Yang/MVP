/**
 * useKanbanCards Hook
 * 封装 Kanban 卡片数据访问，提供卡片加载、更新、快速捕获等功能
 */
import { useKanbanStore } from '@/stores/kanban-store';
import type { KanbanCardEntity } from '@/types';

/**
 * Kanban 卡片 Hook 返回值
 */
export interface UseKanbanCardsReturn {
  /** Kanban 卡片列表 */
  kanbanCards: KanbanCardEntity[];
  /** 快速捕获文本 */
  quickCaptureText: string;

  /** 加载 Kanban 卡片 */
  loadKanbanCards: () => Promise<void>;
  /** 更新卡片所属列 */
  updateCardColumn: (cardId: string, newColumnId: string) => Promise<void>;
  /** 设置快速捕获文本 */
  setQuickCaptureText: (text: string) => void;
  /** 提交快速捕获 */
  quickCaptureSubmit: (setStatus: (msg: string) => void) => Promise<void>;
}

/**
 * Kanban 卡片数据访问 Hook
 * 封装 Kanban 卡片的加载、更新、快速捕获等操作
 * 基于 Kanban Store 提供便捷的使用方式
 */
export function useKanbanCards(): UseKanbanCardsReturn {
  // 从 Kanban Store 获取状态和方法
  const kanbanCards = useKanbanStore((state) => state.kanbanCards);
  const quickCaptureText = useKanbanStore((state) => state.quickCaptureText);

  const loadKanbanCards = useKanbanStore((state) => state.loadKanbanCards);
  const updateCardColumn = useKanbanStore((state) => state.updateCardColumn);
  const setQuickCaptureText = useKanbanStore((state) => state.setQuickCaptureText);
  const quickCaptureSubmit = useKanbanStore((state) => state.quickCaptureSubmit);

  return {
    // 状态
    kanbanCards,
    quickCaptureText,

    // 方法
    loadKanbanCards,
    updateCardColumn,
    setQuickCaptureText,
    quickCaptureSubmit,
  };
}
