/* ================================================
   FILE: src/layout/WarningSection.tsx
   ================================================ */
import { AlertTriangle } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  typeId?: string;
}

interface DocProperty {
  docId: string;
  propId: string;
  value: string;
}

interface WarningSectionProps {
  taskAndProjectDocs: Document[] | undefined;
  relevantDocProps: DocProperty[] | undefined;
  onOpenEditor: (docId: string) => void;
}

// Helper to parse due date
const parseDueDate = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
};

// Helper to get days difference
const getDaysDiff = (dateStr: string) => {
  const due = parseDueDate(dateStr);
  if (!due) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export function WarningSection({
  taskAndProjectDocs,
  relevantDocProps,
  onOpenEditor,
}: WarningSectionProps) {
  // List tasks and projects expiring within 1 day
  const expiringItems = (taskAndProjectDocs || []).filter((doc) => {
    if (doc.typeId !== 'task' && doc.typeId !== 'project') return false;

    const propId = doc.typeId === 'task' ? 'prop-task-duedate' : 'prop-proj-duedate';
    const val = relevantDocProps?.find((p) => p.docId === doc.id && p.propId === propId)?.value;
    if (!val) return false;

    const daysDiff = getDaysDiff(val);
    return daysDiff >= 0 && daysDiff <= 1;
  });

  if (expiringItems.length === 0) return null;

  return (
    <div className="p-3 bg-amber-50 border border-amber-200/65 rounded shadow-sm">
      <div className="flex items-center gap-1.5 text-[10px] font-mono text-amber-800 font-bold uppercase tracking-wider mb-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        <span>Expiring ({expiringItems.length})</span>
      </div>
      <div className="space-y-1">
        {expiringItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onOpenEditor(item.id)}
            className="block text-left font-sys text-[10px] text-amber-700 hover:text-amber-900 border-none bg-transparent cursor-pointer truncate font-medium w-full"
            title={item.title}
          >
            ⚠️ {item.title}
          </button>
        ))}
      </div>
    </div>
  );
}
