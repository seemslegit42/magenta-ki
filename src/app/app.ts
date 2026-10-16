import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusbarComponent } from './components/statusbar/statusbar.component';
import { DockComponent } from './components/dock/dock.component';
import { WindowComponent } from './components/window/window.component';
import { WindowManagerService } from './services/window-manager.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    StatusbarComponent,
    DockComponent,
    WindowComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly windowManager = inject(WindowManagerService);
}
