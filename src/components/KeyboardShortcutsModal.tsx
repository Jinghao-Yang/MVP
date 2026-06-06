/* ================================================
   FILE: src/components/KeyboardShortcutsModal.tsx
   ================================================ */
import { X, Keyboard, Sparkles, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcuts = [
    {
      combo: ['⌘', 'K'],
      label: 'Command Palette',
      desc: 'Open standard search and jump across pages or run global actions',
      tag: 'Global',
    },
    {
      combo: ['⌘', 'Z'],
      label: 'Zen Mode',
      desc: 'Toggle immersive focused writing layout, hiding unnecessary side elements',
      tag: 'Global',
    },
    {
      combo: ['⌘', 'I'],
      label: 'Focus Quick Capture',
      desc: 'Focus the quick capture box at bottom of screen to add cards immediately',
      tag: 'Global',
    },
    {
      combo: ['?'],
      label: 'Keyboard Shortcuts',
      desc: 'Toggle this overlay from anywhere on the app when not typing',
      tag: 'Help',
    },
    {
      combo: ['Esc'],
      label: 'Dismiss Overlay',
      desc: 'Close active overlays, command menu, or keyboard help dialog',
      tag: 'Navigation',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-1100 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            id="shortcuts-backdrop"
          />

          {/* Modal content cardboard */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl p-6 overflow-hidden z-10 font-sys text-text-main"
            id="shortcuts-content"
          >
            {/* Ambient pattern */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-bh-red/10 to-transparent rounded-full filter blur-xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-bh-red">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold dark:text-white uppercase tracking-wider flex items-center gap-2">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono uppercase tracking-widest mt-0.5">
                    Physical hotkeys & accelerators
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent"
                title="Close shortcuts menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Shortcuts List */}
            <div className="space-y-4">
              {shortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="p-3 border border-neutral-100 dark:border-neutral-800 hover:border-neutral-200/85 dark:hover:border-neutral-700 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/50 flex items-center justify-between gap-4 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs dark:text-neutral-200">{s.label}</span>
                      <span className="text-[8px] font-mono uppercase tracking-widest bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.2 rounded text-neutral-400 font-bold">
                        {s.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 leading-snug line-clamp-2">
                      {s.desc}
                    </p>
                  </div>

                  <div className="flex gap-1 shrink-0">
                    {s.combo.map((key, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-1 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs font-mono font-bold shadow-sm dark:text-white min-w-[24px] text-center"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-neutral-400 font-bold">
              <span className="flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-bh-blue" />{' '}
                <span>Press '?' to show shortcuts help</span>
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-bh-green" /> Axiom Core v0.8
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
