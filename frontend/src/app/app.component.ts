import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScanService } from './services/scan.services';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { HeaderComponent } from './components/header/header.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CallGraphComponent } from './components/call-graph/call-graph.component';
import { VulnerabilitiesComponent } from './components/vulnerabilities/vulnerabilities.component';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SidebarComponent, HeaderComponent, MainLayoutComponent,
            DashboardComponent, CallGraphComponent, VulnerabilitiesComponent],
  template: `
    <div class="app-shell">
      <ps-sidebar />
      <div class="app-main">
        <ps-header />
        <div class="app-content">
          @switch (scan.activePage()) {
            @case ('overview')  { <ps-dashboard /> }
            @case ('vulns')     { <ps-vulnerabilities /> }
            @case ('callgraph') { <ps-call-graph /> }
            @default {
              <div class="placeholder">
                <div class="mono" style="font-size:32px;opacity:.2">⬡</div>
                <div class="mono muted" style="letter-spacing:3px;text-transform:uppercase">
                  {{ scan.activePage() }} — in sviluppo
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-shell { display:flex; height:100vh; overflow:hidden; }
    .app-main  { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }
    .app-content { flex:1; overflow:hidden; display:flex; flex-direction:column; }
    .placeholder { display:flex; flex-direction:column; align-items:center;
                   justify-content:center; height:100%; gap:14px; }
  `]
})
export class AppComponent {
  protected scan = inject(ScanService);
}