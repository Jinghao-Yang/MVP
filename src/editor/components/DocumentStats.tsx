/* ================================================
   FILE: src/editor/components/DocumentStats.tsx
   ================================================ */
import { useMemo } from 'react';
import { FileText, AlertTriangle, Download, Split, Lock } from 'lucide-react';

interface DocumentStatsProps {
  content: string;
  maxSize: number;
  warningThreshold: number;
  onExport?: () => void;
  onSplit?: () => void;
  onToggleReadOnly?: () => void;
  isReadOnly?: boolean;
}

interface DocumentStatistics {
  characters: number;
  words: number;
  lines: number;
  bytes: number;
  percentage: number;
  isWarning: boolean;
  isExceeded: boolean;
}

export function DocumentStats({
  content,
  maxSize,
  warningThreshold,
  onExport,
  onSplit,
  onToggleReadOnly,
  isReadOnly = false,
}: DocumentStatsProps) {
  const stats: DocumentStatistics = useMemo(() => {
    const characters = content.length;
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const lines = content.split('\n').length;
    const bytes = new Blob([content]).size;
    const percentage = (characters / maxSize) * 100;
    const isWarning = percentage >= warningThreshold * 100 && percentage < 100;
    const isExceeded = percentage >= 100;

    return {
      characters,
      words,
      lines,
      bytes,
      percentage,
      isWarning,
      isExceeded,
    };
  }, [content, maxSize, warningThreshold]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const getStatusColor = () => {
    if (stats.isExceeded) return 'text-red-600 bg-red-50 border-red-200';
    if (stats.isWarning) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-neutral-600 bg-neutral-50 border-neutral-200';
  };

  const getProgressColor = () => {
    if (stats.isExceeded) return 'bg-red-500';
    if (stats.isWarning) return 'bg-amber-500';
    return 'bg-bh-green';
  };

  return (
    <div className="space-y-3">
      {/* 统计信息栏 */}
      <div
        className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${getStatusColor()} transition-all duration-300`}
      >
        <div className="flex items-center gap-6">
          {/* 字符数 */}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 opacity-60" />
            <div className="flex flex-col">
              <span className="text-xs font-sys font-medium opacity-70">字符</span>
              <span className="text-sm font-mono font-semibold">
                {formatNumber(stats.characters)}
              </span>
            </div>
          </div>

          {/* 字数 */}
          <div className="flex flex-col">
            <span className="text-xs font-sys font-medium opacity-70">字数</span>
            <span className="text-sm font-mono font-semibold">{formatNumber(stats.words)}</span>
          </div>

          {/* 行数 */}
          <div className="flex flex-col">
            <span className="text-xs font-sys font-medium opacity-70">行数</span>
            <span className="text-sm font-mono font-semibold">{formatNumber(stats.lines)}</span>
          </div>

          {/* 大小 */}
          <div className="flex flex-col">
            <span className="text-xs font-sys font-medium opacity-70">大小</span>
            <span className="text-sm font-mono font-semibold">{formatBytes(stats.bytes)}</span>
          </div>
        </div>

        {/* 进度条和百分比 */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-sys font-medium opacity-70">容量使用</span>
            <span className="text-sm font-mono font-semibold">
              {Math.min(stats.percentage, 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-24 h-2 bg-white/50 rounded-full overflow-hidden border border-black/5">
            <div
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${Math.min(stats.percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 警告提示 */}
      {(stats.isWarning || stats.isExceeded) && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg border ${
            stats.isExceeded
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}
        >
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <div className="flex-1">
            <div className="font-sys font-semibold text-sm mb-2">
              {stats.isExceeded ? '文档大小已超出限制' : '文档大小接近限制'}
            </div>
            <div className="text-xs font-sys opacity-80 mb-3">
              {stats.isExceeded
                ? `当前文档大小 (${formatNumber(stats.characters)} 字符) 已超过限制 (${formatNumber(maxSize)} 字符)。建议导出或分拆文档以避免性能问题。`
                : `文档大小已使用 ${stats.percentage.toFixed(1)}%，建议考虑导出或分拆文档。`}
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2">
              {onExport && (
                <button
                  onClick={onExport}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sys font-medium bg-white border border-current/20 hover:bg-white/80 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  导出文档
                </button>
              )}
              {onSplit && (
                <button
                  onClick={onSplit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sys font-medium bg-white border border-current/20 hover:bg-white/80 transition-colors"
                >
                  <Split className="w-3.5 h-3.5" />
                  分拆文档
                </button>
              )}
              {onToggleReadOnly && (
                <button
                  onClick={onToggleReadOnly}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sys font-medium border transition-colors ${
                    isReadOnly
                      ? 'bg-bh-blue/10 border-bh-blue/30 text-bh-blue hover:bg-bh-blue/20'
                      : 'bg-white border-current/20 hover:bg-white/80'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  {isReadOnly ? '退出只读模式' : '只读模式'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
