import { Component } from '@angular/core';
import { MainLayoutComponent } from './components/main-layout/main-layout.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [MainLayoutComponent, DashboardComponent],
  templateUrl: './app.html',
})
export class App {}