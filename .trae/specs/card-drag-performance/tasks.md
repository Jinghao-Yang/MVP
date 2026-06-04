# 卡片拖拽性能优化 - 实现计划

## [ ] 任务 1: 优化 body 背景样式
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 移除或优化 body 上的 background-attachment: fixed 样式
  - 优化或禁用 ambient-breath 动画
- **Acceptance Criteria Addressed**: [AC-1]
- **Test Requirements**:
  - human-judgment: 检查背景视觉效果是否可接受，拖拽时是否更流畅
- **Notes**: 修改 src/index.css 中的 body 样式

## [ ] 任务 2: 优化拖拽时的 glass-panel 样式
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 优化 .glass-panel.dragging-active 样式
  - 在拖拽时完全禁用阴影，简化背景
- **Acceptance Criteria Addressed**: [AC-3]
- **Test Requirements**:
  - human-judgment: 检查拖拽状态下的视觉效果是否可接受
- **Notes**: 修改 src/index.css 中的 .glass-panel.dragging-active 样式

## [ ] 任务 3: 在拖拽时优化其他 glass-panel 元素
- **Priority**: P1
- **Depends On**: None
- **Description**: 
  - 在 EditorPage 中添加拖拽状态管理
  - 当任意卡片正在拖拽时，临时优化其他 glass-panel 元素的 backdrop-filter
- **Acceptance Criteria Addressed**: [AC-2]
- **Test Requirements**:
  - human-judgment: 检查多个卡片时的拖拽性能
- **Notes**: 修改 src/components/EditorPage.tsx 和 src/components/PopoverCard.tsx

## [ ] 任务 4: 验证优化效果
- **Priority**: P0
- **Depends On**: [任务 1, 任务 2, 任务 3]
- **Description**: 
  - 启动开发服务器并测试拖拽效果
  - 检查是否有明显的性能改善
- **Acceptance Criteria Addressed**: [AC-1, AC-2, AC-3]
- **Test Requirements**:
  - human-judgment: 通过视觉体验和 Chrome Performance 面板验证性能改善
- **Notes**: 确保所有功能正常工作
