# 代码逻辑与性能优化 - 产品需求文档

## Overview
- **Summary**: 在不改变UI样式和效果的前提下，对现有代码进行逻辑优化和性能提升
- **Purpose**: 提升应用响应速度，减少不必要的重新渲染，优化内存使用
- **Target Users**: 所有使用该应用的用户，特别是频繁使用弹出卡片功能的用户

## Goals
- 优化 hooks 中的重复计算逻辑
- 减少不必要的组件重新渲染
- 优化定时器管理，避免内存泄漏
- 简化复杂的状态管理逻辑

## Non-Goals (Out of Scope)
- 不改变任何UI样式或交互效果
- 不添加新功能
- 不修改数据结构

## Background & Context
当前代码存在以下性能问题：
1. 多个 useRef 用于跟踪拖拽/调整大小状态
2. 定时器管理不够清晰，存在潜在内存泄漏风险
3. 缺少 memo 优化导致不必要的重新渲染
4. 重复的 DOM 操作代码

## Functional Requirements
- **FR-1**: 使用 useMemo 优化重复计算的值
- **FR-2**: 使用 React.memo 减少组件不必要的重新渲染
- **FR-3**: 使用 Map 替代对象存储定时器，提高管理效率
- **FR-4**: 简化 PopoverCard 中的状态跟踪逻辑

## Non-Functional Requirements
- **NFR-1**: 保持所有原有功能和交互不变
- **NFR-2**: 优化后代码应易于维护和理解
- **NFR-3**: 不应引入任何新的依赖

## Constraints
- **Technical**: React 18+, TypeScript
- **Dependencies**: 只能使用项目中已有的依赖

## Assumptions
- 所有组件的 props 类型定义正确
- 现有测试覆盖了主要功能

## Acceptance Criteria

### AC-1: useAppState 优化
- **Given**: `isSidebarActiveCollapsed` 和 `isZenActive` 在每次渲染时被计算
- **When**: 使用 useMemo 包装这些计算
- **Then**: 只有依赖变化时才重新计算
- **Verification**: `programmatic`

### AC-2: 组件 memo 优化
- **Given**: Sidebar, EditorPage, PopoverCard 等组件
- **When**: 使用 React.memo 包装组件
- **Then**: 只有 props 变化时才重新渲染
- **Verification**: `programmatic`

### AC-3: 定时器管理优化
- **Given**: hoverTimers 使用对象存储
- **When**: 改用 Map 存储定时器
- **Then**: 定时器管理更清晰，易于清理
- **Verification**: `human-judgment`

### AC-4: PopoverCard 状态跟踪简化
- **Given**: PopoverCard 使用多个 useRef 跟踪状态
- **When**: 合并相关状态为单个 ref 对象
- **Then**: 代码更简洁，易于维护
- **Verification**: `human-judgment`

## Open Questions
- [ ] 是否需要添加性能监控以验证优化效果？