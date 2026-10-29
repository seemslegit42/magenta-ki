import { Component, ChangeDetectionStrategy, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';
import { AppHubService } from '../../services/app-hub.service';
import { BeepLaunchService } from '../../services/beep-launch.service';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <header class="h-12 bg-surface-lowest border-b border-outline/12 px-4 flex items-center justify-between select-none z-50">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <span class="font-display font-bold text-sm text-on-surface tracking-[0.15em] sm:tracking-[0.2em] truncate shrink-0 max-w-[9rem] sm:max-w-none">
          Λ Ξ V <span class="text-magenta">O S</span>
        </span>

        <nav aria-label="System Menu" class="flex items-center gap-1.5 text-xs text-on-surface-variant min-w-0">
          <button
            type="button"
            class="px-2 sm:px-2.5 py-1.5 rounded-lg bg-primary-container/25 border border-tertiary/35 hover:border-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/50 flex items-center gap-1.5 shadow-xs"
            (click)="openBeep()"
            title="B.E.E.P — Syndicate Resource Planning"
            aria-label="Open B.E.E.P ERP">
            <app-tabler-icon name="beep" size="18" class="text-tertiary shrink-0" />
            <span class="font-display font-semibold text-on-surface hidden sm:inline text-[11px] tracking-wide">B.E.E.P</span>
          </button>

          <!-- System Application Catalog (Install & Manage Micro-Frontends) -->
          <button
            type="button"
            class="px-2.5 sm:px-3 py-1.5 rounded-lg bg-surface-container/80 hover:bg-surface-high border border-outline/16 hover:border-secondary/50 text-on-surface cursor-pointer transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/50 flex items-center gap-1.5 shadow-xs"
            (click)="openCatalog()"
            title="Application Catalog — Install apps and manage Native Federation micro-frontends"
            aria-label="Open Application Catalog">
            <app-tabler-icon name="store" size="16" class="text-secondary shrink-0" />
            <span class="font-display font-medium text-on-surface text-xs tracking-wide">Application Catalog</span>
            <span class="hidden md:inline-flex px-1.5 py-0.2 rounded text-[9px] font-mono bg-secondary/15 text-secondary border border-secondary/30">MFE Hub</span>
          </button>
        </nav>
      </div>

      <div class="flex items-center space-x-3 text-xs text-on-surface-variant shrink-0">
        <div class="flex items-center space-x-1.5 text-on-surface font-mono px-2.5 py-1 rounded-lg">
          <app-tabler-icon name="clock" size="16" class="text-secondary" />
          <span class="font-semibold tabular-nums">{{ currentTime() }}</span>
        </div>
      </div>
    </header>
  `
})
export class StatusbarComponent {
  readonly windowManager = inject(WindowManagerService);
  private readonly appHub = inject(AppHubService);
  private readonly beepLaunch = inject(BeepLaunchService);
  readonly currentTime = signal<string>('');

  constructor() {
    afterNextRender(() => {
      this.updateTime();
      setInterval(() => this.updateTime(), 1000);
    });
  }

  private updateTime() {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  }

  openBeep(): void {
    this.beepLaunch.open();
  }

  openCatalog(): void {
    this.appHub.open('catalog');
  }
}
