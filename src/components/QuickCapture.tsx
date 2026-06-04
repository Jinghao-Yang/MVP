import type React from 'react';

interface QuickCaptureProps {
  isZenMode: boolean;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function QuickCapture({ isZenMode, value, onChange, onSubmit }: QuickCaptureProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      if (value.trim()) {
        onSubmit();
      }
    }
  };

  return (
    <div className={`quick-capture glass-panel ${isZenMode ? 'collapsed' : ''}`}>
      <span className="font-mono text-xs opacity-50 shrink-0 select-none mr-1">&gt;</span>
      <input 
        type="text" 
        placeholder="Capture a fleeting thought..." 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <span className="meta opacity-40">⌘↵</span>
    </div>
  );
}