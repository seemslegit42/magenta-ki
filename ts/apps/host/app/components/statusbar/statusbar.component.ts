import { Component, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <header class="h-12 bg-[#08090C]/95 backdrop-blur-2xl border-b border-[rgba(245,255,250,0.18)] px-4 flex items-center justify-between select-none z-50 shadow-lg">
      <!-- Left: OS Branding & Active Menu -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6A0DAD] to-[#E0218A] flex items-center justify-center text-white shadow-lg shadow-[#E0218A]/30 ring-1 ring-white/20">
            <app-tabler-icon name="hexagon" size="16" class="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          </div>
          <span class="font-display font-bold text-sm text-[#F5FFFA] tracking-[0.2em]">Λ Ξ V <span class="text-[#E0218A] drop-shadow-[0_0_6px_rgba(224,33,138,0.5)]">O S</span></span>
        </div>

        <nav aria-label="System Menu" class="hidden md:flex items-center space-x-1.5 text-xs text-[#8C94A8]">
          <button type="button" class="px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#3EB991] cursor-pointer transition-all focus:outline-none flex items-center space-x-1.5 border border-transparent hover:border-[#3EB991]/30 shadow-sm" (click)="openLauncher()">
            <app-tabler-icon name="apps" size="16" class="text-[#3EB991] drop-shadow-[0_0_6px_rgba(62,185,145,0.4)]" />
            <span class="font-medium text-[#F5FFFA]">Applications</span>
          </button>
          <button type="button" class="px-3 py-1.5 rounded-xl hover:bg-white/10 hover:text-[#20B2AA] cursor-pointer transition-all focus:outline-none border border-transparent hover:border-[#20B2AA]/30 font-medium text-[#F5FFFA] shadow-sm" (click)="openStore()">App Store</button>
        </nav>
      </div>

      <!-- Right: System Status & Clock -->
      <div class="flex items-center space-x-4 text-xs text-[#8C94A8]">
        <div class="flex items-center space-x-1.5 text-[#F5FFFA] font-mono px-3 py-1 rounded-full bg-white/5 border border-white/10">
          <app-tabler-icon name="clock" size="16" class="text-[#20B2AA] drop-shadow-[0_0_6px_rgba(32,178,170,0.5)]" />
          <span class="font-semibold">{{ currentTime() }}</span>
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
      name: 'Verdigris App Store & Catalog',
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
