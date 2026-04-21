import { Component, inject, AfterViewInit, OnDestroy, NgZone, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CallGraphNode, CallGraphEdge, Severity } from '../../models/pyspector.models';
import { ScanService } from '../../services/scan.services';

interface Pos extends CallGraphNode { x: number; y: number; vx: number; vy: number; fx?: number; fy?: number; }

@Component({
  selector: 'ps-call-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './call-graph.component.html',
  styleUrls: ['./call-graph.component.scss']
})
export class CallGraphComponent implements AfterViewInit, OnDestroy {
  protected scan = inject(ScanService);
  private zone = inject(NgZone);

  W = 860; H = 480;
  nodes: Pos[] = [];
  edges: CallGraphEdge[] = [];
  selected: Pos | null = null;
  showTaintOnly = false;
  filterSev = 'ALL';
  readonly sevs = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'];

  private raf = 0; private alive = true;
  private drag: Pos | null = null; private dox = 0; private doy = 0;

  ngAfterViewInit() { this.init(); this.zone.runOutsideAngular(() => this.tick()); }
  ngOnDestroy() { this.alive = false; cancelAnimationFrame(this.raf); }

  private init() {
    const cg = this.scan.callGraph();
    this.nodes = cg.nodes.map((n, i) => {
      const a = (i / cg.nodes.length) * Math.PI * 2;
      return { ...n, x: this.W / 2 + Math.cos(a) * 160, y: this.H / 2 + Math.sin(a) * 140, vx: 0, vy: 0 };
    });
    this.edges = cg.edges;
  }

  private tick() {
    if (!this.alive) return;
    const ns = this.nodes; const cx = this.W / 2; const cy = this.H / 2;
    // Repulsion
    for (let i = 0; i < ns.length; i++) for (let j = i + 1; j < ns.length; j++) {
      const dx = ns[j].x - ns[i].x, dy = ns[j].y - ns[i].y, d2 = dx * dx + dy * dy || 1, d = Math.sqrt(d2);
      const f = 3200 / d2;
      ns[i].vx -= (dx / d) * f * .04; ns[i].vy -= (dy / d) * f * .04;
      ns[j].vx += (dx / d) * f * .04; ns[j].vy += (dy / d) * f * .04;
    }
    // Attraction
    for (const e of this.edges) {
      const a = ns.find(n => n.id === e.source), b = ns.find(n => n.id === e.target);
      if (!a || !b) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.sqrt(dx * dx + dy * dy) || 1, f = (d - 130) * .012;
      if (!a.fx) { a.vx += dx / d * f; a.vy += dy / d * f; } if (!b.fx) { b.vx -= dx / d * f; b.vy -= dy / d * f; }
    }
    // Integrate
    for (const n of ns) {
      if (n.fx !== undefined) continue;
      n.vx += (cx - n.x) * .0002; n.vy += (cy - n.y) * .0002;
      n.vx *= .85; n.vy *= .85;
      n.x = Math.max(50, Math.min(this.W - 50, n.x + n.vx));
      n.y = Math.max(35, Math.min(this.H - 35, n.y + n.vy));
    }
    this.zone.run(() => { }); // trigger CD
    this.raf = requestAnimationFrame(() => this.tick());
  }

  // ── Filtered views ──────────────────────────────
  get visNodes(): Pos[] {
    return this.nodes.filter(n => {
      if (this.filterSev !== 'ALL' && n.severity !== this.filterSev) return false;
      if (this.showTaintOnly && !['source', 'sink', 'tainted'].includes(n.type)) return false;
      return true;
    });
  }
  get visIds() { return new Set(this.visNodes.map(n => n.id)); }
  get visEdges(): CallGraphEdge[] {
    const ids = this.visIds;
    return this.edges.filter(e => ids.has(e.source) && ids.has(e.target) && (!this.showTaintOnly || e.isTainted));
  }
  byId(id: string) { return this.nodes.find(n => n.id === id); }

  // ── Colors ──────────────────────────────────────
  nodeColor(n: CallGraphNode) {
    return ({ source: '#7b0000', sink: '#b71c1c', tainted: '#9a3412', function: '#1c2c3a', method: '#1a2433' })[n.type] ?? '#1c242c';
  }

  nodeStroke(n: CallGraphNode) {
    const map: Record<Severity, string> = {
      CRITICAL: '#ef4444',
      HIGH: '#f97316',
      MEDIUM: '#f59e0b',
      LOW: '#22c55e',
      INFO: '#0ea5e9'
    };

    if (this.selected?.id === n.id) return '#fff';
    return n.severity ? map[n.severity] : '#334155';
  }

  nodeR(n: CallGraphNode) { return (n.type === 'source' || n.type === 'sink' ? 22 : 17) + Math.min(n.callCount, 10); }
  edgeColor(e: CallGraphEdge) { return e.isTainted ? '#f97316' : '#2e3d4a'; }

  // ── Interaction ──────────────────────────────────
  pick(n: Pos) { this.selected = this.selected?.id === n.id ? null : n; }
  deselect() { this.selected = null; }

  // Usa un'interfaccia o il tipo preciso per 'n' (es. Node o Pos)
  startDrag(ev: MouseEvent, n: Pos, svg: HTMLElement) {
    ev.stopPropagation();
    const svgElement = svg as unknown as SVGSVGElement;
    const ctm = svgElement.getScreenCTM();
    if (!ctm) return;

    this.drag = n;
    n.fx = n.x;
    n.fy = n.y;
    const pt = svgElement.createSVGPoint();
    pt.x = ev.clientX;
    pt.y = ev.clientY;
    const sp = pt.matrixTransform(ctm.inverse());

    this.dox = sp.x - n.x;
    this.doy = sp.y - n.y;
  }

  @HostListener('mousemove', ['$event']) onMove(ev: MouseEvent) {
    if (!this.drag) return;
    const svgEl = document.querySelector('.cg-svg') as SVGSVGElement | null;
    if (!svgEl) return;
    const pt = svgEl.createSVGPoint();
    pt.x = ev.clientX; pt.y = ev.clientY;
    const sp = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
    this.drag.x = sp.x - this.dox; this.drag.y = sp.y - this.doy;
    this.drag.fx = this.drag.x; this.drag.fy = this.drag.y;
  }
  @HostListener('mouseup') stopDrag() {
    if (this.drag) { delete this.drag.fx; delete this.drag.fy; this.drag = null; }
  }

  resetLayout() {
    this.nodes.forEach((n, i) => {
      const a = (i / this.nodes.length) * Math.PI * 2;
      n.x = this.W / 2 + Math.cos(a) * 160; n.y = this.H / 2 + Math.sin(a) * 140;
      n.vx = 0; n.vy = 0; delete n.fx; delete n.fy;
    });
  }

  sevClass(s?: Severity) {
    const map: Record<Severity, string> = {
      CRITICAL: 'critical',
      HIGH: 'high',
      MEDIUM: 'medium',
      LOW: 'low',
      INFO: 'info'
    };

    return s ? map[s] : '';
  }

  get relatedFindings() {
    if (!this.selected) return [];
    return this.scan.findings().filter(f => f.file === this.selected!.file).slice(0, 3);
  }
}