/* ================================================
   FILE: src/pages/schedule/ActiveLedgerList.tsx
   ================================================ */
import { Search, CheckSquare, Square, Trash2 } from 'lucide-react';

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

interface GroupedTasks {
  objects: ObjectTask[];
  inlines: InlineTask[];
}

interface ActiveLedgerListProps {
  groupedTasksMap: Record<string, GroupedTasks>;
  taskSearch: string;
  showCompleted: boolean;
  onSearchChange: (search: string) => void;
  onToggleShowCompleted: () => void;
  onTaskClick: (docId: string) => void;
  onToggleObjectTask: (task: ObjectTask) => void;
  onToggleInlineTask: (task: InlineTask) => void;
  onDeleteTask: (docId: string) => void;
  onDragStart: (
    e: React.DragEvent,
    payload: { type: string; docId: string; taskText?: string }
  ) => void;
}

function ActiveLedgerListComponent({
  groupedTasksMap,
  taskSearch,
  showCompleted,
  onSearchChange,
  onToggleShowCompleted,
  onTaskClick,
  onToggleObjectTask,
  onToggleInlineTask,
  onDeleteTask,
  onDragStart,
}: ActiveLedgerListProps) {
  return (
    <div className="glass-panel p-5 border border-neutral-200 bg-white">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
        <h4 className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-500">
          Active Goals Index
        </h4>
        <button
          onClick={onToggleShowCompleted}
          className="font-mono text-[9px] hover:text-black border border-neutral-200 bg-neutral-50 py-0.5 px-2 rounded cursor-pointer text-neutral-500"
        >
          {showCompleted ? 'Hide Complete' : 'Show Complete'}
        </button>
      </div>

      <div className="relative mb-3">
        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
        </span>
        <input
          type="text"
          value={taskSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter search list..."
          className="w-full bg-white border border-neutral-200 pl-8 pr-3 py-1.8 text-xs outline-none focus:border-neutral-400"
        />
      </div>

      {/* Render Category sorted ledgers */}
      <div className="space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
        {Object.keys(groupedTasksMap).every(
          (g) => groupedTasksMap[g].objects.length === 0 && groupedTasksMap[g].inlines.length === 0
        ) ? (
          <div className="text-center py-12 text-neutral-400 font-sys text-xs">
            No active items matching setup filters.
          </div>
        ) : (
          Object.entries(groupedTasksMap).map(([title, val]) => {
            if (val.objects.length === 0 && val.inlines.length === 0) return null;

            return (
              <div key={title} className="space-y-2">
                <div className="font-mono text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center justify-between py-1 border-b border-neutral-100">
                  <span>{title}</span>
                  <span className="bg-neutral-100 text-neutral-500 px-1.5 py-0.2 ml-2 rounded text-[8px]">
                    {val.objects.length + val.inlines.length}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {val.objects.map((task) => {
                    const isDone = task.status === 'Completed';
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) =>
                          onDragStart(e, {
                            type: task.typeId === 'project' ? 'relation-project' : 'relation-task',
                            docId: task.id,
                          })
                        }
                        className={`group border p-2.5 flex items-start justify-between gap-3 transition-colors cursor-grab ${
                          isDone
                            ? 'bg-neutral-50/55 border-neutral-100 opacity-60 text-neutral-400'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleObjectTask(task);
                            }}
                            className="spring-click mt-0.5 shrink-0 text-neutral-400 hover:text-black border-none bg-transparent cursor-pointer"
                          >
                            {isDone ? (
                              <CheckSquare className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                          <div className="min-w-0" onClick={() => onTaskClick(task.id)}>
                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                              <span className="font-mono text-[8px] uppercase tracking-wider text-neutral-400 font-bold">
                                {task.typeId}
                              </span>
                              {task.duedate && (
                                <span className="font-mono text-[8px] bg-neutral-100 text-neutral-500 px-1 py-0.2 flex items-center gap-0.5">
                                  {task.duedate}
                                </span>
                              )}
                            </div>
                            <p className="font-bold text-xs text-neutral-800 leading-normal leading-snug">
                              {task.title}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => onDeleteTask(task.id)}
                          className="p-1 text-neutral-400 hover:text-red-500 border-none bg-transparent cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity shrink-0 self-start"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {val.inlines.map((task) => {
                    const isDone = task.completed;
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) =>
                          onDragStart(e, {
                            type: 'inline-task',
                            docId: task.docId,
                            taskText: task.text,
                          })
                        }
                        className={`group border p-2.5 flex items-start gap-3 transition-colors cursor-grab ${
                          isDone
                            ? 'bg-neutral-50/50 border-neutral-100 opacity-60 text-neutral-500'
                            : 'bg-white border-neutral-200 hover:border-neutral-300'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onToggleInlineTask(task)}
                          className="spring-click mt-0.5 shrink-0 text-neutral-300 hover:text-black border-none bg-transparent cursor-pointer"
                        >
                          {isDone ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono text-[8px] uppercase tracking-wider text-amber-700/80 font-bold">
                              {task.docTitle}
                            </span>
                            {task.date && (
                              <span className="font-mono text-[8px] bg-amber-50 text-amber-700 px-1 py-0.2">
                                {task.date}
                              </span>
                            )}
                          </div>
                          <p className="font-sys text-xs text-neutral-700 leading-snug font-medium">
                            {task.text}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const ActiveLedgerList = ActiveLedgerListComponent;
