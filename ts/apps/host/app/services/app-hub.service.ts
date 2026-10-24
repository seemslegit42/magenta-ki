import { Injectable, inject, signal } from '@angular/core';
import { WindowManagerService } from './window-manager.service';

/** Launch = run installed apps. Catalog = discover, remotes, federation management. */
export type AppHubPanel = 'launch' | 'catalog';

@Injectable({ providedIn: 'root' })
export class AppHubService {
  private readonly windowManager = inject(WindowManagerService);

  readonly requestedPanel = signal<AppHubPanel>('launch');

  open(panel: AppHubPanel = 'launch'): string {
    this.requestedPanel.set(panel);
    const pid = this.windowManager.openApp({
      id: 'app-launcher',
      name: 'Applications',
      icon: 'apps',
      category: 'system',
    });
    // Re-emit so an already-open hub window switches tabs.
    this.requestedPanel.set(panel);
    return pid;
  }
}
