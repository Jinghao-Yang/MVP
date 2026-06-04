# 代码逻辑与性能优化 - 实现计划

## [ ] Task 1: 优化 useAppState hook
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 使用 useMemo 包装 `isSidebarActiveCollapsed` 和 `isZenActive` 的计算
  - 减少每次渲染时的重复计算
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `human-judgment` TR-1.1: 确认 useMemo 正确应用，依赖数组包含所有必要变量
  - `human-judgment` TR-1.2: 检查是否移除了不必要的重复计算

## [ ] Task 2: 优化 usePopover hook
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 使用 Map 替代对象存储定时器
  - 简化定时器管理逻辑
  - 确保定时器正确清理
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `human-judgment` TR-2.1: 确认使用 Map 替代对象存储定时器
  - `human-judgment` TR-2.2: 检查定时器清理逻辑是否完整

## [ ] Task 3: 简化 PopoverCard 组件状态跟踪
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 合并多个 useRef 为单个对象
  - 减少重复的 DOM 操作代码
  - 简化拖拽和调整大小的状态管理
- **Acceptance Criteria Addressed**: AC-4
- **Test Requirements**:
  - `human-judgment` TR-3.1: 确认相关状态合并为单个 ref 对象
  - `human-judgment` TR-3.2: 检查代码复杂度是否降低

## [ ] Task 4: 添加 React.memo 优化组件渲染
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 为 Sidebar、EditorPage、PopoverCard、CommandPalette 添加 React.memo
  - 确保 props 比较逻辑正确
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `human-judgment` TR-4.1: 确认组件正确使用 React.memo 包装
  - `human-judgment` TR-4.2: 验证组件只在 props 变化时重新渲染

## [ ] Task 5: 验证所有优化效果
- **Priority**: P2
- **Depends On**: Task 1, Task 2, Task 3, Task 4
- **Description**: 
  - 运行构建确保没有错误
  - 测试所有交互功能保持不变
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3, AC-4
- **Test Requirements**:
  - `programmatic` TR-5.1: 构建成功无错误
  - `human-judgment` TR-5.2: 所有交互功能正常工作