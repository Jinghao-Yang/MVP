/* ================================================
   FILE: src/stores/entity-graph-store.ts
   ================================================ */
import { create } from 'zustand';
import { db } from '@/db/dexie';
import type { SemanticNode, PropertyValue } from '@/types';

export interface EntityGraphState {
  // 内存 Identity Map: 保证全站运行只有一个对应 ID 的响应式引用
  nodesMap: Map<string, SemanticNode>;

  // 建立或同步内存快照
  registerNodes: (nodes: SemanticNode[]) => void;
  // 局部细粒度修改元数据属性，瞬间激发订阅视图
  patchNodeProperties: (nodeId: string, updates: Record<string, PropertyValue>) => Promise<void>;
  // 清洗内存
  clearGraph: () => void;
}

export const useEntityGraphStore = create<EntityGraphState>()((set, get) => ({
  nodesMap: new Map<string, SemanticNode>(),

  registerNodes: (nodes) => {
    set((state) => {
      const nextMap = new Map(state.nodesMap);
      nodes.forEach((n) => {
        nextMap.set(n.id, n);
      });
      return { nodesMap: nextMap };
    });
  },

  patchNodeProperties: async (nodeId, updates) => {
    const node = get().nodesMap.get(nodeId);
    if (!node) return;

    const nextProperties = { ...node.properties, ...updates };
    const nextNode: SemanticNode = { ...node, properties: nextProperties };

    // 1. 响应式激发 UI 渲染
    set((state) => {
      const nextMap = new Map(state.nodesMap);
      nextMap.set(nodeId, nextNode);
      return { nodesMap: nextMap };
    });

    // 2. 悄无声息地写盘进行持久化，绝不在输入阶段阻塞
    await db.semanticNodes.update(nodeId, { properties: nextProperties });
  },

  clearGraph: () => set({ nodesMap: new Map() }),
}));
