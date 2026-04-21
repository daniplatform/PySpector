import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanService } from '../../services/scan.services';
import { Finding, Severity } from '../../models/pyspector.models';

@Component({
  selector: 'ps-vulnerabilities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vulnerabilities.component.html',
  styleUrls: ['./vulnerabilities.component.scss']
})
export class VulnerabilitiesComponent {
  protected scan = inject(ScanService);
  activeSev    = signal('ALL');
  activeMethod = signal('ALL');
  selected     = signal<Finding|null>(null);

  readonly filtered = computed(() => {
    let f = this.scan.findings();
    if (this.activeSev()    !== 'ALL') f = f.filter(x => x.severity === this.activeSev());
    if (this.activeMethod() !== 'ALL') f = f.filter(x => x.method.includes(this.activeMethod()));
    return f;
  });

  countSev(s: string) { return this.scan.findings().filter(f => f.severity === s).length; }
  sevClass(s: Severity) { return ({CRITICAL:'critical',HIGH:'high',MEDIUM:'medium',LOW:'low',INFO:'info'})[s]??''; }
  basename(p: string) { return p.split('/').pop()!; }
  dir(p: string)      { const pts=p.split('/'); return pts.length>1?pts.slice(0,-1).join('/')+'/':''; }
  toggle(f: Finding)  { this.selected.update(c => c?.id===f.id ? null : f); }
}