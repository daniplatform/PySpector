import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanService } from '../../services/scan.services';

@Component({
  selector: 'ps-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  protected scan = inject(ScanService);

  readonly navGroups = [
    { label: 'Analisi', items: [
      { id:'overview',  label:'Overview',       icon:'◈' },
      { id:'vulns',     label:'Vulnerabilità',  icon:'⚠', badgeFn: ()=>`${this.scan.summary().critical} CRIT`, badgeType:'critical' },
      { id:'triage',    label:'Triage Mode',    icon:'◎', badgeFn: ()=>`${this.scan.summary().newSinceBaseline}`, badgeType:'warning' },
      { id:'taint',     label:'Taint Analysis', icon:'≋' },
      { id:'callgraph', label:'Call Graph',     icon:'⬡', badgeFn: ()=>`${this.scan.callGraph().nodes.length} nodi`, badgeType:'info' },
    ]},
    { label: 'Output', items: [
      { id:'report',  label:'Report JSON', icon:'◫', badge:'JSON',    badgeType:'info' },
      { id:'sarif',   label:'SARIF Export',icon:'◧' },
      { id:'html',    label:'Report HTML', icon:'◨' },
    ]},
    { label: 'Plugin', items: [
      { id:'plugins',  label:'Plugin Manager', icon:'⬡' },
      { id:'aipocgen', label:'aipocgen',        icon:'◑', badge:'trusted', badgeType:'info' },
    ]},
    { label: 'Sistema', items: [
      { id:'rules',    label:'Regole (260+)', icon:'⊞' },
      { id:'settings', label:'Impostazioni',  icon:'⚙' },
    ]}
  ];

  get active() { return this.scan.activePage(); }
  navigate(id: string) { this.scan.setPage(id); }
  badgeVal(item: any): string | null {
    return item.badgeFn ? item.badgeFn() : (item.badge ?? null);
  }
}