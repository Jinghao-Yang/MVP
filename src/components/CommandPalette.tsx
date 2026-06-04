import { memo } from 'react';
import { useOverlay } from '@/hooks/useOverlay';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPage: (page: string) => void;
}

function CommandPaletteComponent({ isOpen, onClose, onOpenPage }: CommandPaletteProps) {
  const { overlayProps } = useOverlay({ isOpen, onClose });

  const handleCommand = (page: string) => {
    onOpenPage(page);
    onClose();
  };

  return (
    <>
      <div {...overlayProps}></div>
      <div
        className={`command-palette fixed top-[20%] left-1/2 -translate-x-1/2 glass-panel-deep w-[600px] max-w-[90vw] p-2 z-[100] transition-all duration-300 ${isOpen ? 'opacity-100 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-95'}`}
      >
        <input
          type="text"
          placeholder="Command..."
          className="w-full bg-transparent border-b border-white/30 text-lg p-4 outline-none font-sys text-black placeholder-black/30"
          autoFocus={isOpen}
        />
        <div className="py-2">
          <div
            className="flex items-center gap-3 p-3 hover:bg-white/40 cursor-pointer transition-colors"
            onClick={() => handleCommand('editor')}
          >
            <span className="text-[var(--bh-red)] font-sys text-xs font-bold font-mono">¶</span>
            <span className="text-sm font-medium">Focus Editor</span>
          </div>
          <div
            className="flex items-center gap-3 p-3 hover:bg-white/40 cursor-pointer transition-colors"
            onClick={() => handleCommand('project')}
          >
            <span className="text-[var(--bh-blue)] font-sys text-xs font-bold font-mono">#</span>
            <span className="text-sm font-medium">Project Hub</span>
          </div>
        </div>
      </div>
    </>
  );
}

export const CommandPalette = memo(CommandPaletteComponent);
