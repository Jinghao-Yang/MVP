/**
 * 编辑器相关类型定义
 * 包含编辑器页面和编辑器侧边栏 Props 类型
 */

/**
 * 编辑器页面组件 Props 类型
 */
export interface EditorPageProps {
  /** 是否处于禅模式 */
  isZenMode: boolean;
  /** 切换禅模式回调 */
  onToggleZen: () => void;
  /** 打开页面回调 */
  openPage: (page: string) => void;
}

/**
 * 编辑器侧边栏组件 Props 类型
 */
export interface EditorSidebarProps {
  /** 是否处于禅模式 */
  isZenMode: boolean;
}
