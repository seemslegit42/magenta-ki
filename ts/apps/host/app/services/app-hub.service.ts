import { Injectable, inject, signal } from '@angular/core';
import { WindowManagerService } from './window-manager.service';

/** Catalog = discover, remotes, federation management. Launch = run installed apps. */
export type AppHubPanel = 'catalog' | 'launch' | 'remotes' | 'pinned';

@Injectable({ providedIn: 'root' })
export class AppHubService {
  private readonly windowManager = inject(WindowManagerService);

  readonly requestedPanel = signal<AppHubPanel>('catalog');

  open(panel: AppHubPanel = 'catalog'): string {
    this.requestedPanel.set(panel);
    const pid = this.windowManager.openApp({
      id: 'app-launcher',
      name: 'Application Catalog',
      title: 'Application Catalog',
      icon: 'store',
      category: 'system',
    });
    this.requestedPanel.set(panel);
    return pid;
  }
}
