/* ================================================
   FILE: src/pages/schedule/NewTaskModal.tsx
   ================================================ */
import { useActionState } from 'react';
// @ts-ignore - useFormStatus is available in React 19 runtime
import { useFormStatus } from 'react';
import { db } from '@/db/dexie';
import { toast } from 'sonner';

interface ActionState {
  error: string | null;
  success: boolean;
}

async function createTaskAction(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const title = formData.get('title') as string;
  const date = formData.get('date') as string;
  const priority = formData.get('priority') as string;

  if (!title.trim()) {
    return { error: 'Title is required', success: false };
  }

  try {
    const docId = `task-${Date.now().toString().slice(-6)}`;
    await db.documents.add({
      id: docId,
      typeId: 'task',
      title,
      content: `# ${title}\n\nTask scheduled on date ${date}.\n\n- [ ] Draft goal scope`,
      badge: 'Task',
      badgeClass: 'tag-badge-yellow',
      updatedAt: Date.now(),
    });

    await db.docProperties.bulkPut([
      { docId, propId: 'prop-task-status', value: 'Todo' },
      { docId, propId: 'prop-task-duedate', value: date },
      { docId, propId: 'prop-task-priority', value: priority },
    ]);

    toast.success(`Scheduled Task for ${date}`);
    return { success: true, error: null };
  } catch (err) {
    console.error(err);
    return { error: 'Failed to create task', success: false };
  }
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-sys text-xs font-bold rounded-none border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Creating...' : 'Schedule Task'}
    </button>
  );
}

interface NewTaskModalProps {
  isOpen: boolean;
  defaultDate?: string;
  onClose: () => void;
  onTaskCreated: () => void;
}

export function NewTaskModal({ isOpen, defaultDate, onClose, onTaskCreated }: NewTaskModalProps) {
  const [state, formAction] = useActionState(createTaskAction, { success: false, error: null });

  if (!isOpen) return null;

  const handleSubmit = () => {
    onClose();
    if (state.success) {
      onTaskCreated();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-center justify-center z-[var(--z-command)] p-4">
      <div className="bg-white border border-neutral-300 w-full max-w-md p-6 shadow-2xl space-y-5 rounded-none">
        <div className="flex items-center justify-between">
          <h3 className="font-sys text-base font-bold text-[#1c1c1a] uppercase tracking-wider">
            Schedule Event
          </h3>
          <button
            onClick={onClose}
            className="font-mono text-xs text-neutral-400 hover:text-black cursor-pointer border-none bg-transparent"
          >
            [ESC]
          </button>
        </div>

        <form action={formAction} onSubmit={handleSubmit} className="space-y-4 font-sys">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
              Task Title
            </label>
            <input
              type="text"
              name="title"
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
                name="date"
                defaultValue={defaultDate}
                className="w-full bg-white border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 transition-colors rounded-none font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1.5">
                Priority
              </label>
              <select
                name="priority"
                defaultValue="Medium"
                className="w-full bg-white border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400 transition-colors rounded-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          {state.error && <p className="text-xs text-red-500 font-bold">{state.error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-sys text-xs font-bold rounded-none border-none cursor-pointer"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
