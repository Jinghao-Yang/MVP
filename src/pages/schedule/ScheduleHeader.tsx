/* ================================================
   FILE: src/pages/schedule/ScheduleHeader.tsx
   ================================================ */
import { CalendarDays, Layers, Notebook } from 'lucide-react';

interface ScheduleHeaderProps {
  viewMode: 'calendar' | 'kanban';
  onViewModeChange: (mode: 'calendar' | 'kanban') => void;
  onGenerateJournal: () => void;
}

function ScheduleHeaderComponent({
  viewMode,
  onViewModeChange,
  onGenerateJournal,
}: ScheduleHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/50 pb-5">
      <div>
        <h2 className="font-serif text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <span>Axiom Planner</span>
        </h2>
        <p className="text-neutral-500 font-semibold text-xs mt-1">
          Pluralistic task ledger bridging structural database relations and raw markdown
          checklists.
        </p>
      </div>

      {/* Buttons Row with Daily Journal Action */}
      <div className="flex items-center gap-3">
        {/* Daily Journal Generator */}
        <button
          onClick={onGenerateJournal}
          className="flex items-center gap-2 px-4 py-2 bg-[#1c1c1a] hover:bg-neutral-800 text-white font-bold text-xs rounded transition-all cursor-pointer shadow-md"
        >
          <Notebook className="w-3.5 h-3.5" />
          <span>Generate Daily Journal</span>
        </button>

        {/* Toggle between Calendar Grid and Kanban Columns */}
        <div className="flex items-center gap-1 border border-neutral-200 bg-neutral-100/60 p-1">
          <button
            onClick={() => onViewModeChange('calendar')}
            className={`p-1 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all rounded cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => onViewModeChange('kanban')}
            className={`p-1 px-3 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all rounded cursor-pointer ${
              viewMode === 'kanban'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Kanban</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export const ScheduleHeader = ScheduleHeaderComponent;
