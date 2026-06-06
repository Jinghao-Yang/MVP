/* ================================================
   FILE: src/pages/schedule/KanbanView.tsx
   ================================================ */
import { Calendar as CalendarIcon, CheckCircle2 } from 'lucide-react';

interface ObjectTask {
  id: string;
  title: string;
  typeId: string;
  status: string;
  duedate: string | null;
  priority: string;
  content: string;
}

interface InlineTask {
  id: string;
  docId: string;
  docTitle: string;
  text: string;
  completed: boolean;
  date: string | null;
  priority: string;
}

interface KanbanViewProps {
  objectTasks: ObjectTask[];
  inlineTasks: InlineTask[];
  onTaskClick: (docId: string) => void;
  onToggleInlineTask: (task: InlineTask) => void;
}

const getPriorityColor = (p: string) => {
  switch (p?.toLowerCase()) {
    case 'high':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'low':
      return 'bg-slate-50 text-slate-600 border-slate-200';
    default:
      return 'bg-neutral-50 text-neutral-500 border-neutral-200';
  }
};

function KanbanViewComponent({
  objectTasks,
  inlineTasks,
  onTaskClick,
  onToggleInlineTask,
}: KanbanViewProps) {
  const columns = ['Todo', 'In Progress', 'Completed'];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {columns.map((columnName) => {
        const columnObjects = objectTasks.filter((t) => t.status === columnName);

        const columnInlines = inlineTasks.filter((t) => {
          if (columnName === 'Completed') return t.completed;
          if (columnName === 'Todo') return !t.completed;
          return false;
        });

        const totalItemsCount = columnObjects.length + columnInlines.length;

        return (
          <div
            key={columnName}
            className="border border-neutral-200 bg-neutral-100/50 p-4 space-y-4 min-h-[500px]"
          >
            <div className="border-b border-neutral-200/80 pb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider font-extrabold text-neutral-500">
                {columnName}
              </span>
              <span className="font-mono text-[9px] bg-neutral-200/80 text-neutral-600 px-2 py-0.2 rounded font-bold">
                {totalItemsCount}
              </span>
            </div>

            <div className="space-y-2.5">
              {columnObjects.map((task) => (
                <div
                  key={task.id}
                  onClick={() => onTaskClick(task.id)}
                  className="bg-white border border-neutral-200 hover:border-neutral-300 p-3 flex flex-col gap-2 shadow-sm relative cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase font-bold text-rose-600 tracking-wider">
                      {task.typeId}
                    </span>
                    {task.priority && (
                      <span
                        className={`font-mono text-[8px] border px-1 rounded ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-xs text-neutral-800 font-sys leading-normal">
                    {task.title}
                  </p>
                  {task.duedate && (
                    <div className="flex items-center gap-1 font-mono text-[8px] text-neutral-400 uppercase">
                      <CalendarIcon className="w-2.5 h-2.5" />
                      <span>{task.duedate}</span>
                    </div>
                  )}
                </div>
              ))}

              {columnInlines.map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-neutral-200/60 p-3 flex flex-col gap-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[8px] uppercase font-bold text-[#b45309] tracking-wider">
                      Inline Task
                    </span>
                    {task.priority && (
                      <span
                        className={`font-mono text-[8px] border px-1 rounded ${getPriorityColor(task.priority)}`}
                      >
                        {task.priority}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-xs text-neutral-700 leading-normal font-sys">
                    {task.text}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    {task.date && (
                      <span className="font-mono text-[8px] text-[#b45309] bg-amber-50 px-1 border border-amber-100 flex items-center gap-0.5">
                        <CalendarIcon className="w-2.5 h-2.5" />
                        {task.date}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleInlineTask(task)}
                      className="spring-click text-neutral-400 hover:text-black border-none bg-transparent cursor-pointer ml-auto"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 ${task.completed ? 'text-emerald-500' : 'text-neutral-300'}`}
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const KanbanView = KanbanViewComponent;
