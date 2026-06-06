import { useShallow } from 'zustand/react/shallow';
import { KanbanBoard } from './kanban/KanbanBoard';
import { ChangelogView } from './changelog/ChangelogView';
import { TimelineView } from './timeline/TimelineView';
import { DatabaseView } from './database/DatabaseView';
import { SettingsView } from './settings/SettingsView';
import { useUiStore } from '../stores/ui-store';

export function ProjectPage({ openPage }: { openPage: (p: string) => void }) {
  const { activeProjectTab, setActiveProjectTab } = useUiStore(
    useShallow((state) => ({
      activeProjectTab: state.activeProjectTab,
      setActiveProjectTab: state.setActiveProjectTab,
    }))
  );

  const renderContent = () => {
    switch (activeProjectTab) {
      case 'kanban':
        return <KanbanBoard />;
      case 'changelog':
        return <ChangelogView />;
      case 'timeline':
        return <TimelineView />;
      case 'database':
        return <DatabaseView openPage={openPage} />; // 绑定
      case 'settings':
        return <SettingsView />;
      default:
        return <KanbanBoard />;
    }
  };

  return (
    <div className="page-panel flex-1 flex flex-col h-full overflow-hidden">
      <header className="h-20 flex items-center justify-between px-8 shrink-0 z-10 bg-transparent">
        <div className="flex items-center gap-4">
          <div className="font-sys text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] flex items-center gap-2">
            <span>Space</span>
            <span className="font-serif italic text-sm opacity-50">/</span>
            <span className="text-[var(--text-main)] font-semibold">Topology Math</span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/30 backdrop-blur-md border border-black/5">
          {['changelog', 'timeline', 'kanban', 'database', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveProjectTab(tab)}
              className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border-none cursor-pointer ${activeProjectTab === tab ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
            >
              {tab === 'kanban' ? 'Ledger' : tab === 'database' ? 'Database' : tab === 'settings' ? 'Settings' : tab}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-[1160px] mx-auto h-full flex flex-col space-y-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
