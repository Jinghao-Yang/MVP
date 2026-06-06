/* ================================================
   FILE: src/pages/schedule/DateShiftPanel.tsx
   ================================================ */
import { Activity, ArrowRight } from 'lucide-react';

interface DateShiftPanelProps {
  shiftStartDate: string;
  shiftEndDate: string;
  shiftDaysOffset: number;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onOffsetChange: (offset: number) => void;
  onShift: () => void;
}

function DateShiftPanelComponent({
  shiftStartDate,
  shiftEndDate,
  shiftDaysOffset,
  onStartDateChange,
  onEndDateChange,
  onOffsetChange,
  onShift,
}: DateShiftPanelProps) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-none space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-200/60 pb-2">
        <Activity className="w-4 h-4 text-neutral-600 animate-pulse" />
        <h4 className="font-mono text-[10px] uppercase tracking-wider font-bold text-neutral-500">
          System Deadline Range Shifter Tool
        </h4>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-[9px] font-mono uppercase font-bold text-neutral-400 mb-1">
            Start Range Date
          </label>
          <input
            type="date"
            value={shiftStartDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full bg-white border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400 font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono uppercase font-bold text-neutral-400 mb-1">
            End Range Date
          </label>
          <input
            type="date"
            value={shiftEndDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full bg-white border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400 font-mono"
          />
        </div>
        <div>
          <label className="block text-[9px] font-mono uppercase font-bold text-neutral-400 mb-1">
            Days Shift Delta
          </label>
          <input
            type="number"
            value={shiftDaysOffset}
            onChange={(e) => onOffsetChange(parseInt(e.target.value) || 0)}
            className="w-full bg-white border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400 font-mono"
            placeholder="+2 or -3"
          />
        </div>
        <button
          onClick={onShift}
          className="w-full h-9 flex items-center justify-center gap-1.5 px-3 bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer rounded-none border-none"
        >
          <span>Shift Deadlines</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export const DateShiftPanel = DateShiftPanelComponent;
