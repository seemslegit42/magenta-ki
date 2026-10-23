import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <nav aria-label="Application Dock" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-low border border-outline/14 p-1.5 rounded-2xl flex items-center gap-1.5 z-50">
      <button
        type="button"
        class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border border-transparent hover:border-tertiary/50 flex items-center justify-center text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/60"
        (click)="openAppLauncher()"
        title="Application Matrix & Launcher"
      >
        <app-tabler-icon name="apps" size="20" class="text-tertiary" />
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">Applications</span>
      </button>

      <button
        type="button"
        class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border border-transparent hover:border-secondary/50 flex items-center justify-center text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/60"
        (click)="openAppStore()"
        title="App Store & Catalog"
      >
        <app-tabler-icon name="store" size="20" class="text-secondary" />
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">App Store</span>
      </button>

      <button
        type="button"
        class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border border-transparent hover:border-magenta/50 flex items-center justify-center text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-magenta/60"
        (click)="openStudio()"
        title="Native Federation Studio"
      >
        <app-tabler-icon name="network" size="20" class="text-magenta" />
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">Federation Studio</span>
      </button>

      <div class="w-px h-7 bg-white/10 mx-0.5" aria-hidden="true"></div>

      @for (proc of windowManager.processes(); track proc.pid) {
        <button
          type="button"
          class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-magenta/50"
          [class.border-magenta]="proc.isOpen"
          [class.border-transparent]="!proc.isOpen"
          (click)="toggleProcess(proc.pid)"
          [title]="proc.title"
        >
          <app-tabler-icon [name]="getTablerIconName(proc.icon)" size="20" class="text-primary-muted" />
          @if (proc.isOpen) {
            <span class="absolute bottom-1.5 w-1 h-1 rounded-xs bg-magenta" aria-hidden="true"></span>
          }
          <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">{{ proc.title }}</span>
        </button>
      }
    </nav>
  `
})
export class DockComponent {
  readonly windowManager = inject(WindowManagerService);

  getTablerIconName(icon: string): string {
    if (icon === 'terminal') return 'terminal';
    if (icon === 'settings') return 'settings';
    if (icon === 'security' || icon === 'shield') return 'shield';
    if (icon === 'chat' || icon === 'message') return 'message';
    if (icon === 'storefront') return 'store';
    if (icon === 'hub') return 'network';
    return 'apps';
  }

  openAppLauncher() {
    this.windowManager.openApp({
      id: 'app-launcher',
      name: 'Application Matrix',
      icon: 'apps'
    });
  }

  openAppStore() {
    this.windowManager.openApp({
      id: 'app-store',
      name: 'App Store',
      icon: 'storefront'
    });
  }

  openStudio() {
    this.windowManager.openApp({
      id: 'native-federation',
      name: 'Native Federation Studio',
      icon: 'hub'
    });
  }

  toggleProcess(pid: string) {
    const proc = this.windowManager.processes().find(p => p.pid === pid);
    if (!proc) return;
    if (!proc.isOpen) {
      this.windowManager.openApp({ id: proc.appId, name: proc.title, icon: proc.icon, isFederated: proc.isFederated, federatedConfig: proc.federatedConfig });
    } else if (proc.isMinimized) {
      this.windowManager.focusWindow(pid);
    } else {
      this.windowManager.focusWindow(pid);
    }
  }
}
