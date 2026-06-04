/* ================================================
   FILE: src/components/ProjectPage.tsx
   ================================================ */
import React, { useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Link2, Sparkles, Database, FileText, Clock } from "lucide-react";

// ------------------------------------------------------------------
// 1. Types & Data
// ------------------------------------------------------------------
interface PipelineCard {
  id: string;
  refId: string;
  title: string;
  excerpt: string;
  links: number;
  words: number;
  timestamp: string;
  colorClass: string;
}

interface DraggableCardProps {
  card: PipelineCard;
  key?: React.Key;
}

interface DraggableItemProps {
  card: PipelineCard;
  isTerminal: boolean;
  key?: React.Key; // ⚡ 显式声明可选属性 key，消除 TS 参数分配报错 2322
}

const INITIAL_DATA: Record<string, PipelineCard[]> = {
  'fleeting': [
    { id: 'c1', refId: 'Z-01', title: 'Heine–Borel origins', excerpt: 'Generalizing closed and bounded interval limits to general topology...', links: 3, words: 142, timestamp: '10:42 AM', colorClass: 'bg-[var(--bh-yellow)]' },
    { id: 'c2', refId: 'Z-02', title: 'Non-Hausdorff products', excerpt: 'Infinite products that violate separate neighborhood separation constraints...', links: 1, words: 89, timestamp: 'YESTERDAY', colorClass: 'bg-[var(--bh-yellow)]' }
  ],
  'seedling': [
    { id: 'c3', refId: 'Z-03', title: 'Compactness ↔ sequential', excerpt: 'Equivalence thresholds in metric spaces and sequential subcovers...', links: 4, words: 340, timestamp: 'MAY 18', colorClass: 'bg-[var(--bh-blue)]' }
  ],
  'evergreen': [
    { id: 'c4', refId: 'Z-04', title: 'Lemma 2.4: finite subcover', excerpt: 'Deep proof structure of nested spaces using axiom properties. Relies heavily on the choice function mapping.', links: 8, words: 1205, timestamp: 'MAY 12', colorClass: 'bg-[var(--bh-red)]' }
  ],
  'synthesis': []
};

// ------------------------------------------------------------------
// 2. Card Renderers (Two distinct visual states)
// ------------------------------------------------------------------

