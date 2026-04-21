import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanService } from '../../services/scan.services';

@Component({
  selector: 'ps-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  protected scan = inject(ScanService);

  readonly titles: Record<string, [string, string]> = {
    overview:  ['Security',     'Overview'],
    vulns:     ['Vulnerability','Findings'],
    triage:    ['Triage',       'Mode'],
    taint:     ['Taint',        'Analysis'],
    callgraph: ['Call',         'Graph'],
    report:    ['Report',       'JSON'],
    sarif:     ['SARIF',        'Export'],
    plugins:   ['Plugin',       'Manager'],
    rules:     ['Rules',        '260+'],
    settings:  ['',             'Impostazioni'],
  };

  get title() { return this.titles[this.scan.activePage()] ?? ['PySpector', '']; }
  get user()  { return this.scan.currentUser(); }
  get meta()  {
    const s = this.scan.currentScan();
    return `${s.target} · ${s.filesScanned} file · ${s.linesScanned.toLocaleString()} righe`;
  }
}