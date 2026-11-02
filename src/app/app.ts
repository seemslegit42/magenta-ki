import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusbarComponent } from './components/statusbar/statusbar.component';
import { DockComponent } from './components/dock/dock.component';
import { WindowComponent } from './components/window/window.component';
import { SearchComponent } from './components/search/search.component';
import { BeepAssistantComponent } from './components/common/beep-assistant.component';
import { WindowManagerService } from './services/window-manager.service';
import { NotificationService } from './services/notification.service';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import { DesktopIconsComponent } from './components/desktop-icons/desktop-icons.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    StatusbarComponent,
    DockComponent,
    WindowComponent,
    SearchComponent,
    BeepAssistantComponent,
    MatIconModule,
    DatePipe,
    DesktopIconsComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  readonly windowManager = inject(WindowManagerService);
  readonly notificationService = inject(NotificationService);
}

