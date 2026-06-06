/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { db } from '@/db/dexie';

import { useUiStore } from '@/stores';

export function GraphView({ openPage }: { openPage: (p: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const setMainWikiId = useUiStore((state) => state.setMainWikiId);

  useEffect(() => {
    let simulation: d3.Simulation<d3.SimulationNodeDatum, undefined>;

    const initGraph = async () => {
      try {
        setLoading(true);
        const docs = await db.documents.toArray();
        const linksData = await db.links.toArray();

        const nodes = docs.map((d) => ({
          id: d.id,
          title: d.title,
          badge: d.badgeClass || 'tag-badge-blue',
        }));

        const links = linksData.map((l) => ({
          source: l.sourceId,
          target: l.targetId,
        }));

        if (!containerRef.current) return;

        containerRef.current.innerHTML = '';
        const width = containerRef.current.clientWidth;
        const height = 500;

        const svg = d3
          .select(containerRef.current)
          .append('svg')
          .attr('width', width)
          .attr('height', height)
          .attr('viewBox', [0, 0, width, height]);

        const g = svg.append('g');

        const zoom = d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform);
          });

        svg.call(zoom as any);

        simulation = d3
          .forceSimulation(nodes as d3.SimulationNodeDatum[])
          .force(
            'link',
            d3
              .forceLink(links)
              .id((d: any) => d.id)
              .distance(100)
          )
          .force('charge', d3.forceManyBody().strength(-300))
          .force('center', d3.forceCenter(width / 2, height / 2))
          .force('collide', d3.forceCollide().radius(40));

        const link = g
          .append('g')
          .attr('stroke', '#999')
          .attr('stroke-opacity', 0.6)
          .selectAll('line')
          .data(links)
          .join('line')
          .attr('stroke-width', 2);

        const getColor = (badgeClass: string) => {
          if (badgeClass.includes('yellow')) return '#D1A34D';
          if (badgeClass.includes('red')) return '#C55345';
          if (badgeClass.includes('green')) return '#708A74';
          return '#5B7B9A';
        };

        const node = g
          .append('g')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1.5)
          .selectAll('circle')
          .data(nodes)
          .join('circle')
          .attr('r', 8)
          .attr('fill', (d) => getColor(d.badge))
          .call(drag(simulation) as any)
          .on('dblclick', (event, d: any) => {
            setMainWikiId(d.id);
            openPage('editor');
          });

        const text = g
          .append('g')
          .selectAll('text')
          .data(nodes)
          .join('text')
          .text((d) => d.title)
          .attr('class', 'font-mono text-xs fill-neutral-700')
          .attr('dx', 12)
          .attr('dy', 4)
          .attr('stroke', 'none');

        simulation.on('tick', () => {
          link
            .attr('x1', (d: any) => d.source.x)
            .attr('y1', (d: any) => d.source.y)
            .attr('x2', (d: any) => d.target.x)
            .attr('y2', (d: any) => d.target.y);

          node.attr('cx', (d: any) => d.x).attr('cy', (d: any) => d.y);

          text.attr('x', (d: any) => d.x).attr('y', (d: any) => d.y);
        });

        setLoading(false);
      } catch (e) {
        console.error('Graph render error', e);
        setLoading(false);
      }
    };

    initGraph();

    return () => {
      if (simulation) simulation.stop();
    };
  }, [openPage]);

  const drag = (simulation: any) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended);
  };

  return (
    <div className="page-panel space-y-8 pane-active">
      <div>
        <h2 className="font-human text-4xl font-normal tracking-tight">Knowledge Graph</h2>
        <p className="text-[var(--text-muted)] font-sys text-sm mt-2">
          Visualize bidirectional links traversing your Zettelkasten. Double-click a node to edit.
        </p>
      </div>

      <div
        className="glass-panel w-full border border-white/50 relative overflow-hidden"
        style={{ height: '500px' }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-mono text-neutral-400">
            Scanning topology...
          </div>
        )}
        <div ref={containerRef} className="w-full h-full bg-white/10" />
      </div>
    </div>
  );
}
