import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { db } from '@/db/dexie';

import { useUiStore } from '@/stores/ui-store';

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  badge: string;
}

interface D3Link {
  source: string | D3Node;
  target: string | D3Node;
}

export function GraphView({ openPage }: { openPage: (p: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const setMainWikiId = useUiStore((state) => state.setMainWikiId);

  useEffect(() => {
    let simulation: d3.Simulation<D3Node, D3Link>;

    const initGraph = async () => {
      try {
        setLoading(true);
        const docs = await db.documents.toArray();
        const linksData = await db.links.toArray();

        const nodes: D3Node[] = docs.map((d) => ({
          id: d.id,
          title: d.title,
          badge: d.badgeClass || 'tag-badge-blue',
        }));

        const links: D3Link[] = linksData.map((l) => ({
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

        svg.call(zoom);

        simulation = d3
          .forceSimulation(nodes)
          .force(
            'link',
            d3
              .forceLink<D3Node, D3Link>(links)
              .id((d) => d.id)
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
          .call(
            drag(simulation) as unknown as (
              selection: d3.Selection<SVGCircleElement | d3.BaseType, D3Node, SVGGElement, unknown>
            ) => void
          )
          .on('dblclick', (_event, d) => {
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

        const getNodeX = (source: string | D3Node): number =>
          typeof source === 'string' ? 0 : (source.x ?? 0);
        const getNodeY = (source: string | D3Node): number =>
          typeof source === 'string' ? 0 : (source.y ?? 0);

        simulation.on('tick', () => {
          link
            .attr('x1', (d) => getNodeX(d.source))
            .attr('y1', (d) => getNodeY(d.source))
            .attr('x2', (d) => getNodeX(d.target))
            .attr('y2', (d) => getNodeY(d.target));

          node.attr('cx', (d) => d.x ?? 0).attr('cy', (d) => d.y ?? 0);

          text.attr('x', (d) => d.x ?? 0).attr('y', (d) => d.y ?? 0);
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

  const drag = (simulation: d3.Simulation<D3Node, D3Link>) => {
    function dragstarted(event: d3.D3DragEvent<SVGCircleElement, unknown, D3Node>) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    function dragged(event: d3.D3DragEvent<SVGCircleElement, unknown, D3Node>) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    function dragended(event: d3.D3DragEvent<SVGCircleElement, unknown, D3Node>) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    return d3
      .drag<SVGCircleElement, D3Node>()
      .on('start', dragstarted)
      .on('drag', dragged)
      .on('end', dragended);
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
