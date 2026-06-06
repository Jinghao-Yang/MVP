/**
 * Stores 统一导出
 * 集中管理所有 Zustand Store 的导出，提供统一的导入路径
 */

// ============================================================================
// App Store - 整合 UI 及设置状态
// ============================================================================
export {
  useAppStore,
  useUiStore,
  useSettingsStore,
  type AppState,
  type UiState,
  type SettingsState,
} from './app-store';

// ============================================================================
// Editor Store - 管理编辑器与窗口状态
// ============================================================================
export {
  useEditorStore,
  usePopupStore,
  type EditorState,
  type PopupState,
  type RecentlyClosedPopupFromPopupStore,
} from './editor-store';

// ============================================================================
// Kanban Store - 管理 Kanban 看板状态
// ============================================================================
export { useKanbanStore, type KanbanState } from './kanban-store';

// ============================================================================
// Timer Manager - 定时器管理
// ============================================================================
export { timerManager } from '@/utils/timer-manager';
