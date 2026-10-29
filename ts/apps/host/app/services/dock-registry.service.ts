import { Injectable, inject, signal, computed } from '@angular/core';
import { WindowManagerService } from './window-manager.service';
import { NotificationService } from './notification.service';
import { AuditService } from './audit.service';
import { AuditCategory, AuditSeverity } from '../models/webos.models';

export interface DockPinnedApp {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: string;
  componentName?: string;
  entryComponent?: string;
  isFederated?: boolean;
  federatedConfig?: unknown;
  version?: string;
  pinnedAt?: number;
}

const DEFAULT_PINNED_APPS: DockPinnedApp[] = [
  {
    id: 'chat-window',
    name: 'AI Copilot',
    icon: 'message',
    description: 'Autonomous conversational assistant powered by Gemini and Blades.',
    category: 'ai',
    componentName: 'ChatWindowComponent',
    version: 'v1.1.0'
  },
  {
    id: 'terminal',
    name: 'Terminal & Copilot',
    icon: 'terminal',
    description: 'Interactive CLI shell and Gemini AI assistant.',
    category: 'ai',
    componentName: 'TerminalComponent',
    version: 'v3.0.1'
  },
  {
    id: 'wopi-office',
    name: 'WOPI Office Suite',
    icon: 'file-text',
    description: 'Collaborative document, spreadsheet, and slide editor.',
    category: 'productivity',
    componentName: 'WopiOfficeComponent',
    version: 'v2026.4'
  },
  {
    id: 'agentfs-explorer',
    name: 'AgentFS VFS Explorer',
    icon: 'folder',
    description: 'SQLite/OPFS virtual filesystem inspector.',
    category: 'developer',
    componentName: 'AgentFsExplorerComponent',
    version: 'v2.4.0'
  }
];

@Injectable({ providedIn: 'root' })
export class DockRegistryService {
  private readonly windowManager = inject(WindowManagerService);
  private readonly notificationService = inject(NotificationService);
  private readonly auditService = inject(AuditService);

  readonly pinnedApps = signal<DockPinnedApp[]>(DEFAULT_PINNED_APPS);
  readonly installedIds = signal<Set<string>>(new Set(DEFAULT_PINNED_APPS.map(a => a.id)));

  readonly pinnedCount = computed(() => this.pinnedApps().length);

  isPinned(appId: string): boolean {
    const cleanId = appId.replace(/^proc_/, '');
    return this.pinnedApps().some(a => a.id === cleanId || a.id === appId);
  }

  isInstalled(appId: string): boolean {
    const cleanId = appId.replace(/^proc_/, '');
    return this.installedIds().has(cleanId) || this.installedIds().has(appId);
  }

  installAndPin(app: DockPinnedApp): void {
    const cleanId = app.id.replace(/^proc_/, '');
    const normalizedApp: DockPinnedApp = {
      ...app,
      id: cleanId,
      pinnedAt: Date.now()
    };

    this.installedIds.update(set => {
      const next = new Set(set);
      next.add(cleanId);
      return next;
    });

    this.pinnedApps.update(apps => {
      if (apps.some(a => a.id === cleanId)) {
        return apps;
      }
      return [...apps, normalizedApp];
    });

    this.windowManager.triggerHaptic(14);

    this.notificationService.notify({
      title: 'App Added to Dock',
      message: `${normalizedApp.name} was installed and pinned to your taskbar for quick access.`,
      category: 'system',
      priority: 'normal',
      sourceApp: 'app-catalog',
      actionLabel: 'Launch'
    });

    this.auditService.logEvent({
      action: `install_app_dock: ${normalizedApp.name}`,
      category: AuditCategory.SYSTEM,
      details: `Pinned ${normalizedApp.name} (${normalizedApp.id}) to Dock taskbar`,
      status: 'success',
      severity: AuditSeverity.INFO
    });
  }

  unpinApp(appId: string): void {
    const cleanId = appId.replace(/^proc_/, '');
    this.pinnedApps.update(apps => apps.filter(a => a.id !== cleanId && a.id !== appId));
    this.windowManager.triggerHaptic(8);

    this.auditService.logEvent({
      action: `unpin_app_dock: ${appId}`,
      category: AuditCategory.SYSTEM,
      details: `Unpinned app ${cleanId} from Dock taskbar`,
      status: 'success',
      severity: AuditSeverity.INFO
    });
  }

  uninstallApp(appId: string): void {
    const cleanId = appId.replace(/^proc_/, '');
    this.unpinApp(cleanId);
    this.installedIds.update(set => {
      const next = new Set(set);
      next.delete(cleanId);
      next.delete(appId);
      return next;
    });
  }

  launchApp(app: DockPinnedApp): string {
    return this.windowManager.openApp({
      id: app.id,
      name: app.name,
      icon: app.icon,
      componentName: app.componentName || app.entryComponent,
      category: app.category,
      isFederated: app.isFederated,
      federatedConfig: app.federatedConfig
    });
  }

  isAppRunning(appId: string): boolean {
    const cleanId = appId.replace(/^proc_/, '');
    return this.windowManager.processes().some(
      p => p.isOpen && (p.appId === cleanId || p.appId === appId || p.pid === cleanId || p.pid === `proc_${cleanId}`)
    );
  }
}
