/* ================================================
   FILE: src/pages/schedule/ScheduleView.tsx
   ================================================ */
import { useState, useMemo, useOptimistic, startTransition } from 'react';
import { db } from '@/db/dexie';
import { useUiStore } from '@/stores';
import { toast } from 'sonner';
import { useTasks, type ObjectTask } from '@/hooks/useTasks';
import type { InlineTaskEntity } from '@/types';
import { TASK_STATUS, VIEW_MODES } from '@/utils/constants';

// Import refactored components
import { ScheduleHeader } from './ScheduleHeader';
import { DateShiftPanel } from './DateShiftPanel';
import { CalendarView } from './CalendarView';
import { KanbanView } from './KanbanView';
import { QuickAddForm } from './QuickAddForm';
import { ActiveLedgerList } from './ActiveLedgerList';
import { NewTaskModal } from './NewTaskModal';

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

export function ScheduleView() {
  const setMainWikiId = useUiStore((state) => state.setMainWikiId);
  const setActivePage = useUiStore((state) => state.setActivePage);

  // ================================================
  // 1. Live Queries & Data Processing via encapsulated useTasks Hook
  // ================================================
  const { objectTasks, inlineTasks } = useTasks();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>(VIEW_MODES.CALENDAR);

  const [shiftStartDate, setShiftStartDate] = useState(
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [shiftEndDate, setShiftEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [shiftDaysOffset, setShiftDaysOffset] = useState<number>(2);

  const [taskSearch, setTaskSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);
  const [quickAddText, setQuickAddText] = useState('');

  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskDate, setNewTaskDate] = useState('');

  // Optimistic updates for checklist tasks using the new clean pre-calculated DB states
  const [optimisticTasks, addOptimisticTask] = useOptimistic(
    inlineTasks,
    (state, updatedTask: InlineTaskEntity) =>
      state.map((t) => (t.id === updatedTask.id ? updatedTask : t))
  );

  const calendarEvents = useMemo(() => {
    const list: CalendarEvent[] = [];

    objectTasks.forEach((ot) => {
      if (ot.duedate) {
        list.push({
          id: ot.id,
          docId: ot.id,
          title: ot.title,
          date: ot.duedate,
          type: ot.typeId === 'project' ? 'relation-project' : 'relation-task',
          status: ot.status,
          priority: ot.priority,
          propName: 'Due Date',
        });
      }
    });

    optimisticTasks.forEach((it) => {
      if (it.date) {
        list.push({
          id: it.id!,
          docId: it.docId,
          title: `[Inline] ${it.text}`,
          date: it.date,
          type: 'inline-task',
          status: it.completed ? TASK_STATUS.COMPLETED : TASK_STATUS.TODO,
          priority: it.priority,
        });
      }
    });

    return list;
  }, [objectTasks, optimisticTasks]);

  // ================================================
  // 3. Mutation Handlers
  // ================================================
  const toggleInlineTask = async (task: InlineTaskEntity) => {
    // 1. Apply optimistic update instantly
    startTransition(() => {
      addOptimisticTask({ ...task, completed: !task.completed });
    });

    try {
      // Direct fast local transition inside IndexedDB pre-saved checklist items table
      if (task.id) {
        await db.inlineTasks.update(task.id, { completed: !task.completed });
      }

      // Also serialize changes back into the document body to maintain integrity
      const doc = await db.documents.get(task.docId);
      if (!doc) {
        toast.error('Document not found.');
        return;
      }

      const lines = doc.content.split('\n');
      let indexCounter = 0;

      const updatedLines = lines.map((line) => {
        const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (match) {
          const checkId = `${task.docId}-inline-${indexCounter}`;
          indexCounter++;

          if (checkId === task.id) {
            const currentSymbol = match[1];
            const nextSymbol = currentSymbol.toLowerCase() === 'x' ? ' ' : 'x';
            return line.replace(/\[[ xX]\]/, `[${nextSymbol}]`);
          }
        }
        return line;
      });

      await db.documents.update(task.docId, {
        content: updatedLines.join('\n'),
        updatedAt: Date.now(),
      });

      toast.success('Updated checklist task state.');
    } catch (err) {
      console.error(err);
      toast.error('Failed to change checklist item.');
    }
  };

  const toggleObjectTask = async (task: ObjectTask) => {
    try {
      const nextStatus =
        task.status === TASK_STATUS.COMPLETED ? TASK_STATUS.TODO : TASK_STATUS.COMPLETED;
      const propId = task.typeId === 'project' ? 'prop-proj-status' : 'prop-task-status';

      await db.docProperties.put({
        docId: task.id,
        propId,
        value: nextStatus,
      });

      toast.success(`Set status to ${nextStatus}.`);
    } catch {
      toast.error('Failed to modify object status.');
    }
  };

  const deleteObjectTask = async (docId: string) => {
    try {
      await db.documents.delete(docId);
      await db.docProperties.where('docId').equals(docId).delete();
      await db.inlineTasks.where('docId').equals(docId).delete();
      toast.error('Pruned Task document.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickAddText.trim();
    if (!raw) return;

    let parsedText = raw;
    let duedate: string | null = null;
    let priority = 'Medium';

    const dateMatch = parsedText.match(/@(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      duedate = dateMatch[1];
      parsedText = parsedText.replace(/@\d{4}-\d{2}-\d{2}/, '').trim();
    }

    const pMatch = parsedText.match(/!(High|Medium|Low)/i);
    if (pMatch) {
      const rawP = pMatch[1];
      priority = rawP.charAt(0).toUpperCase() + rawP.slice(1).toLowerCase();
      parsedText = parsedText.replace(/!(High|Medium|Low)/i, '').trim();
    }

    try {
      const docId = `task-${Date.now().toString().slice(-6)}`;
      await db.documents.add({
        id: docId,
        typeId: 'task',
        title: parsedText,
        content: `# ${parsedText}\n\nTask added via Workspace Scheduler quick input.\n\n- [ ] Draft goal scope`,
        badge: 'Task',
        badgeClass: 'tag-badge-yellow',
        updatedAt: Date.now(),
      });

      await db.docProperties.bulkPut([
        { docId, propId: 'prop-task-status', value: 'Todo' },
        { docId, propId: 'prop-task-duedate', value: duedate || '' },
        { docId, propId: 'prop-task-priority', value: priority },
      ]);

      setQuickAddText('');
      toast.success('Scheduled new task.');
    } catch {
      toast.error('Failed to quick-schedule card.');
    }
  };

  const handleShiftDeadlines = async () => {
    if (!shiftStartDate || !shiftEndDate) {
      toast.error('Please specify both start and end boundary dates.');
      return;
    }

    try {
      let shiftCount = 0;

      for (const task of objectTasks) {
        if (task.duedate && task.duedate >= shiftStartDate && task.duedate <= shiftEndDate) {
          const dateObj = new Date(task.duedate);
          if (isNaN(dateObj.getTime())) continue;

          dateObj.setDate(dateObj.getDate() + Number(shiftDaysOffset));
          const updatedDateStr = dateObj.toISOString().split('T')[0];

          const propId = task.typeId === 'task' ? 'prop-task-duedate' : 'prop-proj-duedate';

          await db.docProperties.put({
            docId: task.id,
            propId,
            value: updatedDateStr,
          });

          shiftCount++;
        }
      }

      toast.success(
        `Deadline shift complete: updated ${shiftCount} records by ${shiftDaysOffset} day(s)!`
      );
    } catch {
      toast.error('An error occurred during relational deadline shifting.');
    }
  };

  const handleGenerateDailyJournal = async () => {
    try {
      const dateHoyStr = new Date().toISOString().split('T')[0];
      const humanReadableHoy = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      const incompleteObjectTasks = objectTasks.filter((t) => t.status !== 'Completed');
      const incompleteInlineTasks = inlineTasks.filter((t) => !t.completed);

      const journalBody = `# Daily Journal: ${humanReadableHoy}
      
## 🎯 Scheduled Active Tasks (Unfinished)
These active duties are mapped automatically from your Axiom Planner database:

### 📦 Structural Objects Goals
${
  incompleteObjectTasks.length === 0
    ? '*No pending high-level object goals currently scheduled.*'
    : incompleteObjectTasks
        .map(
          (t) =>
            `- [ ] **${t.title}** (${t.typeId.toUpperCase()}${t.duedate ? `, due: ${t.duedate}` : ''})`
        )
        .join('\n')
}

### 📄 Markdown Checklists Tasks
${
  incompleteInlineTasks.length === 0
    ? '*No pending inline markdown checkboxes mapped.*'
    : incompleteInlineTasks
        .map((t) => `- [ ] **${t.text}** *(Ref: [${t.docTitle}](${t.docId}))*`)
        .join('\n')
}

---

## 📓 Mindful Reflections & Intention Setting
- **Today's Primary Focus Word**: [Focus...]
- **Core Intentions**:
  1. 
  2. 
- **What Went Well / Academic Discoveries**:
  - [Reflect on what you completed or researched today...]

## 🧹 Impediments & Blockers
- [Add notes on blocking elements, or tasks needing rescheduling for tomorrow...]
`;

      const docId = `journal-${dateHoyStr}`;

      await db.documents.put({
        id: docId,
        typeId: 'note',
        title: `Daily Journal: ${dateHoyStr}`,
        content: journalBody,
        badge: 'Journal',
        badgeClass: 'tag-badge-blue',
        updatedAt: Date.now(),
      });

      toast.success('Successfully generated Daily Journal. Opening editor...');

      setMainWikiId(docId);
      setActivePage('editor');
    } catch (err) {
      toast.error('Failed to construct daily journal workspace draft.');
      console.error(err);
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    payload: { type: string; docId: string; taskText?: string }
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));

    // Temporarily disable overflow clipping synchronously for the browser ghost image capture
    const container = document.getElementById('ledger-scroll-container');
    if (container) {
      container.style.overflow = 'visible';
      container.style.maxHeight = 'none';
      setTimeout(() => {
        container.style.overflow = '';
        container.style.maxHeight = '';
      }, 0);
    }
  };

  const handleDropOnDate = async (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    try {
      const payloadStr = e.dataTransfer.getData('text/plain');
      if (!payloadStr) return;

      const payload = JSON.parse(payloadStr) as {
        type: string;
        docId: string;
        taskText?: string;
      };

      if (payload.type === 'relation-task') {
        await db.docProperties.put({
          docId: payload.docId,
          propId: 'prop-task-duedate',
          value: targetDate,
        });
        toast.info(`Updated Task deadline to ${targetDate}`);
      } else if (payload.type === 'relation-project') {
        await db.docProperties.put({
          docId: payload.docId,
          propId: 'prop-proj-duedate',
          value: targetDate,
        });
        toast.info(`Rescheduled Project deadline to ${targetDate}`);
      } else if (payload.type === 'inline-task' && payload.taskText) {
        const doc = await db.documents.get(payload.docId);
        if (!doc) return;

        const lines = doc.content.split('\n');
        const updatedLines = lines.map((line) => {
          if (line.includes(payload.taskText!)) {
            let clean = line.replace(/@\d{4}-\d{2}-\d{2}/, '').trim();
            return `${clean} @${targetDate}`;
          }
          return line;
        });

        await db.documents.update(payload.docId, {
          content: updatedLines.join('\n'),
          updatedAt: Date.now(),
        });
        toast.info(`Updated Inline deadline to ${targetDate}`);
      }
    } catch {
      toast.error('Drag scheduling failed.');
    }
  };

  const groupedTasksMap = useMemo(() => {
    const map: Record<string, { objects: ObjectTask[]; inlines: InlineTaskEntity[] }> = {
      Overdue: { objects: [], inlines: [] },
      Today: { objects: [], inlines: [] },
      Upcoming: { objects: [], inlines: [] },
      'No Date': { objects: [], inlines: [] },
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const fitObj = objectTasks.filter((t) => {
      const matchS = t.title.toLowerCase().includes(taskSearch.toLowerCase());
      if (!showCompleted && t.status === 'Completed') return false;
      return matchS;
    });

    const fitInl = optimisticTasks.filter((t) => {
      const matchS = t.text.toLowerCase().includes(taskSearch.toLowerCase());
      if (!showCompleted && t.completed) return false;
      return matchS;
    });

    fitObj.forEach((t) => {
      if (!t.duedate) {
        map['No Date'].objects.push(t);
      } else if (t.duedate === todayStr) {
        map['Today'].objects.push(t);
      } else if (t.duedate < todayStr) {
        map['Overdue'].objects.push(t);
      } else {
        map['Upcoming'].objects.push(t);
      }
    });

    fitInl.forEach((t) => {
      if (!t.date) {
        map['No Date'].inlines.push(t);
      } else if (t.date === todayStr) {
        map['Today'].inlines.push(t);
      } else if (t.date < todayStr) {
        map['Overdue'].inlines.push(t);
      } else {
        map['Upcoming'].inlines.push(t);
      }
    });

    return map;
  }, [objectTasks, optimisticTasks, taskSearch, showCompleted]);

  return (
    <div className="flex-1 flex flex-col space-y-6 h-full min-h-0 select-none font-sys">
      <ScheduleHeader
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onGenerateJournal={handleGenerateDailyJournal}
      />

      <DateShiftPanel
        shiftStartDate={shiftStartDate}
        shiftEndDate={shiftEndDate}
        shiftDaysOffset={shiftDaysOffset}
        onStartDateChange={setShiftStartDate}
        onEndDateChange={setShiftEndDate}
        onOffsetChange={setShiftDaysOffset}
        onShift={handleShiftDeadlines}
      />

      {/* Primary Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-0 flex-1">
        {/* Left Interactive Workspace (SPAN 8) */}
        <div className="lg:col-span-8">
          {viewMode === 'calendar' ? (
            <CalendarView
              currentDate={currentDate}
              calendarEvents={calendarEvents}
              onPrevMonth={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
              }
              onNextMonth={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
              }
              onToday={() => setCurrentDate(new Date())}
              onDateClick={(date) => {
                setNewTaskDate(date);
                setIsNewTaskModalOpen(true);
              }}
              onEventClick={(docId) => {
                setMainWikiId(docId);
                setActivePage('editor');
              }}
              onDrop={handleDropOnDate}
            />
          ) : (
            <KanbanView
              objectTasks={objectTasks}
              inlineTasks={optimisticTasks}
              onTaskClick={(docId) => {
                setMainWikiId(docId);
                setActivePage('editor');
              }}
              onToggleInlineTask={toggleInlineTask}
            />
          )}
        </div>

        {/* Right Task Ledger list panel (SPAN 4) */}
        <div className="lg:col-span-4 space-y-6">
          <QuickAddForm
            quickAddText={quickAddText}
            onTextChange={setQuickAddText}
            onSubmit={handleQuickAdd}
          />

          <ActiveLedgerList
            groupedTasksMap={groupedTasksMap}
            taskSearch={taskSearch}
            showCompleted={showCompleted}
            onSearchChange={setTaskSearch}
            onToggleShowCompleted={() => setShowCompleted(!showCompleted)}
            onTaskClick={(docId) => {
              setMainWikiId(docId);
              setActivePage('editor');
            }}
            onToggleObjectTask={toggleObjectTask}
            onToggleInlineTask={toggleInlineTask}
            onDeleteTask={deleteObjectTask}
            onDragStart={handleDragStart}
          />
        </div>
      </div>

      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        defaultDate={newTaskDate}
        onClose={() => setIsNewTaskModalOpen(false)}
        onTaskCreated={() => {}}
      />
    </div>
  );
}
