/* ================================================
   FILE: src/components/layout/StatusBar.tsx
   ================================================ */
import { useUiStore, type UiState } from '@/stores';
import { useShallow } from 'zustand/react/shallow';

export function StatusBar() {
  const { statusMsg, showStatus } = useUiStore(
    useShallow((state: UiState) => ({
      statusMsg: state.statusMsg,
      showStatus: state.showStatus,
    }))
  );

  return (
    <div
      className={`fixed bottom-24 right-6 bg-white text-black font-mono text-xs px-4 py-2 border border-neutral-200 shadow-xl transition-all duration-300 pointer-events-none z-50 uppercase tracking-widest ${showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      {statusMsg}
    </div>
  );
}
