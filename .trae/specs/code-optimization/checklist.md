# 代码逻辑与性能优化 - 验证检查清单

- [x] 检查 useAppState 中 useMemo 是否正确应用
- [x] 检查 usePopover 中 Map 是否替代对象存储定时器
- [x] 检查 PopoverCard 中状态是否合并为单个 ref 对象
- [x] 检查组件是否正确使用 React.memo 包装
- [x] 验证构建是否成功
- [x] 验证所有交互功能保持不变
- [x] 检查是否存在未清理的定时器