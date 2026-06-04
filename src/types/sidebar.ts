/**
 * 侧边栏相关类型定义
 * 包含侧边栏组件 Props 类型
 */

/**
 * 侧边栏组件 Props 类型
 */
export interface SidebarProps {
  /** 是否折叠 */
  isCollapsed: boolean;
  /** 打开页面回调 */
  openPage: (page: string) => void;
  /** 打开命令面板回调 */
  openCommandPalette: () => void;
  /** 设置状态回调 */
  setStatus: (status: string) => void;
  /** 鼠标进入回调 */
  onMouseEnter: () => void;
  /** 鼠标离开回调 */
  onMouseLeave: () => void;
}
