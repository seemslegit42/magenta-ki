import { Component, ChangeDetectionStrategy, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <header class="h-12 bg-surface-lowest border-b border-outline/12 px-4 flex items-center justify-between select-none z-50">
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-lg bg-linear-to-tr from-primary to-magenta flex items-center justify-center text-white" aria-hidden="true">
            <app-tabler-icon name="hexagon" size="16" />
          </div>
          <span class="font-display font-bold text-sm text-on-surface tracking-[0.2em]">Λ Ξ V <span class="text-magenta">O S</span></span>
        </div>

        <nav aria-label="System Menu" class="hidden md:flex items-center space-x-1 text-xs text-on-surface-variant">
          <button type="button" class="px-3 py-1.5 rounded-lg hover:bg-white/8 hover:text-tertiary cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-tertiary/50 flex items-center space-x-1.5" (click)="openLauncher()">
            <app-tabler-icon name="apps" size="16" class="text-tertiary" />
            <span class="font-medium text-on-surface">Applications</span>
          </button>
          <button type="button" class="px-3 py-1.5 rounded-lg hover:bg-white/8 hover:text-secondary cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary/50 font-medium text-on-surface" (click)="openStore()">App Store</button>
        </nav>
      </div>

      <div class="flex items-center space-x-3 text-xs text-on-surface-variant">
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

  openLauncher() {
    this.windowManager.openApp({
      id: 'app-launcher',
      name: 'Application Matrix',
      icon: 'apps'
    });
  }

  openStore() {
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
}
