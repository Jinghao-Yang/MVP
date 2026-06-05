/* ================================================
   FILE: src/pages/schedule/ScheduleView.tsx
   ================================================ */
import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { useUiStore } from '@/stores/ui-store';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  CalendarDays,
  Search,
  CheckCircle2,
  Trash2,
  Layers,
  ArrowRight,
  Notebook,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

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
  // 1. Live Queries & Data Processing
  // ================================================
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch all documents
  const documents = useLiveQuery(() => db.documents.toArray(), [refreshTrigger]);
  // Fetch doc properties for relations
  const docProperties = useLiveQuery(() => db.docProperties.toArray(), [refreshTrigger]);

  // Current Calendar Date focus
  const [currentDate, setCurrentDate] = useState(new Date());
  // Toggle layout mode: 'calendar' | 'kanban'
  const [viewMode, setViewMode] = useState<'calendar' | 'kanban'>('calendar');

  // Interactive deadline shift range selection state
  const [shiftStartDate, setShiftStartDate] = useState(
    new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [shiftEndDate, setShiftEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [shiftDaysOffset, setShiftDaysOffset] = useState<number>(2);

  // Side panels active filters
  const [taskSearch, setTaskSearch] = useState('');
  const [showCompleted, setShowCompleted] = useState(true);

  // New task quick add text
  const [quickAddText, setQuickAddText] = useState('');

  // Modals / Editors state
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('Medium');

  // ================================================
  // 2. Data Mappers & Extractors
  // ================================================

  // A. Process Relational Document Tasks & Projects
  const objectTasks = useMemo(() => {
    if (!documents || !docProperties) return [];

    // Map properties in a KV format grouped by docId
    const propsMap: Record<string, Record<string, string>> = {};
    docProperties.forEach((p) => {
      if (!propsMap[p.docId]) propsMap[p.docId] = {};
      propsMap[p.docId][p.propId] = p.value;
    });

    const list: ObjectTask[] = [];

    documents.forEach((doc) => {
      if (doc.typeId === 'task' || doc.typeId === 'project') {
        const p = propsMap[doc.id] || {};
        const isProject = doc.typeId === 'project';

        const status = isProject
          ? p['prop-proj-status'] || 'Active'
          : p['prop-task-status'] || 'Todo';

        const duedate = isProject ? p['prop-proj-duedate'] || null : p['prop-task-duedate'] || null;

        const priority = isProject ? 'High' : p['prop-task-priority'] || 'Medium';

        list.push({
          id: doc.id,
          title: doc.title,
          typeId: doc.typeId,
          status,
          duedate,
          priority,
          content: doc.content,
        });
      }
    });

    return list;
  }, [documents, docProperties]);

  // B. Parse Inline Markdown Tasks
  const inlineTasks = useMemo(() => {
    if (!documents) return [];
    const list: InlineTask[] = [];

    documents.forEach((doc) => {
      if (doc.typeId === 'task') return;

      const lines = doc.content.split('\n');
      lines.forEach((line, index) => {
        const match = line.match(/^\s*[-*]\s+\[([ xX])\]\s+(.+)$/);
        if (match) {
          const completed = match[1].toLowerCase() === 'x';
          let text = match[2].trim();

          // Parse deadline tag: @YYYY-MM-DD
          let date: string | null = null;
          const dateMatch = text.match(/@(\d{4}-\d{2}-\d{2})/);
          if (dateMatch) {
            date = dateMatch[1];
            text = text.replace(/@\d{4}-\d{2}-\d{2}/, '').trim();
          }

          // Parse priority tag: !High, !Medium, !Low
          let priority = 'Medium';
          const pMatch = text.match(/!(High|Medium|Low)/gi);
          if (pMatch) {
            priority = pMatch[0].substring(1);
            priority = priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
            text = text.replace(/!(High|Medium|Low)/gi, '').trim();
          }

          list.push({
            id: `${doc.id}-inline-${index}`,
            docId: doc.id,
            docTitle: doc.title,
            text,
            completed,
            date,
            priority,
          });
        }
      });
    });

    return list;
  }, [documents]);

  // C. Compile unified list for Calendar Cell views
  const calendarEvents = useMemo(() => {
    const list: CalendarEvent[] = [];

    // Push Object tasks containing due dates
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
          propName: ot.typeId === 'project' ? 'Due Date' : 'Due Date',
        });
      }
    });

    // Push Inline Markdown tasks containing @YYYY-MM-DD deadlines
    inlineTasks.forEach((it) => {
      if (it.date) {
        list.push({
          id: it.id,
          docId: it.docId,
          title: `[Inline] ${it.text}`,
          date: it.date,
          type: 'inline-task',
          status: it.completed ? 'Completed' : 'Todo',
          priority: it.priority,
        });
      }
    });

    return list;
  }, [objectTasks, inlineTasks]);

  // ================================================
  // 3. Math & Helpers for Calendar Views
  // ================================================
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

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

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Compile calendar cells representing days in focus month
  const calendarCells = useMemo(() => {
    const startOfCurrent = new Date(currentYear, currentMonth, 1);
    const endOfCurrent = new Date(currentYear, currentMonth + 1, 0);

    const firstDayIndex = startOfCurrent.getDay();
    const daysInMonth = endOfCurrent.getDate();

    const cells: Array<{ d: number; formattedDate: string } | null> = [];

    // Left fill empty placeholders
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(null);
    }

    // Days numbers
    for (let d = 1; d <= daysInMonth; d++) {
      const formattedDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ d, formattedDate });
    }

    return cells;
  }, [currentMonth, currentYear]);

  const isToday = (year: number, month: number, day: number) => {
    const today = new Date();
    return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  // ================================================
  // 4. Mutation Handlers (DB updates)
  // ================================================

  // Toggle checklist status in Inline documents
  const toggleInlineTask = async (task: InlineTask) => {
    try {
      const doc = await db.documents.get(task.docId);
      if (!doc) return;

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

      setRefreshTrigger((prev) => prev + 1);
      toast.success('Updated checklist task state.');
    } catch {
      toast.error('Failed to change checklist item.');
    }
  };

  // Toggle Object status in structural node table
  const toggleObjectTask = async (task: ObjectTask) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
      const propId = task.typeId === 'project' ? 'prop-proj-status' : 'prop-task-status';

      await db.docProperties.put({
        docId: task.id,
        propId,
        value: nextStatus,
      });

      setRefreshTrigger((p) => p + 1);
      toast.success(`Set status to ${nextStatus}.`);
    } catch {
      toast.error('Failed to modify object status.');
    }
  };

  const deleteObjectTask = async (docId: string) => {
    try {
      await db.documents.delete(docId);
      await db.docProperties.where('docId').equals(docId).delete();
      setRefreshTrigger((prev) => prev + 1);
      toast.error('Pruned Task document.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  // Quick parser: e.g. "Review Compact metrics @2026-06-12 !High"
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = quickAddText.trim();
    if (!raw) return;

    let parsedText = raw;
    let duedate: string | null = null;
    let priority = 'Medium';

    // Parse date: @YYYY-MM-DD
    const dateMatch = parsedText.match(/@(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      duedate = dateMatch[1];
      parsedText = parsedText.replace(/@\d{4}-\d{2}-\d{2}/, '').trim();
    }

    // Parse priority: !High, !Medium, !Low
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
      setRefreshTrigger((prev) => prev + 1);
      toast.success('Scheduled new task.');
    } catch {
      toast.error('Failed to quick-schedule card.');
    }
  };

  // Create task dialog trigger
  const handleCreateTaskFromCalendar = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const docId = `task-${Date.now().toString().slice(-6)}`;
      await db.documents.add({
        id: docId,
        typeId: 'task',
        title: newTaskTitle,
        content: `# ${newTaskTitle}\n\nTask scheduled on date ${newTaskDate}.\n\n- [ ] Goal initialization`,
        badge: 'Task',
        badgeClass: 'tag-badge-yellow',
        updatedAt: Date.now(),
      });

      await db.docProperties.bulkPut([
        { docId, propId: 'prop-task-status', value: 'Todo' },
        { docId, propId: 'prop-task-duedate', value: newTaskDate },
        { docId, propId: 'prop-task-priority', value: newTaskPriority },
      ]);

      setIsNewTaskModalOpen(false);
      setNewTaskTitle('');
      setRefreshTrigger((prev) => prev + 1);
      toast.success(`Scheduled Task for ${newTaskDate}`);
    } catch {
      toast.error('Failed to create planned task.');
    }
  };

  // ================================================
  // 5. Date-range Deadline Shifter Interaction
  // ================================================
  const handleShiftDeadlines = async () => {
    if (!shiftStartDate || !shiftEndDate) {
      toast.error('Please specify both start and end boundary dates.');
      return;
    }

    try {
      let shiftCount = 0;

      for (const task of objectTasks) {
        if (task.duedate && task.duedate >= shiftStartDate && task.duedate <= shiftEndDate) {
          // Parse date
          const dateObj = new Date(task.duedate);
          if (isNaN(dateObj.getTime())) continue;

          // Apply addition/subtraction days offset
          dateObj.setDate(dateObj.getDate() + Number(shiftDaysOffset));
          const updatedDateStr = dateObj.toISOString().split('T')[0];

          // Determine property ID to target
          const propId = task.typeId === 'task' ? 'prop-task-duedate' : 'prop-proj-duedate';

          // Update Dexie KV docProperties table
          await db.docProperties.put({
            docId: task.id,
            propId,
            value: updatedDateStr,
          });

          shiftCount++;
        }
      }

      setRefreshTrigger((prev) => prev + 1);
      toast.success(
        `Deadline shift complete: updated ${shiftCount} records by ${shiftDaysOffset} day(s)!`
      );
    } catch {
      toast.error('An error occurred during relational deadline shifting.');
    }
  };

  // ================================================
  // 6. 'Daily Journal' Builder Feature
  // ================================================
  const handleGenerateDailyJournal = async () => {
    try {
      // Formatted title: "Daily Journal: 2026-06-05"
      const dateHoyStr = new Date().toISOString().split('T')[0];
      const humanReadableHoy = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

      // Filter unfinished items
      const incompleteObjectTasks = objectTasks.filter((t) => t.status !== 'Completed');
      const incompleteInlineTasks = inlineTasks.filter((t) => !t.completed);

      // Generate structured reflection templates
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

      // Save Daily Journal document into database
      await db.documents.put({
        id: docId,
        typeId: 'note', // Assigned to seeded 'note' ObjectType!
        title: `Daily Journal: ${dateHoyStr}`,
        content: journalBody,
        badge: 'Journal',
        badgeClass: 'tag-badge-blue',
        updatedAt: Date.now(),
      });

      toast.success('Successfully generated Daily Journal. Opening editor...');

      // Redirect to main Editor page loading the new journal!
      setMainWikiId(docId);
      setActivePage('editor');
    } catch (err) {
      toast.error('Failed to construct daily journal workspace draft.');
      console.error(err);
    }
  };

  // ================================================
  // 7. Drag & Drop Support
  // ================================================
  const handleDragStart = (
    e: React.DragEvent,
    payload: { type: string; docId: string; taskText?: string }
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(payload));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
        // Rewrite the inline date string
        const doc = await db.documents.get(payload.docId);
        if (!doc) return;

        const lines = doc.content.split('\n');
        const updatedLines = lines.map((line) => {
          if (line.includes(payload.taskText!)) {
            // Remove existing @date and insert new
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

      setRefreshTrigger((prev) => prev + 1);
    } catch {
      toast.error('Drag scheduling failed.');
    }
  };

  // Grouped lists calculator
  const groupedTasksMap = useMemo(() => {
    const map: Record<string, { objects: ObjectTask[]; inlines: InlineTask[] }> = {
      Overdue: { objects: [], inlines: [] },
      Today: { objects: [], inlines: [] },
      Upcoming: { objects: [], inlines: [] },
      'No Date': { objects: [], inlines: [] },
    };

    const todayStr = new Date().toISOString().split('T')[0];

    // Filter by search
    const fitObj = objectTasks.filter((t) => {
      const matchS = t.title.toLowerCase().includes(taskSearch.toLowerCase());
      if (!showCompleted && t.status === 'Completed') return false;
      return matchS;
    });

    const fitInl = inlineTasks.filter((t) => {
      const matchS = t.text.toLowerCase().includes(taskSearch.toLowerCase());
      if (!showCompleted && t.completed) return false;
      return matchS;
    });

    // Object categorized mapper
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

    // Inline categorized mapper
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
  }, [objectTasks, inlineTasks, taskSearch, showCompleted]);

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

  return (
    <div className="flex-1 flex flex-col space-y-6 h-full min-h-0 select-none font-sys">
      {/* Title & Stats HUD Header */}
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
            onClick={handleGenerateDailyJournal}
            className="flex items-center gap-2 px-4 py-2 bg-[#1c1c1a] hover:bg-neutral-800 text-white font-bold text-xs rounded transition-all cursor-pointer shadow-md"
          >
            <Notebook className="w-3.5 h-3.5" />
            <span>Generate Daily Journal</span>
          </button>

          {/* Toggle between Calendar Grid and Kanban Columns */}
          <div className="flex items-center gap-1 border border-neutral-200 bg-neutral-100/60 p-1">
            <button
              onClick={() => setViewMode('calendar')}
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
              onClick={() => setViewMode('kanban')}
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

      {/* Date Deadline Shift Interaction Panel */}
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
              onChange={(e) => setShiftStartDate(e.target.value)}
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
              onChange={(e) => setShiftEndDate(e.target.value)}
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
              onChange={(e) => setShiftDaysOffset(parseInt(e.target.value) || 0)}
              className="w-full bg-white border border-neutral-200 px-3 py-1.5 text-xs outline-none focus:border-neutral-400 font-mono"
              placeholder="+2 or -3"
            />
          </div>
          <button
            onClick={handleShiftDeadlines}
            className="w-full h-9 flex items-center justify-center gap-1.5 px-3 bg-neutral-900 text-white font-bold text-xs hover:bg-neutral-800 transition-colors cursor-pointer rounded-none border-none"
          >
            <span>Shift Deadlines</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Primary Layout Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start min-h-0 flex-1">
        {/* Left Interactive Workspace (SPAN 8) */}
        <div className="lg:col-span-8">
          {viewMode === 'calendar' ? (
            /* Monthly Calendar Block */
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
                    onClick={handlePrevMonth}
                    className="spring-click p-1 hover:text-black text-neutral-400 cursor-pointer border-none bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="spring-click px-2.5 py-1 font-mono text-[9px] font-bold text-neutral-500 hover:text-black cursor-pointer border-none bg-transparent"
                  >
                    TODAY
                  </button>
                  <button
                    onClick={handleNextMonth}
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
                      onDrop={(e) => handleDropOnDate(e, formattedDate)}
                      onClick={() => {
                        setNewTaskDate(formattedDate);
                        setIsNewTaskModalOpen(true);
                      }}
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
                                setMainWikiId(evt.docId);
                                setActivePage('editor');
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
          ) : (
            /* Columns list Kanban mode */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {['Todo', 'In Progress', 'Completed'].map((columnName) => {
                const columnObjects = objectTasks.filter((t) => t.status === columnName);

                // Maps inline items to Todo or Completed
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
                          onClick={() => {
                            setMainWikiId(task.id);
                            setActivePage('editor');
                          }}
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
                              onClick={() => toggleInlineTask(task)}
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
          )}
        </div>

        {/* Right Task Ledger list panel (SPAN 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Scheduler input element */}
          <div className="glass-panel p-5 border border-neutral-200 bg-white">
            <h4 className="font-mono text-[10px] uppercase tracking-wide font-extrabold text-neutral-500 mb-3 block">
              Quick Event Adder
            </h4>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. Proof Heine-Borel theorem @2026-06-12 !High"
                value={quickAddText}
                onChange={(e) => setQuickAddText(e.target.value)}
                className="w-full bg-white border border-neutral-200 px-3 py-2 text-xs outline-none focus:border-neutral-400 transition-colors rounded-none"
              />
              <p className="text-[10px] text-neutral-400 leading-normal font-mono">
                Support natural syntax patterns like{' '}
                <strong className="text-neutral-500">@YYYY-MM-DD</strong> and{' '}
                <strong className="text-neutral-500">!High/!Low</strong> parameters.
              </p>
              <button
                type="submit"
                className="w-full h-8 flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-bold text-xs cursor-pointer border-none transition-colors"
              >
                <span>Add Task Event</span>
              </button>
            </form>
          </div>

          {/* Active Ledger List */}
          <div className="glass-panel p-5 border border-neutral-200 bg-white">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3 mb-4">
              <h4 className="font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-500">
                Active Goals Index
              </h4>
              <button
                onClick={() => setShowCompleted(!showCompleted)}
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
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Filter search list..."
                className="w-full bg-white border border-neutral-200 pl-8 pr-3 py-1.8 text-xs outline-none focus:border-neutral-400"
              />
            </div>

            {/* Render Category sorted ledgers */}
            <div className="space-y-4 max-h-[460px] overflow-y-auto custom-scrollbar pr-1">
              {Object.keys(groupedTasksMap).every(
                (g) =>
                  groupedTasksMap[g].objects.length === 0 && groupedTasksMap[g].inlines.length === 0
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
                                handleDragStart(e, {
                                  type:
                                    task.typeId === 'project'
                                      ? 'relation-project'
                                      : 'relation-task',
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
                                    toggleObjectTask(task);
                                  }}
                                  className="spring-click mt-0.5 shrink-0 text-neutral-400 hover:text-black border-none bg-transparent cursor-pointer"
                                >
                                  {isDone ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                                <div
                                  className="min-w-0"
                                  onClick={() => {
                                    setMainWikiId(task.id);
                                    setActivePage('editor');
                                  }}
                                >
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
                                onClick={() => deleteObjectTask(task.id)}
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
                                handleDragStart(e, {
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
                                onClick={() => toggleInlineTask(task)}
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
        </div>
      </div>

      {/* Structured Calendar Event Entry Dialog Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[var(--z-command)] p-4">
          <div className="bg-white border border-neutral-300 w-full max-w-md p-6 shadow-2xl space-y-5 rounded-none">
            <div className="flex items-center justify-between">
              <h3 className="font-sys text-base font-bold text-[#1c1c1a] uppercase tracking-wider">
                Schedule Event
              </h3>
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="font-mono text-xs text-neutral-400 hover:text-black cursor-pointer border-none bg-transparent"
              >
                [ESC]
              </button>
            </div>

            <div className="space-y-4 font-sys">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                  Task Title
                </label>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Gather final Heine-Borel counterexamples"
                  className="w-full bg-white border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 transition-colors rounded-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full bg-white border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 transition-colors rounded-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full bg-white border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 transition-colors rounded-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewTaskModalOpen(false)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-sys text-xs font-bold rounded-none border-none cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTaskFromCalendar}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-sys text-xs font-bold rounded-none border-none cursor-pointer"
              >
                Schedule Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
