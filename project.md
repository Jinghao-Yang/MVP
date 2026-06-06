以下是从**架构、性能、用户体验、代码质量、可维护性**等维度提出的具体优化建议。

***

## 一、架构与数据层

### 1. 重复状态与数据同步风险

- **问题**：`ui-store` 和 `editor-store` 同时持有 `documentText`；`EditorPage` 使用 `ui-store` 的文本，但 `EditorRightPane` 维护独立的 `localContent` 和 `originalContentRef`，容易导致不同步。
- **建议**：统一文档编辑状态，将当前编辑文档内容、脏标记等集中到 `editor-store` 中。`ui-store` 仅保留 UI 状态（如侧边栏、禅模式），剥离数据状态。

### 2. 数据库初始化逻辑冗余

- **问题**：`dexie.ts` 中既定义了 `db.on('populate')` 又提供了 `seedDatabase()` 函数，且 `useWorkspaceInit` 又单独创建 `'main-editor-doc'`，可能导致重复插入或数据不一致。
- **建议**：只保留一种初始化方式（推荐显式调用 `seedDatabase()`），并将 `'main-editor-doc'` 也纳入种子数据中统一管理，避免分散。

### 3. 弹窗状态存储分裂

- **问题**：弹窗的 `isPinned`/`isMinimized` 存储在 localStorage，而位置/尺寸存储在 IndexedDB，且 `useWorkspaceInit` 手动解析 localStorage 恢复弹窗，容易与 `zustand/persist` 的序列化格式脱节。
- **建议**：统一使用 IndexedDB 存储所有弹窗持久化数据（包括是否固定/最小化），或者完全依赖 `zustand/persist` 的自动恢复（移除手动解析逻辑），避免双写不一致。

### 4. 双向链接正则解析局限性

- **问题**：`parseMarkdownLinks` 使用简单正则 `/\[([^\]]+)\]\(([^)]+)\)/`，无法处理嵌套括号、转义字符或图片链接。
- **建议**：使用成熟的 Markdown 解析器（如 `marked`、`remark`）提取链接，或至少增强正则以支持常见边界情况。

***

## 二、性能优化

### 1. 弹窗拖拽性能

- **问题**：`handlePositionChange` 每次拖拽移动都调用 `db.popoverStates.put` 写入 IndexedDB，虽然 `PopupManager` 做了 16ms 节流，但写入频繁仍可能产生卡顿。
- **建议**：只在拖拽结束时（`onDragEnd`）保存位置，拖拽过程中仅更新内存状态，结束时统一持久化。

### 2. 看板数据渲染优化

- **问题**：`KanbanBoard` 直接使用 `useLiveQuery` 订阅整个 `kanbanCards` 表，每次卡片列变动会触发全量重绘。
- **建议**：对 `kanbanCards` 按列拆分订阅，或使用虚拟滚动（已使用 `@tanstack/react-virtual` 但只在 `DatabaseView` 中，看板未使用）。当卡片数量超过 100+ 时，建议引入。

### 3. 编辑器文档大小限制

- **问题**：虽有 `MAX_DOCUMENT_SIZE = 100000` 检查，但用户仍可能尝试编辑超长文档，导致界面卡顿。
- **建议**：在编辑器上方显示实时字数/大小指示器，并提供导出或分拆文档的建议。同时可将大文档以只读模式打开，禁止编辑。

***

## 三、用户体验与交互

### 1. Zen 模式下快捷捕获的焦点问题

- **问题**：`Cmd+I` 全局快捷键会尝试聚焦 `.quick-capture input`，但当 Zen 模式激活时，该输入框被隐藏（`collapsed` 类），焦点落空，用户体验困惑。
- **建议**：Zen 模式下禁用该快捷键，或显示临时 Toast 提示“Zen 模式下无法快速捕获”。

### 2. 悬停预览延迟

- **问题**：`WikiHoverPreview` 中 `hover.delay = { open: 180 }` 可能感觉响应偏慢。
- **建议**：可调整为 120ms，同时利用 `safePolygon` 的 `buffer` 参数避免误触发，兼顾灵敏与稳定。

### 3. 移动端拖拽体验

- **问题**：`PopoverCard` 在小屏幕下禁用拖拽，改为居中弹窗，但“拖拽手柄”区域仍显示 `cursor-move`，且无触摸关闭方式。
- **建议**：在小屏幕上提供明确的“关闭”大按钮，或使用底部动作表单代替悬浮卡片。

### 4. 命令面板未实现

- **问题**：`CommandPalette` 仅有界面模拟，无实际命令执行。
- **建议**：建议集成 `cmdk` 库的完整功能，支持文档跳转、创建新文档、切换视图等。

***

## 四、代码质量与可维护性

### 1. TypeScript 类型缺失文件

- **问题**：`src/types/document.ts`、`src/hooks/useDocument.ts`、`src/utils/timer-manager.ts` 在列表中显示为 `[Binary file]`，内容未展示，可能是编码或格式问题。
- **建议**：检查这些文件是否正常提交，确保类型定义完整。例如 `DocumentEntity` 应在 `document.ts` 中定义，目前从 `index.ts` 导出看应该存在，但缺失文件可能导致构建失败。

### 2. `any` 类型使用

- **问题**：`eslint` 配置中 `'@typescript-eslint/no-explicit-any': 'error'`，但部分代码（如 `ErrorBoundary.tsx` 的 `errorInfo` 参数使用了 `any`，`toast` 回调参数隐式 `any`）。
- **建议**：修复现有 `any`，或为特定位置添加 `eslint-disable-next-line` 并注释原因。

### 3. 错误处理统一性

- **问题**：部分异步操作（如 `saveContent` 中的 `documentService.updateDocumentContent`）仅 `console.error`，未向用户提示；而有些地方通过 `setStatus` 显示错误。
- **建议**：封装统一错误通知函数（如 `showErrorToast`），在所有 catch 块中调用，确保用户感知错误。

### 4. 组件拆分粒度

- **问题**：`EditorRightPane.tsx` 超过 400 行，包含了历史导航 reducer、编辑器、反向链接、保存状态等多个职责。
- **建议**：拆分为 `DocumentHistoryNav.tsx`、`SplitEditor.tsx`、`BacklinksPanel.tsx` 等子组件，提高可读性和可测试性。

***

## 五、安全性与可访问性

### 1. XSS 风险

- **问题**：弹窗中显示的 `excerpt` 来自文档内容（`doc.content.substring(...)`），如果文档包含 `<script>` 或恶意 HTML，直接插入 JSX 不会执行，但若未来添加 `dangerouslySetInnerHTML` 则风险较大。
- **建议**：所有显示用户内容的地方都使用纯文本（`{excerpt}` 天然转义），若需支持富文本预览，使用 `DOMPurify` 清洗。

### 2. 键盘可访问性

- **问题**：多处按钮缺少 `aria-label`，侧边栏拖拽手柄、弹窗关闭按钮等对屏幕阅读器不友好。
- **建议**：添加有意义的 `aria-label`，并确保可通过键盘（Tab、Enter）完成核心操作（打开/关闭弹窗、拖拽卡片等）。

***

## 六、依赖与构建

### 1. pnpm 锁定文件过大

- **问题**：`pnpm-lock.yaml` 接近 300KB，包含了许多不必要或开发重复的包（如 `esbuild` 多平台二进制）。
- **建议**：运行 `pnpm dedupe` 减少重复，且确保生产构建时使用 `--prod` 排除 `devDependencies`。

