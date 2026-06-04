/* ================================================
   FILE: src/editor/EditorPage.tsx
   ================================================ */
import { memo } from 'react';
import type { EditorPageProps } from '@/types';
import { EditorContent } from './EditorContent';
import { EditorRightPane } from './components/EditorRightPane';
import { PopupManager } from './components/PopupManager';
import { MinimizedPopups } from './components/MinimizedPopups';

export function EditorPageContent({ isZenMode, onToggleZen, openPage }: EditorPageProps) {
  return (
    <div className="page-panel flex-1 flex flex-row h-full overflow-hidden relative bg-transparent">
      {/* 左栏：主创作文档编辑器 */}
      <div className="flex-1 flex flex-col h-full border-r border-neutral-200/50">
        <EditorContent isZenMode={isZenMode} onToggleZen={onToggleZen} onOpenPage={openPage} />
      </div>

      {/* 右栏：双栏联动学术对照阅读/编辑器 */}
      {!isZenMode && <EditorRightPane />}

      {/* 悬浮多级弹窗 */}
      <PopupManager />

      {/* 最小化弹窗和最近关闭弹窗列表 */}
      <MinimizedPopups />
    </div>
  );
}

export const EditorPage = memo(EditorPageContent);
