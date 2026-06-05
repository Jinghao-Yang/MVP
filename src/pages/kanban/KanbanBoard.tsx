import { useState } from 'react';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { Database, Sparkles, AlertCircle, X, Layers, Book } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { LedgerColumn } from './components/LedgerColumn';
import { useKanbanStore } from '@/stores/kanban-store';
import { toast } from 'sonner';

type ViewMode = 'zettelkasten' | 'books';

export function KanbanBoard() {
  const [viewMode, setViewMode] = useState<ViewMode>('zettelkasten');
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // 1. Reactive live-query to fetch documents and their properties straight from IndexedDB
  const documents = useLiveQuery(() => db.documents.toArray(), []);
  const docProps = useLiveQuery(() => db.docProperties.toArray(), []);

  const error = useKanbanStore((state) => state.error);
  const clearError = useKanbanStore((state) => state.clearError);

  const isLoading = documents === undefined || docProps === undefined;

  // Helper helper to convert documents to cards required by UI
  const getCardsForBadge = (badgeNames: string[]) => {
    if (!documents) return [];
    return documents
      .filter(
        (doc) =>
          badgeNames.includes(doc.badge) ||
          (doc.badgeClass === 'tag-badge-yellow' && badgeNames.includes('Fleeting'))
      )
      .map((doc) => ({
        id: doc.id,
        refId: doc.id.toUpperCase().slice(0, 5),
        title: doc.title,
        excerpt: doc.content
          ? doc.content.replace(/[#*`[\]]/g, '').slice(0, 100) + '...'
          : 'Start typing...',
        links: 1,
        words: doc.content ? doc.content.split(/\s+/).filter(Boolean).length : 0,
        timestamp: 'MODIFIED',
        colorClass: doc.badge === 'Evergreen' ? 'bg-bh-green/30' : 'bg-bh-yellow',
      }));
  };

  // Helper helper to convert books to cards grouped by status property
  const getBookCardsForStatus = (statusValue: string) => {
    if (!documents || !docProps) return [];
    // 1. Find all books
    const books = documents.filter((doc) => doc.typeId === 'book');
    const bookIds = books.map((b) => b.id);

    // 2. Filter books matching the target status
    const matchingBookIds = docProps
      .filter(
        (p) =>
          p.propId === 'prop-book-status' && p.value === statusValue && bookIds.includes(p.docId)
      )
      .map((p) => p.docId);

    // Support fallback/Default status for unassigned books
    if (statusValue === 'To Read') {
      const assignedBookIds = docProps
        .filter((p) => p.propId === 'prop-book-status' && bookIds.includes(p.docId))
        .map((p) => p.docId);
      const unassignedBooks = books.filter((b) => !assignedBookIds.includes(b.id));
      matchingBookIds.push(...unassignedBooks.map((b) => b.id));
    }

    return books
      .filter((b) => matchingBookIds.includes(b.id))
      .map((book) => ({
        id: book.id,
        refId: book.id.toUpperCase().slice(0, 5),
        title: book.title,
        excerpt: book.content
          ? book.content.replace(/[#*`[\]]/g, '').slice(0, 100) + '...'
          : 'Book entry...',
        links: 2,
        words: book.content ? book.content.split(/\s+/).filter(Boolean).length : 0,
        timestamp: 'BOOK',
        colorClass: 'bg-bh-blue/20',
      }));
  };

  const fleetingCards =
    viewMode === 'zettelkasten' ? getCardsForBadge(['Fleeting', 'Active Draft']) : [];
  const seedlingCards = viewMode === 'zettelkasten' ? getCardsForBadge(['Seedling']) : [];
  const evergreenCards = viewMode === 'zettelkasten' ? getCardsForBadge(['Evergreen']) : [];
  const synthesisCards =
    viewMode === 'zettelkasten' ? getCardsForBadge(['Synthesis', 'Split']) : [];

  // Book stages
  const bookToReadCards = viewMode === 'books' ? getBookCardsForStatus('To Read') : [];
  const bookReadingCards = viewMode === 'books' ? getBookCardsForStatus('Reading') : [];
  const bookCompletedCards = viewMode === 'books' ? getBookCardsForStatus('Completed') : [];

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const docId = active.id as string;
    const destColId = over.id as string;

    try {
      if (viewMode === 'zettelkasten') {
        // Drag in Zettelkasten: updates general category badges
        let badge = 'Fleeting';
        let badgeClass = 'tag-badge-yellow';

        if (destColId === 'seedling') {
          badge = 'Seedling';
          badgeClass = 'tag-badge-yellow';
        } else if (destColId === 'evergreen') {
          badge = 'Evergreen';
          badgeClass = 'tag-badge-green';
        } else if (destColId === 'synthesis') {
          badge = 'Synthesis';
          badgeClass = 'tag-badge-blue';
        }

        await db.documents.update(docId, { badge, badgeClass });
        toast.success(`Moved document style to ${badge}`);

        if (destColId === 'synthesis') {
          setIsSynthesizing(true);
          setTimeout(() => setIsSynthesizing(false), 2000);
        }
      } else {
        // Drag in Books: updates metadata property values
        let statusValue = 'To Read';
        if (destColId === 'reading') {
          statusValue = 'Reading';
        } else if (destColId === 'completed') {
          statusValue = 'Completed';
        }

        await db.docProperties.put({
          docId,
          propId: 'prop-book-status',
          value: statusValue,
        });
        toast.success(`Book status set to ${statusValue}`);
      }
    } catch {
      toast.error('Failed to rearrange object statuses.');
    }
  };

  return (
    <div className="flex-1 flex flex-col animate-[pane-slide_0.25s_cubic-bezier(0.22,1,0.36,1)_forwards]">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-6 shrink-0 gap-4">
        <div>
          <h2 className="font-human text-4xl font-normal tracking-tight">Active Database Views</h2>
          <p className="text-[var(--text-muted)] font-sys text-sm mt-2 flex items-center gap-2">
            <Database className="w-4 h-4" /> Relational query and metadata aggregation views.
          </p>
        </div>

        {/* View Mode Switcher + Synthesis Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-neutral-100 p-1.5 rounded-xl border border-neutral-200">
            <button
              onClick={() => setViewMode('zettelkasten')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-none cursor-pointer ${
                viewMode === 'zettelkasten'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-black bg-transparent'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Zettelkasten Stages
            </button>
            <button
              onClick={() => setViewMode('books')}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase transition-all flex items-center gap-1.5 border-none cursor-pointer ${
                viewMode === 'books'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-black bg-transparent'
              }`}
            >
              <Book className="w-3.5 h-3.5" />
              Books Status
            </button>
          </div>

          <div
            className={`px-4 py-2 flex items-center gap-3 border transition-all duration-500 rounded-xl
            ${isSynthesizing ? 'bg-bh-green/10 border-bh-green/30 text-bh-green' : 'bg-white border-neutral-200 text-neutral-400'}`}
          >
            <Sparkles className={`w-4 h-4 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
              {isSynthesizing ? 'Compiling Manuscript...' : 'Engine Online'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-toast mb-4" role="alert">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-sys text-sm flex-1">{error}</span>
          <button onClick={clearError} className="p-1 hover:bg-red-100 rounded transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 border border-neutral-200 shadow-sm bg-white overflow-hidden min-h-[500px] flex flex-col rounded-xl">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <div className="loading-spinner w-10 h-10" />
              <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-widest">
                Aggregating Relations...
              </span>
            </div>
          </div>
        ) : (
          <DndContext onDragEnd={handleDragEnd}>
            {viewMode === 'zettelkasten' ? (
              <div className="grid grid-cols-1 md:grid-cols-4 h-full flex-1">
                <LedgerColumn id="fleeting" index="01" title="Fleeting" cards={fleetingCards} />
                <LedgerColumn id="seedling" index="02" title="Seedling" cards={seedlingCards} />
                <LedgerColumn id="evergreen" index="03" title="Evergreen" cards={evergreenCards} />
                <LedgerColumn
                  id="synthesis"
                  index="04 // Terminal"
                  title="Synthesis"
                  cards={synthesisCards}
                  isTerminal
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 h-full flex-1">
                <LedgerColumn
                  id="toread"
                  index="STAGE A"
                  title="To Read / Backlog"
                  cards={bookToReadCards}
                />
                <LedgerColumn
                  id="reading"
                  index="STAGE B"
                  title="Currently Reading"
                  cards={bookReadingCards}
                />
                <LedgerColumn
                  id="completed"
                  index="STAGE C"
                  title="Completed Books"
                  cards={bookCompletedCards}
                  isTerminal
                />
              </div>
            )}
          </DndContext>
        )}
      </div>
    </div>
  );
}
