/* ================================================
   FILE: src/components/Breadcrumbs.tsx
   ================================================ */
import { FileText, Home, Folder, ChevronDown, ListFilter } from 'lucide-react';
import { useUiStore } from '@/stores/app-store';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/db/dexie';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function Breadcrumbs() {
  const activePage = useUiStore((state) => state.activePage);
  const activeProjectTab = useUiStore((state) => state.activeProjectTab);
  const setActivePage = useUiStore((state) => state.setActivePage);
  const setActiveProjectTab = useUiStore((state) => state.setActiveProjectTab);
  const mainWikiId = useUiStore((state) => state.mainWikiId);
  const setMainWikiId = useUiStore((state) => state.setMainWikiId);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load documents for context switching dropdown
  const documents = useLiveQuery(() => db.documents.toArray(), []) || [];
  const currentDoc = documents.find((d) => d.id === mainWikiId);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleNavigateHome = () => {
    setActiveProjectTab('kanban');
    setActivePage('project');
  };

  const handleNavigateToTab = (tab: string) => {
    setActiveProjectTab(tab);
    setActivePage('project');
  };

  const handleSwitchDoc = (docId: string) => {
    setMainWikiId(docId);
    setActivePage('editor');
    setIsDropdownOpen(false);
  };

  return (
    <div className="flex items-center gap-1.5 font-sys text-[11px] uppercase tracking-wider text-neutral-400 font-medium">
      {/* Root Node */}
      <button
        onClick={handleNavigateHome}
        className="flex items-center gap-1 hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent py-1 px-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
        title="Go to Project Hub"
      >
        <Home className="w-3 h-3 text-neutral-400" />
        <span>Space</span>
      </button>

      <span className="text-neutral-300 font-serif italic select-none">/</span>

      {activePage === 'project' ? (
        <>
          {/* Project Hub Segment */}
          <button
            onClick={() => handleNavigateToTab('kanban')}
            className="hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent py-1 px-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 font-semibold text-neutral-500"
          >
            <Folder className="w-3 h-3 text-neutral-400" />
            <span>Project Hub</span>
          </button>

          <span className="text-neutral-300 font-serif italic select-none">/</span>

          {/* Perspective tab */}
          <span className="text-neutral-800 dark:text-neutral-200 font-bold py-1 px-1.5 bg-neutral-100 dark:bg-neutral-800 rounded font-mono">
            {activeProjectTab === 'kanban' ? 'Ledger' : activeProjectTab}
          </span>
        </>
      ) : (
        <>
          {/* Focus Editor segment */}
          <button
            onClick={() => {
              setActivePage('editor');
            }}
            className="hover:text-black dark:hover:text-white transition-colors cursor-pointer border-none bg-transparent py-1 px-1.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-1 text-neutral-500"
          >
            <FileText className="w-3 h-3 text-neutral-400" />
            <span>Documents</span>
          </button>

          <span className="text-neutral-300 font-serif italic select-none">/</span>

          {/* Active document node selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1 text-neutral-800 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold py-1 px-2 rounded border border-neutral-200/50 dark:border-neutral-700 transition-colors cursor-pointer"
            >
              <span className="truncate max-w-[140px] text-neutral-900 dark:text-white normal-case">
                {currentDoc ? currentDoc.title : 'Untitled Wiki'}
              </span>
              <ChevronDown className="w-3 h-3 text-neutral-400" />
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute left-0 mt-1 w-56 max-h-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl overflow-hidden py-1.5 z-50 text-left normal-case cursor-default"
                >
                  <div className="px-3 py-1.5 text-[9px] uppercase tracking-widest text-neutral-400 font-mono border-b border-neutral-100 dark:border-neutral-800 font-bold flex items-center justify-between">
                    <span>Jump to Document</span>
                    <ListFilter className="w-3 h-3" />
                  </div>
                  <div className="overflow-y-auto max-h-56 py-1 scrollbar-thin">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleSwitchDoc(doc.id)}
                        className={`w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs transition-colors cursor-pointer border-none bg-transparent ${
                          doc.id === mainWikiId
                            ? 'bg-neutral-50 dark:bg-neutral-800/80 font-bold text-bh-red'
                            : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <FileText className="w-3 h-3 shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                    {documents.length === 0 && (
                      <div className="px-3 py-4 text-xs text-center text-neutral-400 font-mono">
                        No documents found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
}
