/* ================================================
   FILE: src/pages/schedule/CalendarView.tsx
   ================================================ */
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
  id: string;
  docId: string;
  title: string;
  date: string;
  type: 'relation-task' | 'relation-project' | 'inline-task' | 'other-date';
  status: string;
  priority: string;
  propName?: string;
}

interface CalendarViewProps {
  currentDate: Date;
  calendarEvents: CalendarEvent[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
  onDateClick: (date: string) => void;
  onEventClick: (docId: string) => void;
  onDrop: (e: React.DragEvent, targetDate: string) => void;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function CalendarViewComponent({
  currentDate,
  calendarEvents,
  onPrevMonth,
  onNextMonth,
  onToday,
  onDateClick,
  onEventClick,
  onDrop,
}: CalendarViewProps) {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  const startOfCurrent = new Date(currentYear, currentMonth, 1);
  const endOfCurrent = new Date(currentYear, currentMonth + 1, 0);

  const firstDayIndex = startOfCurrent.getDay();
  const daysInMonth = endOfCurrent.getDate();

  const cells: Array<{ d: number; formattedDate: string } | null> = [];

  for (let i = 0; i < firstDayIndex; i++) {
    cells.push(null);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ d, formattedDate });
  }

  const calendarCells = cells;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="border border-neutral-200 p-6 rounded-none bg-white">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-5 h-5 text-neutral-500" />
          <h3 className="font-serif text-sm font-bold text-[#1C1C1A]">
            {monthNames[currentMonth]} {currentYear}
          </h3>
        </div>
        <div className="flex items-center gap-1.2 border border-neutral-200 p-1 bg-neutral-50">
          <button
            onClick={onPrevMonth}
            className="spring-click p-1 hover:text-black text-neutral-400 cursor-pointer border-none bg-transparent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onToday}
            className="spring-click px-2.5 py-1 font-mono text-[9px] font-bold text-neutral-500 hover:text-black cursor-pointer border-none bg-transparent"
          >
            TODAY
          </button>
          <button
            onClick={onNextMonth}
            className="spring-click p-1 hover:text-black text-neutral-400 cursor-pointer border-none bg-transparent"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[9px] uppercase tracking-wider text-neutral-400 font-bold mb-2 pb-2 border-b border-neutral-200">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Date grid cells */}
      <div className="grid grid-cols-7 gap-1.5 min-h-[460px]">
        {calendarCells.map((cell, idx) => {
          if (!cell) {
            return (
              <div
                key={`empty-${idx}`}
                className="bg-neutral-50/15 border border-transparent/5 h-20 opacity-30"
              />
            );
          }

          const { d, formattedDate } = cell;
          const dayEvents = calendarEvents.filter((ev) => ev.date === formattedDate);
          const activeIsToday = isToday(currentYear, currentMonth, d);

          return (
            <div
              key={`day-${formattedDate}`}
              onDragOver={handleDragOver}
              onDrop={(e) => onDrop(e, formattedDate)}
              onClick={() => onDateClick(formattedDate)}
              className={`group border border-neutral-200/80 p-2 min-h-24 hover:border-neutral-400 hover:bg-neutral-50/20 transition-all cursor-pointer flex flex-col justify-between ${
                activeIsToday ? 'bg-neutral-50 ring-1 ring-neutral-400/20' : 'bg-white'
              }`}
            >
              <span
                className={`font-mono text-[9px] font-bold self-start ${
                  activeIsToday
                    ? 'bg-neutral-900 text-white rounded-full px-1.5 py-0.5'
                    : 'text-neutral-500 group-hover:text-black'
                }`}
              >
                {d}
              </span>

              {/* Day events mapping inside cell */}
              <div className="space-y-1 mt-2 flex-grow overflow-y-auto max-h-[75px] scroll-hide">
                {dayEvents.map((evt) => {
                  const isDone = evt.status === 'Completed';
                  return (
                    <div
                      key={evt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(evt.docId);
                      }}
                      className={`p-1 text-[9px] font-bold leading-normal border truncate rounded transition-colors ${
                        isDone
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100 opacity-60 line-through'
                          : 'bg-neutral-100 border-neutral-200 text-neutral-800 hover:bg-neutral-200'
                      }`}
                      title={evt.title}
                    >
                      📄 {evt.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const CalendarView = CalendarViewComponent;
