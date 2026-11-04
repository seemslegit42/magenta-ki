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
import { computed } from '@angular/core';
import { SearchService } from './services/search.service';
import { WindowBounds, ProcessDescriptor } from './models/webos.models';

export interface ActiveWindowItem {
  descriptor: ProcessDescriptor;
  bounds: WindowBounds;
}

@Component({
  selector: 'app-root',
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
  styleUrl: './app.css',
  host: {
    '(window:keydown)': 'handleGlobalShortcut($event)'
  }
})
export class App {
  readonly windowManager = inject(WindowManagerService);
  readonly notificationService = inject(NotificationService);
  readonly searchService = inject(SearchService);

  readonly toasts = computed(() => this.notificationService.toasts());

  readonly visibleWindows = computed<ActiveWindowItem[]>(() => {
    const list: ActiveWindowItem[] = [];
    for (const proc of this.windowManager.activeProcesses()) {
      if (proc.isOpen && !proc.isMinimized) {
        const bounds = this.windowManager.getBounds(proc.pid);
        if (bounds) {
          list.push({ descriptor: proc, bounds });
        }
      }
    }
    return list;
  });

  dismissToast(toastId: string): void {
    this.notificationService.dismissToast(toastId);
  }

  handleGlobalShortcut(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.code === 'Space') {
      event.preventDefault();
      this.searchService.toggle();
    } else if (event.key === 'Escape') {
      if (this.searchService.isVisible()) {
        this.searchService.toggle();
      }
    }
  }
}
