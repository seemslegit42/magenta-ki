import { Injectable, signal, inject } from '@angular/core';
import { WindowManagerService } from './window-manager.service';
import { AppHubService } from './app-hub.service';
import { BeepLaunchService } from './beep-launch.service';

export interface SearchItem {
  id: string;
  name: string;
  type: 'app' | 'file' | 'command';
  icon: string; // Tabler icon name
  action: () => void;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly wm = inject(WindowManagerService);
  private readonly appHub = inject(AppHubService);
  private readonly beepLaunch = inject(BeepLaunchService);
  readonly isVisible = signal(false);
  readonly items = signal<SearchItem[]>([]);

  constructor() {
    this.items.set([
      {
        id: 'beep-erp',
        name: 'B.E.E.P — Syndicate Resource Planning',
        type: 'app',
        icon: 'beep',
        action: () => this.beepLaunch.open(),
      },
      { 
        id: 'chat-window', 
        name: 'AI Copilot', 
        type: 'app', 
        icon: 'message', 
        action: () => this.wm.openApp({ id: 'chat-window', name: 'AI Copilot', icon: 'chat', category: 'ai' }) 
      },
      { 
        id: 'avf', 
        name: 'Agentic Value Framework (AVF)', 
        type: 'app', 
        icon: 'network', 
        action: () => this.wm.openApp({ id: 'agentic-value-framework', name: 'Agentic Value Framework (AVF)', icon: 'insights', category: 'ai' }) 
      },
      { 
        id: 'app-launcher', 
        name: 'Applications — Launch', 
        type: 'app', 
        icon: 'apps', 
        action: () => this.appHub.open('launch') 
      },
      { 
        id: 'app-catalog', 
        name: 'Applications — Catalog & extensions', 
        type: 'app', 
        icon: 'store', 
        action: () => this.appHub.open('catalog') 
      },
      { 
        id: 'terminal', 
        name: 'Terminal & Copilot', 
        type: 'app', 
        icon: 'terminal', 
        action: () => this.wm.openApp({ id: 'terminal', name: 'Terminal & Copilot', icon: 'terminal', category: 'ai' }) 
      },
      { 
        id: 'databases', 
        name: 'Appwrite Databases & SDK', 
        type: 'app', 
        icon: 'store', 
        action: () => this.wm.openApp({ id: 'appwrite-databases', name: 'Appwrite Databases & SDK', icon: 'storage', category: 'database' }) 
      },
      { 
        id: 'security-audit', 
        name: 'Audit Trail & RBAC Sentinel', 
        type: 'app', 
        icon: 'shield', 
        action: () => this.wm.openApp({ id: 'security-audit', name: 'Audit Trail & RBAC Sentinel', icon: 'verified_user', category: 'security' }) 
      },
      { 
        id: 'settings', 
        name: 'System Settings', 
        type: 'app', 
        icon: 'settings', 
        action: () => this.wm.openApp({ id: 'settings', name: 'System Settings', icon: 'settings', category: 'system' }) 
      }
    ]);
  }

  toggle() {
    this.isVisible.update(v => !v);
  }
}
