import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';
import { AppHubService } from '../../services/app-hub.service';
import { BeepLaunchService } from '../../services/beep-launch.service';
import { DockRegistryService, DockPinnedApp } from '../../services/dock-registry.service';

@Component({
  selector: 'app-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <nav
      role="toolbar"
      aria-label="Taskbar: Pinned applications and active windows"
      class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-low border border-outline/14 p-1.5 rounded-2xl flex items-center gap-1.5 z-50 shadow-2xl backdrop-blur-xl"
    >
      <!-- Syndicate Resource Anchor: B.E.E.P ERP -->
      <button
        type="button"
        class="relative group w-12 h-12 rounded-xl bg-linear-to-tr from-primary-container/90 to-secondary/80 border border-tertiary/40 hover:border-tertiary flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(62,185,145,0.25)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/60"
        (click)="openBeep()"
        title="B.E.E.P — Syndicate Resource Planning"
        aria-label="Open B.E.E.P ERP"
      >
        <app-tabler-icon name="beep" size="22" class="text-readout drop-shadow-sm" />
        @if (isBeepRunning()) {
          <span class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-tertiary ring-2 ring-surface-low" aria-hidden="true"></span>
        }
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg">B.E.E.P</span>
      </button>

      <div class="w-px h-7 bg-white/10 mx-0.5" aria-hidden="true"></div>

      <!-- Pinned Applications (Installed from Catalog) -->
      @for (pinned of dockRegistry.pinnedApps(); track pinned.id) {
        @let running = dockRegistry.isAppRunning(pinned.id);
        <button
          type="button"
          class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/60"
          [class.border-tertiary]="running"
          [class.border-transparent]="!running"
          (click)="launchPinned(pinned)"
          [title]="pinned.name + (running ? ' (Running)' : ' (Quick Access)')"
          [attr.aria-label]="'Launch ' + pinned.name"
        >
          <app-tabler-icon
            [name]="getTablerIconName(pinned.icon)"
            size="20"
            [class]="running ? 'text-tertiary drop-shadow-[0_0_6px_rgba(62,185,145,0.4)]' : 'text-on-surface-variant group-hover:text-on-surface'"
          />
          @if (running) {
            <span class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-tertiary ring-1 ring-surface-lowest" aria-hidden="true"></span>
          } @else {
            <span class="absolute top-1 right-1 w-1 h-1 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true"></span>
          }
          <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg">
            {{ pinned.name }}
          </span>
        </button>
      }

      <!-- Separator between pinned items and active unpinned processes -->
      @if (unpinnedActiveProcesses().length > 0) {
        <div class="w-px h-7 bg-white/10 mx-0.5" aria-hidden="true"></div>
      }

      <!-- Other Active Windows (Running processes not in pinned apps) -->
      @for (proc of unpinnedActiveProcesses(); track proc.pid) {
        <button
          type="button"
          class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-magenta/50"
          [class.border-magenta]="proc.isOpen && !proc.isMinimized"
          [class.border-outline/20]="proc.isOpen && proc.isMinimized"
          [class.opacity-60]="proc.isMinimized"
          (click)="toggleProcess(proc.pid)"
          [title]="proc.title + ' (Active Window)'"
          [attr.aria-label]="'Focus ' + proc.title"
        >
          <app-tabler-icon
            [name]="getTablerIconName(proc.icon)"
            size="20"
            [class]="proc.isOpen && !proc.isMinimized ? 'text-magenta-glow drop-shadow-[0_0_6px_rgba(224,33,138,0.4)]' : 'text-on-surface-variant'"
          />
          @if (proc.isOpen) {
            <span class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-magenta ring-1 ring-surface-lowest" aria-hidden="true"></span>
          }
          <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10 shadow-lg">
            {{ proc.title }}
          </span>
        </button>
      }
    </nav>
  `
})
export class DockComponent {
  readonly windowManager = inject(WindowManagerService);
  readonly dockRegistry = inject(DockRegistryService);
  private readonly appHub = inject(AppHubService);
  private readonly beepLaunch = inject(BeepLaunchService);

  readonly isBeepRunning = computed(() => {
    return this.windowManager.processes().some(p => p.isOpen && (p.appId === 'beep-erp' || p.appId === 'beep'));
  });

  readonly unpinnedActiveProcesses = computed(() => {
    const pinnedSet = new Set(this.dockRegistry.pinnedApps().map(a => a.id));
    return this.windowManager.processes().filter(proc => {
      const cleanAppId = proc.appId.replace(/^proc_/, '');
      const cleanPid = proc.pid.replace(/^proc_/, '');
      return proc.isOpen && !pinnedSet.has(cleanAppId) && !pinnedSet.has(cleanPid) && cleanAppId !== 'beep-erp' && cleanAppId !== 'beep';
    });
  });

  getTablerIconName(icon: string): string {
    if (icon === 'beep') return 'beep';
    if (icon === 'terminal') return 'terminal';
    if (icon === 'settings') return 'settings';
    if (icon === 'security' || icon === 'shield') return 'shield';
    if (icon === 'chat' || icon === 'message') return 'message';
    if (icon === 'storefront' || icon === 'store') return 'store';
    if (icon === 'hub' || icon === 'network') return 'network';
    if (icon === 'folder' || icon === 'folder_special') return 'folder';
    if (icon === 'file-text' || icon === 'description') return 'file-text';
    if (icon === 'database' || icon === 'storage') return 'database';
    return 'apps';
  }

  openBeep(): void {
    this.beepLaunch.open();
  }

  launchPinned(app: DockPinnedApp): void {
    this.dockRegistry.launchApp(app);
  }

  toggleProcess(pid: string) {
    const proc = this.windowManager.processes().find(p => p.pid === pid);
    if (!proc) return;
    if (!proc.isOpen) {
      this.windowManager.openApp({
        id: proc.appId,
        name: proc.title,
        icon: proc.icon,
        isFederated: proc.isFederated,
        federatedConfig: proc.federatedConfig
      });
    } else if (proc.isMinimized) {
      this.windowManager.restoreWindow(pid);
      this.windowManager.focusWindow(pid);
    } else {
      this.windowManager.focusWindow(pid);
    }
  }
}

