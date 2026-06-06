/* ================================================
   FILE: src/components/layout/PageRouter.tsx
   ================================================ */
import { AnimatePresence, motion } from 'motion/react';
import { ProjectPage } from '@/pages/ProjectPage';
import { EditorPage } from '@/editor/EditorPage';
import { useUiStore, type UiState } from '@/stores';
import { useShallow } from 'zustand/react/shallow';

interface PageRouterProps {
  isSidebarActiveCollapsed: boolean;
}

export function PageRouter({ isSidebarActiveCollapsed }: PageRouterProps) {
  const { activePage, isZenMode, setZenMode, setStatus, setActivePage } = useUiStore(
    useShallow((state: UiState) => ({
      activePage: state.activePage,
      isZenMode: state.isZenMode,
      setZenMode: state.setZenMode,
      setStatus: state.setStatus,
      setActivePage: state.setActivePage,
    }))
  );

  return (
    <div
      className={`main-content transition-[margin-left] duration-300 ease-[cubic-bezier(0.25,1,0.5,1)] ${
        isSidebarActiveCollapsed ? 'ml-4' : 'ml-[256px]'
      }`}
      id="main-content"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="h-full flex flex-col"
        >
          {activePage === 'project' && <ProjectPage openPage={setActivePage} />}
          {activePage === 'editor' && (
            <EditorPage
              isZenMode={isZenMode}
              onToggleZen={() => {
                setZenMode(!isZenMode);
                setStatus(!isZenMode ? 'Zen mode activated.' : 'Restored layout.');
              }}
              openPage={setActivePage}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
