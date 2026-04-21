import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanService } from '../../services/scan.services';
import { Severity } from '../../models/pyspector.models';

@Component({
  selector: 'ps-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  protected scan = inject(ScanService);

  readonly categories = [
    { label:'SQL Injection',        count:18, sev:'CRITICAL' },
    { label:'Hardcoded Secrets',    count:14, sev:'HIGH'     },
    { label:'Command Injection',    count:11, sev:'CRITICAL' },
    { label:'Insecure Deserializ.', count:9,  sev:'HIGH'     },
    { label:'Weak Hashing (MD5)',   count:22, sev:'MEDIUM'   },
    { label:'eval() / exec()',      count:7,  sev:'CRITICAL' },
    { label:'Path Traversal',       count:12, sev:'HIGH'     },
    { label:'Taint: req → sink',    count:16, sev:'HIGH'     },
  ];

  get maxCat() { return Math.max(...this.categories.map(c => c.count)); }
  barW(n: number) { return Math.round(n / this.maxCat * 100); }
  barColor(sev: string) {
    return ({ CRITICAL:'var(--crit3)', HIGH:'var(--high3)', MEDIUM:'var(--med3)' })[sev] ?? 'var(--g4)';
  }

  get summary() { return this.scan.summary(); }
  get recent()  { return this.scan.findings().slice(0, 6); }
  get topFiles(){ return this.scan.topVulnerableFiles(6); }

  sevClass(sev: Severity) {
    return ({ CRITICAL:'critical',HIGH:'high',MEDIUM:'medium',LOW:'low',INFO:'info' })[sev] ?? '';
  }
  basename(p: string) { return p.split('/').pop()!; }
  dir(p: string) { const pts = p.split('/'); return pts.length > 1 ? pts.slice(0,-1).join('/')+'/':'' }

  // Donut segments
  readonly circ = 2 * Math.PI * 42;
  get segments() {
    const tot = this.summary.total || 1;
    const defs = [
      { label:'Critical', count:this.summary.critical, color:'var(--crit3)' },
      { label:'High',     count:this.summary.high,     color:'var(--high3)' },
      { label:'Medium',   count:this.summary.medium,   color:'var(--med3)'  },
      { label:'Low',      count:this.summary.low,      color:'var(--low3)'  },
      { label:'Info',     count:this.summary.info,     color:'var(--info2)' },
    ];
    let off = 0;
    return defs.map(d => {
      const arc = (d.count / tot) * this.circ;
      const seg = { ...d, arc, gap: this.circ - arc, offset: off };
      off += arc;
      return seg;
    });
  }
}