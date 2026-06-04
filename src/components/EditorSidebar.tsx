/* ================================================
   FILE: src/components/EditorSidebar.tsx
   ================================================ */
import { useEffect, useState } from 'react';
import { Maximize2, GitMerge, ArrowRight, Zap } from 'lucide-react';
import type { EditorSidebarProps } from '../types';

export function EditorSidebar({ isZenMode, activeTab, onTabChange, setStatus, documentText }: EditorSidebarProps) {
  const [nodes, setNodes] = useState([
    { id: 'compactness', label: 'Compact', color: 'var(--bh-red)', size: 12, x: 140, y: 75, active: true, pulse: false },
    { id: 'heine-borel', label: 'H-B', color: 'var(--bh-blue)', size: 9, x: 70, y: 35, active: true, pulse: false },
    { id: 'tychonoff', label: 'Tychonoff', color: 'var(--bh-yellow)', size: 9, x: 210, y: 35, active: true, pulse: false },
  ]);

  useEffect(() => {
    if (!documentText) return;
    
    const containsChoice = documentText.includes('Axiom of Choice') || documentText.includes('choice');
    
    if (containsChoice && !nodes.some(n => n.id === 'axiom-of-choice')) {
      setNodes(prev => [
        ...prev,
        { id: 'axiom-of-choice', label: 'Axiom Choice', color: 'var(--bh-green)', size: 9, x: 140, y: 135, active: true, pulse: true }
      ]);
      setStatus('Graph Network: Axiom of Choice mapped!');
    }
  }, [documentText, nodes, setStatus]);

  return (
    <aside 
      id="editor-context-panel" 
      className={`absolute left-full top-0 ml-16 w-80 flex flex-col transition-all duration-500 ${
        isZenMode ? "opacity-0 pointer-events-none translate-x-12" : "opacity-100 translate-x-0"
      }`}
    >
      {activeTab === 'context' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <div className="sidebar-label text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3 px-1">Structure</div>
            <div className="font-mono text-[11.5px] space-y-2 leading-relaxed">
              <div className="flex items-center gap-2 text-[var(--text-muted)] hover:text-black cursor-pointer group">
                <span className="group-hover:text-[var(--bh-red)] transition-colors">⊤</span> General Topology
              </div>
              <div className="flex items-center gap-2 text-black font-semibold ml-4">
                <span className="text-[var(--bh-red)] font-bold">·</span> Compact Space
              </div>
              <div className="flex items-center gap-2 text-[var(--text-muted)] ml-8 hover:text-black cursor-pointer group">
                <span className="group-hover:text-[var(--bh-blue)] transition-colors">⊢</span> Heine–Borel
              </div>
            </div>
          </div>

          <div>
            <div className="sidebar-label text-[11px] uppercase tracking-[0.15em] text-[var(--text-muted)] mb-3 px-1">Interactive Local Graph</div>
            <div className="h-44 bg-white/30 border border-black/5 relative overflow-hidden group">
              <svg className="absolute inset-0 w-full h-full" stroke="currentColor" strokeWidth="1">
                {nodes.map(node => (
                  node.id !== 'compactness' && (
                    <line 
                      key={`link-${node.id}`}
                      x1="140" y1="75" 
                      x2={node.x} y2={node.y} 
                      className="text-neutral-300"
                    />
                  )
                ))}
                {nodes.map(node => (
                  <g key={node.id} className="cursor-pointer">
                    {node.pulse && (
                      <circle 
                        cx={node.x} cy={node.y} r={node.size + 8} 
                        fill="transparent" stroke={node.color} strokeWidth="1.5"
                        className="animate-ping origin-center"
                      />
                    )}
                    <circle 
                      cx={node.x} cy={node.y} r={node.size} 
                      fill={node.color} className="stroke-white stroke-2 shadow-sm"
                      onClick={() => setStatus(`Active node: ${node.label}`)}
                    />
                    <text 
                      x={node.x} y={node.y + node.size + 12} 
                      textAnchor="middle" 
                      className="font-mono text-[10px] fill-neutral-600 font-medium"
                    >
                      {node.label}
                    </text>
                  </g>
                ))}
              </svg>
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Maximize2 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </div>
            </div>
          </div>

          <div>
            <ul className="space-y-1 font-sys text-xs text-[var(--text-secondary)]">
              <li className="spring-click flex justify-between items-center p-2.5 hover-ui group cursor-pointer" onClick={() => setStatus('Tracing origin…')}>
                <span className="flex items-center gap-2"><GitMerge className="w-4 h-4 opacity-50" /> Trace Origin</span>
                <ArrowRight className="w-3.5 h-3.5 action-icon text-[var(--bh-red)]" />
              </li>
              <li className="spring-click flex justify-between items-center p-2.5 hover-ui group cursor-pointer" onClick={() => setStatus('Finding counterexamples…')}>
                <span className="flex items-center gap-2"><Zap className="w-4 h-4 opacity-50" /> Find Paradox</span>
                <ArrowRight className="w-3.5 h-3.5 action-icon text-[var(--bh-blue)]" />
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-[tab-pane-fade_0.25s_ease-out] font-sys text-xs">
          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--bh-red)] font-bold">Ref. ¶ 1.1 / Line 3</div>
            <p className="prose-reading font-human italic leading-relaxed text-sm">"bridges the intuitive notion of closeness..."</p>
            <p className="prose-reading font-human text-neutral-500 leading-relaxed text-sm">Note: Closeness is modeled strictly via topology neighborhoods, distinct from metric distance bounds.</p>
          </div>
          <div className="w-full h-px bg-neutral-200/50"></div>
          <div className="space-y-2">
            <div className="font-mono text-[11px] uppercase tracking-wider text-[var(--bh-blue)] font-bold">Ref. ¶ 1.2 / Heine–Borel</div>
            <p className="prose-reading font-human italic leading-relaxed text-sm">"Generalizing the Heine–Borel theorem..."</p>
            <p className="prose-reading font-human text-neutral-500 leading-relaxed text-sm">Closed and bounded in general topological vector spaces fails to imply compactness without metric completeness.</p>
          </div>
        </div>
      )}
    </aside>
  );
}