/**
 * Stores 统一导出
 * 集中管理所有 Zustand Store 的导出，提供统一的导入路径
 */

// ============================================================================
// UI Store - 管理 UI 状态（侧边栏、禅模式、命令面板等）
// ============================================================================
export {
  useUiStore,
  useAppStore, // @deprecated 使用 useUiStore 代替
  type UiState,
  type AppStore, // @deprecated 使用 UiState 代替
  type RecentlyClosedPopup,
  type PinnedPopoverMetadata,
} from './ui-store';

// ============================================================================
// Popup Store - 管理弹窗状态
// ============================================================================
export {
  usePopupStore,
  useTimerManager,
  type PopupState,
  type RecentlyClosedPopup as RecentlyClosedPopupFromPopupStore,
} from './popup-store';

// ============================================================================
// Editor Store - 管理编辑器状态
// ============================================================================
export { useEditorStore, type EditorState } from './editor-store';

// ============================================================================
// Kanban Store - 管理 Kanban 看板状态
// ============================================================================
export { useKanbanStore, type KanbanState } from './kanban-store';
