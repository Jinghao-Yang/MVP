/* ================================================
   FILE: src/editor/components/DocumentSplitter.tsx
   ================================================ */
import { useState, useMemo } from 'react';
import { X, FileText, Check, AlertCircle } from 'lucide-react';

interface SplitSection {
  id: string;
  title: string;
  content: string;
  startLine: number;
  endLine: number;
  characterCount: number;
}

interface DocumentSplitterProps {
  content: string;
  onSplit: (sections: SplitSection[]) => void;
  onClose: () => void;
  maxSize: number;
}

export function DocumentSplitter({ content, onSplit, onClose, maxSize }: DocumentSplitterProps) {
  const [selectedSections, setSelectedSections] = useState<Set<string>>(new Set());
  const [splitMode, setSplitMode] = useState<'heading' | 'size' | 'custom'>('heading');

  // 按标题分拆
  const headingSections = useMemo(() => {
    const lines = content.split('\n');
    const sections: SplitSection[] = [];
    let currentSection: SplitSection | null = null;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

      if (headingMatch) {
        if (currentSection) {
          currentSection.endLine = index - 1;
          currentSection.characterCount = currentSection.content.length;
          sections.push(currentSection);
        }

        currentSection = {
          id: `section-${index}`,
          title: headingMatch[2],
          content: line,
          startLine: index,
          endLine: index,
          characterCount: 0,
        };
      } else if (currentSection) {
        currentSection.content += '\n' + line;
      }
    }

    if (currentSection) {
      currentSection.endLine = lines.length - 1;
      currentSection.characterCount = currentSection.content.length;
      sections.push(currentSection);
    }

    return sections;
  }, [content]);

  // 按大小分拆
  const sizeSections = useMemo(() => {
    const sections: SplitSection[] = [];
    const lines = content.split('\n');
    let currentContent = '';
    let startLine = 0;

    lines.forEach((line, index) => {
      if (currentContent.length + line.length > maxSize && currentContent.length > 0) {
        sections.push({
          id: `size-section-${sections.length}`,
          title: `Part ${sections.length + 1}`,
          content: currentContent.trim(),
          startLine,
          endLine: index - 1,
          characterCount: currentContent.length,
        });
        currentContent = line;
        startLine = index;
      } else {
        currentContent += (currentContent ? '\n' : '') + line;
      }
    });

    if (currentContent.trim()) {
      sections.push({
        id: `size-section-${sections.length}`,
        title: `Part ${sections.length + 1}`,
        content: currentContent.trim(),
        startLine,
        endLine: lines.length - 1,
        characterCount: currentContent.length,
      });
    }

    return sections;
  }, [content, maxSize]);

  const currentSections = splitMode === 'heading' ? headingSections : sizeSections;

  const toggleSection = (id: string) => {
    const newSelected = new Set(selectedSections);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSections(newSelected);
  };

  const selectAll = () => {
    if (selectedSections.size === currentSections.length) {
      setSelectedSections(new Set());
    } else {
      setSelectedSections(new Set(currentSections.map((s) => s.id)));
    }
  };

  const handleSplit = () => {
    const sectionsToSplit = currentSections.filter((s) => selectedSections.has(s.id));
    if (sectionsToSplit.length > 0) {
      onSplit(sectionsToSplit);
    }
  };

  const totalCharacters = content.length;
  const selectedCharacters = currentSections
    .filter((s) => selectedSections.has(s.id))
    .reduce((sum, s) => sum + s.characterCount, 0);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
          <div>
            <h2 className="text-lg font-sys font-semibold text-black">分拆文档</h2>
            <p className="text-sm font-sys text-neutral-600 mt-0.5">
              选择分拆方式，然后选择要导出的部分
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            aria-label="关闭分拆文档对话框"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Split Mode Selector */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-sys font-medium text-neutral-700">分拆方式：</span>
            <div className="flex gap-2">
              {[
                { mode: 'heading' as const, label: '按标题' },
                { mode: 'size' as const, label: '按大小' },
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    setSplitMode(mode);
                    setSelectedSections(new Set());
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-sys font-medium transition-colors ${
                    splitMode === mode
                      ? 'bg-bh-red text-white'
                      : 'bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                  aria-label={`按${label}分拆`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {splitMode === 'heading' && (
            <div className="mt-3 flex items-start gap-2 text-xs font-sys text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>检测到 {headingSections.length} 个标题段落。选择要分拆的部分。</span>
            </div>
          )}
          {splitMode === 'size' && (
            <div className="mt-3 flex items-start gap-2 text-xs font-sys text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                文档将按 {Math.floor(maxSize / 1000)}K 字符分拆为 {sizeSections.length} 个部分。
              </span>
            </div>
          )}
        </div>

        {/* Sections List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-sm font-sys font-medium text-bh-red hover:text-bh-red/80 transition-colors"
                aria-label={
                  selectedSections.size === currentSections.length ? '取消全选' : '全选所有段落'
                }
              >
                {selectedSections.size === currentSections.length ? '取消全选' : '全选'}
              </button>
              <span className="text-xs font-sys text-neutral-500">
                ({selectedSections.size}/{currentSections.length} 已选)
              </span>
            </div>
            <div className="text-xs font-mono text-neutral-600">
              已选: {selectedCharacters.toLocaleString()} / {totalCharacters.toLocaleString()} 字符
            </div>
          </div>

          <div className="space-y-2">
            {currentSections.map((section) => {
              const isSelected = selectedSections.has(section.id);
              const isLarge = section.characterCount > maxSize;

              return (
                <button
                  key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    isSelected
                      ? 'border-bh-red bg-bh-red/5'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                          isSelected ? 'bg-bh-red border-bh-red' : 'border-neutral-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-neutral-500 shrink-0" />
                          <h3 className="font-sys font-semibold text-sm text-black truncate">
                            {section.title}
                          </h3>
                          {isLarge && (
                            <span className="text-xs font-sys px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                              超大
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs font-mono text-neutral-500">
                          行 {section.startLine + 1}-{section.endLine + 1} •{' '}
                          {section.characterCount.toLocaleString()} 字符
                        </div>
                        <div className="mt-2 text-xs font-sys text-neutral-600 line-clamp-2">
                          {section.content.substring(0, 100)}...
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200 bg-neutral-50">
          <div className="text-xs font-sys text-neutral-600">
            将创建 {selectedSections.size} 个新文档
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-sys font-medium text-neutral-700 hover:bg-neutral-200 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleSplit}
              disabled={selectedSections.size === 0}
              className={`px-6 py-2 rounded-lg text-sm font-sys font-medium transition-colors ${
                selectedSections.size === 0
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                  : 'bg-bh-red text-white hover:bg-bh-red/90'
              }`}
            >
              分拆并导出
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