// State A: Academic Index Card (Used in columns 1-3)
function IndexCard({ card, isDragging }: { card: PipelineCard; isDragging?: boolean }) {
  return (
    <div className={`p-4 border-b border-neutral-200/70 bg-white transition-all duration-200 cursor-grab group
      ${isDragging ? 'shadow-2xl ring-1 ring-black/10 opacity-95 scale-[1.02] rotate-1 z-50' : 'hover:bg-neutral-50'}`}>
      
      <div className="flex justify-between items-center mb-2.5">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${card.colorClass}`}></div>
          <span className="font-mono text-[10px] font-bold text-neutral-500 tracking-wider">{card.refId}</span>
        </div>
        <span className="font-mono text-[9px] text-neutral-400 tracking-widest uppercase">{card.timestamp}</span>
      </div>
      
      <h4 className="font-sys text-sm font-bold text-black mb-1.5 leading-snug group-hover:text-[var(--bh-blue)] transition-colors">{card.title}</h4>
      <p className="font-human text-[13px] text-neutral-500 line-clamp-2 leading-relaxed mb-3">{card.excerpt}</p>
      
      <div className="flex items-center gap-4 font-mono text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
        <span className="flex items-center gap-1.5"><Link2 className="w-3 h-3 text-[var(--bh-red)]" /> {card.links}</span>
        <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-[var(--bh-blue)]" /> {card.words}</span>
      </div>
    </div>
  );
}

// State B: Manuscript Paragraph (Used in column 4 - Synthesis)
function ManuscriptBlock({ card, isDragging }: { card: PipelineCard; isDragging?: boolean }) {
  return (
    <div className={`px-5 py-6 border-b border-neutral-200/50 bg-[var(--bg-canvas)] transition-all cursor-grab relative
      ${isDragging ? 'shadow-xl opacity-90 scale-[1.01] z-50' : 'hover:bg-white'}`}>
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--bh-green)] opacity-50"></div>
      
      <div className="font-mono text-[9px] text-[var(--bh-green)] font-bold tracking-widest uppercase mb-3 flex items-center gap-2">
        <span>§ Compiled / {card.refId}</span>
      </div>
      
      <h4 className="font-human text-xl font-bold text-black mb-2">{card.title}</h4>
      <p className="font-human text-[14.5px] text-neutral-700 leading-relaxed">{card.excerpt}</p>
    </div>
  );
}

// ------------------------------------------------------------------
// 3. Draggable Wrapper
// ------------------------------------------------------------------
function DraggableItem({ card, isTerminal }: DraggableItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: card.id });
  
  const style: React.CSSProperties = {
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    position: isDragging ? 'relative' : 'static',
    zIndex: isDragging ? 999 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes} className="outline-none">
      {isTerminal ? <ManuscriptBlock card={card} isDragging={isDragging} /> : <IndexCard card={card} isDragging={isDragging} />}
    </div>
  );
}

// ------------------------------------------------------------------
// 4. Droppable Ledger Column
// ------------------------------------------------------------------
function LedgerColumn({ id, title, index, cards, isTerminal }: { id: string; title: string; index: string; cards: PipelineCard[]; isTerminal?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className={`flex flex-col h-full border-r border-neutral-200 last:border-r-0 transition-colors duration-300
      ${isTerminal ? 'bg-[var(--bg-canvas)]' : 'bg-white'}
      ${isOver ? (isTerminal ? 'bg-[var(--bh-green)]/5' : 'bg-neutral-50') : ''}
    `}>
      {/* Strict Ledger Header */}
      <div className="p-4 border-b border-neutral-200 bg-neutral-50/50 flex flex-col gap-1 shrink-0">
        <span className="font-mono text-[10px] text-neutral-400 font-bold">{index}</span>
        <div className="flex items-center justify-between">
          <span className="font-sys text-xs font-bold uppercase tracking-widest text-black">{title}</span>
          <span className="font-mono text-[9px] bg-black/5 px-1.5 py-0.5 rounded text-neutral-500 font-bold">{cards.length}</span>
        </div>
      </div>
      
      {/* Scrollable Ledger Body */}
      <div ref={setNodeRef} className="flex-1 overflow-y-auto scroll-hide">
        {cards.map(card => (
          <DraggableItem key={card.id} card={card} isTerminal={!!isTerminal} />
        ))}
        {cards.length === 0 && (
          <div className="h-full flex items-center justify-center text-neutral-300 font-mono text-[10px] uppercase tracking-widest">
            [ Empty ]
          </div>
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// 5. Main Page Component
// ------------------------------------------------------------------
export function ProjectPage({ openPage }: { openPage: (p: string) => void }) {
  const [activeTab, setActiveTab] = useState("kanban");
  const [kanbanData, setKanbanData] = useState<Record<string, PipelineCard[]>>(INITIAL_DATA);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const destColId = over.id as string;

    setKanbanData(prev => {
      const next = { ...prev };
      let foundCard: PipelineCard | null = null;

      Object.keys(next).forEach(colId => {
        const index = next[colId].findIndex(c => c.id === cardId);
        if (index !== -1) {
          foundCard = next[colId][index];
          next[colId] = next[colId].filter(c => c.id !== cardId);
        }
      });

      if (foundCard) {
        next[destColId] = [...next[destColId], foundCard];
        
        // 触发 Manuscript 动态合成反馈
        if (destColId === 'synthesis') {
          setIsSynthesizing(true);
          setTimeout(() => setIsSynthesizing(false), 2000);
        }
      }
      return next;
    });
  };

  return (
    <div className="page-panel flex-1 flex flex-col h-full overflow-hidden">
      {/* 顶部导航 */}
      <header className="h-20 flex items-center justify-between px-8 shrink-0 z-10 bg-transparent">
        <div className="flex items-center gap-4">
          <div className="font-sys text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] flex items-center gap-2">
            <span>Space</span>
            <span className="font-serif italic text-sm opacity-50">/</span>
            <span className="text-[var(--text-main)] font-semibold">Topology Math</span>
          </div>
        </div>
        <div className="flex items-center gap-1 p-1 bg-white/30 backdrop-blur-md border border-black/5">
          {["changelog", "timeline", "kanban", "gallery"].map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)} 
              className={`spring-click px-4 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-none border-none cursor-pointer ${activeTab === tab ? 'text-black bg-white/60 shadow-sm' : 'text-[var(--text-muted)] hover:text-black hover-ui'}`}
            >
              {tab === 'kanban' ? 'Ledger' : tab}
            </button>
          ))}
        </div>
      </header>

      {/* 主内容区 */}
      <div className="flex-1 overflow-y-auto p-8 scroll-hide">
        <div className="max-w-[1400px] mx-auto h-full flex flex-col space-y-8">

          {/* 全新 Bauhaus 档案录 (Library Ledger) Pipeline 视图 */}
          {activeTab === 'kanban' && (
            <div className="flex-1 flex flex-col animate-[pane-slide_0.25s_cubic-bezier(0.22,1,0.36,1)_forwards]">
              <div className="flex items-end justify-between mb-6 shrink-0">
                <div>
                  <h2 className="font-human text-4xl font-normal tracking-tight">Zettelkasten Ledger</h2>
                  <p className="text-[var(--text-muted)] font-sys text-sm mt-2 flex items-center gap-2">
                    <Database className="w-4 h-4" /> Structured progression from isolated notes to contiguous manuscript.
                  </p>
                </div>
                
                {/* 熔炉反馈指示器 */}
                <div className={`px-4 py-2 flex items-center gap-3 border transition-all duration-500
                  ${isSynthesizing ? 'bg-[var(--bh-green)]/10 border-[var(--bh-green)]/30 text-[var(--bh-green)]' : 'bg-white border-neutral-200 text-neutral-400'}`}>
                  <Sparkles className={`w-4 h-4 ${isSynthesizing ? 'animate-spin' : ''}`} />
                  <span className="font-mono text-[10px] uppercase tracking-widest font-bold">
                    {isSynthesizing ? 'Compiling Manuscript...' : 'System Ready'}
                  </span>
                </div>
              </div>

              {/* 严格的网格档案容器 */}
              <div className="flex-1 border border-neutral-200 shadow-sm bg-white overflow-hidden min-h-[600px]">
                <DndContext onDragEnd={handleDragEnd}>
                  <div className="grid grid-cols-1 md:grid-cols-4 h-full">
                    <LedgerColumn id="fleeting" index="01" title="Fleeting" cards={kanbanData.fleeting} />
                    <LedgerColumn id="seedling" index="02" title="Seedling" cards={kanbanData.seedling} />
                    <LedgerColumn id="evergreen" index="03" title="Evergreen" cards={kanbanData.evergreen} />
                    <LedgerColumn id="synthesis" index="04 // Terminal" title="Synthesis" cards={kanbanData.synthesis} isTerminal />
                  </div>
                </DndContext>
              </div>
            </div>
          )}

          {/* Changelog 视图 */}
          {activeTab === 'changelog' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Conceptual Changelog</h2>
                <p className="text-[var(--text-muted)] font-sys text-sm mt-2">A sequence of breakthroughs and axiomatic updates.</p>
              </div>
              <div className="glass-panel p-8 relative rounded-none border border-white/50 mt-8 overflow-hidden">
                <div className="absolute top-[48px] left-8 right-8 h-[1px] bg-black/10"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                  <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
                    <div className="absolute top-[-3px] left-0 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 border border-black bg-[var(--bg-canvas)] group-hover:bg-black transition-colors duration-[800ms]"></div>
                      <div className="w-[1px] h-6 bg-black/20"></div>
                    </div>
                    <div className="font-mono text-[11px] text-neutral-400">APR 05</div>
                    <div className="brutal-card p-5 border border-white">
                      <span className="tag-badge tag-badge-yellow mb-2">Stage I</span>
                      <h4 className="font-human text-lg font-bold mb-1">Conjecture</h4>
                      <p className="font-sys text-xs text-neutral-600 leading-relaxed">Formulated the first draft of compactness equivalence in metric environments.</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
                    <div className="absolute top-[-3px] left-0 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 border-2 border-black bg-[var(--bg-canvas)] group-hover:bg-black transition-colors duration-[800ms]"></div>
                      <div className="w-[1px] h-6 bg-black/20"></div>
                    </div>
                    <div className="font-mono text-[11px] text-neutral-400">MAY 17</div>
                    <div className="brutal-card p-5 border border-white">
                      <span className="tag-badge tag-badge-blue mb-2">Stage II</span>
                      <h4 className="font-human text-lg font-bold mb-1">Contradiction</h4>
                      <p className="font-sys text-xs text-neutral-600 leading-relaxed">Discovered a critical counterexample regarding non-Hausdorff infinite products.</p>
                    </div>
                  </div>
                  <div className="space-y-4 pt-10 relative group cursor-pointer changelog-node">
                    <div className="absolute top-[-3px] left-0 flex flex-col items-center">
                      <div className="w-2.5 h-2.5 bg-[var(--bh-red)] border border-white shadow-sm"></div>
                      <div className="w-[1px] h-6 bg-[var(--bh-red)]"></div>
                    </div>
                    <div className="font-mono text-[11px] text-[var(--bh-red)] font-bold">JUN 03</div>
                    <div className="brutal-card p-5 bg-white border-t-2 border-t-[var(--bh-red)]">
                      <span className="tag-badge tag-badge-red mb-2">Current</span>
                      <h4 className="font-human text-lg font-bold mb-1">Axiomatic Pivot</h4>
                      <p className="font-sys text-xs text-black leading-relaxed">Restricted the domain using ZFC axioms. Proof is now fully self-consistent.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Gantt Timeline 视图 */}
          {activeTab === 'timeline' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Lines of Research</h2>
                <p className="text-[var(--text-muted)] font-sys text-sm mt-2">Gantt tracks of active research directions and papers.</p>
              </div>
              <div className="glass-panel p-6 rounded-none border border-white/50 overflow-x-auto">
                <div className="grid grid-cols-6 text-[11px] font-mono text-neutral-400 border-b border-black/10 pb-3 mb-6 tracking-widest uppercase">
                  <div>APR 05</div><div>APR 19</div><div>MAY 03</div><div>MAY 17</div><div>JUN 07</div><div>JUN 21</div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-6 items-center gap-4 gantt-item">
                    <div className="col-span-2 font-bold text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full dot-blue"></span> Topology Foundations</div>
                    <div className="col-span-3 col-start-3 brutal-card p-3 flex justify-between border border-white">
                      <span className="text-[11px] font-mono uppercase text-gray-500">Axiomatic Setup</span>
                      <span className="text-[11px] text-[var(--bh-red)] font-bold">◆ Public Beta</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 items-center gap-4 gantt-item">
                    <div className="col-span-2 font-bold text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full dot-green"></span> Heine–Borel Ext.</div>
                    <div className="col-span-2 col-start-4 brutal-card p-3 flex justify-between border border-white">
                      <span className="text-[11px] font-mono uppercase text-gray-500">Euclidean Map</span>
                      <span className="text-[11px] text-[var(--bh-green)] font-bold">◇ Unify</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="page-panel space-y-8 pane-active">
              <div>
                <h2 className="font-human text-4xl font-normal tracking-tight">Knowledge Base</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
                <div onClick={() => openPage("editor")} className="brutal-card card-theorem p-6 flex flex-col justify-between group rounded-none">
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/5">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--bh-blue)] font-bold">Zettelkasten</span>
                    <span className="tag-badge tag-badge-blue">Active</span>
                  </div>
                  <div className="py-2">
                    <h3 className="font-sys text-xl font-bold leading-snug group-hover:text-[var(--bh-blue)] transition-colors mb-2">Compactness in Spaces</h3>
                    <p className="font-sys text-xs text-neutral-500 leading-relaxed line-clamp-3">
                      A space is compact if every open cover has a finite subcover...
                    </p>
                  </div>
                </div>
                
                <div className="brutal-card col-span-1 md:col-span-2 p-6 flex flex-col justify-between relative overflow-hidden rounded-none">
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-[var(--bh-yellow)] opacity-10 rounded-full blur-2xl"></div>
                  <div className="flex items-center justify-between pb-3">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--bh-yellow)] font-bold">Thought</span>
                  </div>
                  <p className="font-human text-2xl text-neutral-800 italic leading-relaxed my-4 relative z-10">
                    "Productivity is not about getting more things done. It is about having a quiet room to think."
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}