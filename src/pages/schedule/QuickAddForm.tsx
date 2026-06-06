/* ================================================
   FILE: src/pages/schedule/QuickAddForm.tsx
   ================================================ */

interface QuickAddFormProps {
  quickAddText: string;
  onTextChange: (text: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

function QuickAddFormComponent({ quickAddText, onTextChange, onSubmit }: QuickAddFormProps) {
  return (
    <div className="glass-panel p-5 border border-neutral-200 bg-white">
      <h4 className="font-mono text-[10px] uppercase tracking-wide font-extrabold text-neutral-500 mb-3 block">
        Quick Event Adder
      </h4>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="e.g. Proof Heine-Borel theorem @2026-06-12 !High"
          value={quickAddText}
          onChange={(e) => onTextChange(e.target.value)}
          className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-400 transition-colors rounded-none"
        />
        <p className="text-[10px] text-neutral-400 leading-normal font-mono">
          Support natural syntax patterns like{' '}
          <strong className="text-neutral-500">@YYYY-MM-DD</strong> and{' '}
          <strong className="text-neutral-500">!High/!Low</strong> parameters.
        </p>
        <button
          type="submit"
          className="w-full h-8 flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer border-none transition-colors"
        >
          <span>Add Task Event</span>
        </button>
      </form>
    </div>
  );
}

export const QuickAddForm = QuickAddFormComponent;
