// src/editor/extensions/incremental-parse.ts
import type { Extension } from '@codemirror/state';
import { StateField } from '@codemirror/state';

/**
 * 增量解析扩展（仅负责收集变更信息，并调用回调）
 * @param onParse 回调函数，接收变更详情，由外层组件处理解析逻辑
 * @returns Extension
 */
export function incrementalParseExtension(
  onParse: (update: {
    from: number;
    to: number;
    inserted: string;
    removed: string;
    insertedLen: number;
    removedLen: number;
  }) => void
): Extension {
  // 使用 StateField 来监听事务并派发 Effect
  const field = StateField.define<boolean>({
    create() {
      return false;
    },
    update(value, tr) {
      // 如果事务中包含文档变更，则提取变更信息并调用回调
      if (tr.docChanged) {
        const changes = tr.changes;
        // 遍历所有变更（通常一次事务可能包含多个变更，但 CodeMirror 会合并相邻变更）
        changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
          const insertedText = inserted.sliceString(0, inserted.length);
          // 利用 tr.startState.doc.slice 获取被删除的文本
          const removedText = tr.startState.doc.slice(fromA, toA).toString();
          onParse({
            from: fromA,
            to: toA,
            inserted: insertedText,
            removed: removedText,
            insertedLen: inserted.length,
            removedLen: toA - fromA,
          });
        });
      }
      return value;
    },
  });

  return [field];
}
