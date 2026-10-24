import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';
import { AppHubService } from '../../services/app-hub.service';
import { BeepLaunchService } from '../../services/beep-launch.service';

@Component({
  selector: 'app-dock',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <nav aria-label="Application Dock" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-low border border-outline/14 p-1.5 rounded-2xl flex items-center gap-1.5 z-50">
      <button
        type="button"
        class="relative group w-12 h-12 rounded-xl bg-linear-to-tr from-primary-container/90 to-secondary/80 border border-tertiary/40 hover:border-tertiary flex items-center justify-center text-on-primary-container shadow-[0_0_16px_rgba(62,185,145,0.25)] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-tertiary/60"
        (click)="openBeep()"
        title="B.E.E.P — Syndicate Resource Planning"
        aria-label="Open B.E.E.P ERP"
      >
        <app-tabler-icon name="beep" size="22" class="text-readout drop-shadow-sm" />
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">B.E.E.P</span>
      </button>

      <button
        type="button"
        class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border border-transparent hover:border-tertiary/50 flex items-center justify-center text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/60"
        (click)="openLaunch()"
        title="Launch — open and run installed applications"
      >
        <app-tabler-icon name="apps" size="20" class="text-tertiary" />
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">Launch</span>
      </button>

      <button
        type="button"
        class="relative group w-11 h-11 rounded-xl bg-surface-container hover:bg-surface-high border border-transparent hover:border-secondary/50 flex items-center justify-center text-on-surface transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/60"
        (click)="openCatalog()"
        title="Catalog — discover apps, federation remotes, and extensions"
      >
        <app-tabler-icon name="store" size="20" class="text-secondary" />
        <span class="absolute -top-8 px-2 py-1 rounded-md bg-surface-lowest text-[10px] font-mono text-on-surface opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">Catalog</span>
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
          <app-tabler-icon [name]="getTablerIconName(proc.icon)" size="20" [class]="proc.icon === 'beep' ? 'text-tertiary' : 'text-primary-muted'" />
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
  private readonly appHub = inject(AppHubService);
  private readonly beepLaunch = inject(BeepLaunchService);

  getTablerIconName(icon: string): string {
    if (icon === 'beep') return 'beep';
    if (icon === 'terminal') return 'terminal';
    if (icon === 'settings') return 'settings';
    if (icon === 'security' || icon === 'shield') return 'shield';
    if (icon === 'chat' || icon === 'message') return 'message';
    if (icon === 'storefront') return 'store';
    if (icon === 'hub') return 'network';
    return 'apps';
  }

  openBeep(): void {
    this.beepLaunch.open();
  }

  openLaunch(): void {
    this.appHub.open('launch');
  }

  openCatalog(): void {
    this.appHub.open('catalog');
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
