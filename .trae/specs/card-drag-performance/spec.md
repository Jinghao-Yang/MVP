# 卡片拖拽性能优化 - 产品需求文档

## Overview
- **Summary**: 优化 PopoverCard 组件的拖拽性能，解决拖拽时的高延迟问题
- **Purpose**: 提升用户拖拽卡片时的流畅度和交互体验
- **Target Users**: 所有使用编辑器页面和 PopoverCard 功能的用户

## Goals
- 消除或显著降低拖拽延迟
- 保持原有功能不变
- 保持视觉设计基本一致

## Non-Goals (Out of Scope)
- 不重构 PopoverCard 的核心拖拽逻辑
- 不改变 PopoverCard 的功能特性

## Background & Context
根据 test/card.md 的分析，当前 PopoverCard 的拖拽逻辑已经进行了多项优化（不使用 React state、使用 translate3d、直接操作 DOM 等，但仍存在性能问题。可能的瓶颈包括：
1. 背景的 `background-attachment: fixed` 和动画
2. 多个 glass-panel 的 backdrop-filter
3. 可能的阴影渲染性能问题

## Functional Requirements
- **FR-1**: 保持 PopoverCard 所有原有功能正常工作
- **FR-2**: 在拖拽过程中提供流畅的视觉体验

## Non-Functional Requirements
- **NFR-1**: 拖拽性能应明显改善（通过视觉体验或 Performance 面板检测
- **NFR-2**: 优化不应明显影响其他功能的性能

## Constraints
- **Technical**: 仅修改 CSS 和必要的小部分组件代码
- **Dependencies**: 不引入新的第三方库

## Assumptions
- 原有的 PopoverCard 逻辑架构是正确的
- 主要性能瓶颈在渲染层面而非逻辑层面

## Acceptance Criteria

### AC-1: 背景优化
- **Given**: 用户打开编辑器页面
- **When**: 用户查看页面和进行拖拽
- **Then**: 背景的动态效果在拖拽时应不造成性能问题
- **Verification**: human-judgment
- **Notes**: 优化背景的 background-attachment: fixed 相关样式

### AC-2: Glass Panel 优化
- **Given**: 页面上有多个 PopoverCard 或 glass-panel 元素
- **When**: 用户正在拖拽其中一个卡片
- **Then**: 不活跃的 glass-panel 元素应降低性能消耗
- **Verification**: human-judgment
- **Notes**: 在拖拽时临时优化 glass-panel 的 backdrop-filter 等效果

### AC-3: 拖拽状态样式优化
- **Given**: 用户正在拖拽卡片
- **When**: 卡片处于 dragging-active 状态
- **Then**: 该卡片的阴影等消耗性能的样式应被优化
- **Verification**: human-judgment
- **Notes**: 优化 dragging-active 状态的样式，禁用不必要的阴影等效果

## Open Questions
- 是否需要完全禁用背景动画？
- 是否需要针对不同浏览器做适配？
