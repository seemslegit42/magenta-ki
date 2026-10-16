import { Component, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="h-12 bg-[#08090C]/90 backdrop-blur-xl border-b border-[rgba(245,255,250,0.12)] px-4 flex items-center justify-between select-none z-50">
      <!-- Left: OS Branding & Active Menu -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-2">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6A0DAD] to-[#E0218A] flex items-center justify-center text-white shadow-md shadow-[#E0218A]/20">
            <mat-icon class="text-sm">hexagon</mat-icon>
          </div>
          <span class="font-display font-bold text-sm text-[#F5FFFA] tracking-wide">VERDIGRIS <span class="text-[#E0218A]">OS</span></span>
        </div>

        <nav aria-label="System Menu" class="hidden md:flex items-center space-x-1 text-xs text-[#8C94A8]">
          <button type="button" class="px-2.5 py-1 rounded-lg hover:bg-white/5 hover:text-[#3EB991] cursor-pointer transition-colors focus:outline-none flex items-center space-x-1" (click)="openLauncher()">
            <mat-icon class="text-xs text-[#3EB991]">apps</mat-icon>
            <span>Applications</span>
          </button>
          <button type="button" class="px-2.5 py-1 rounded-lg hover:bg-white/5 hover:text-[#F5FFFA] cursor-pointer transition-colors focus:outline-none" (click)="openStore()">App Store</button>
          <button type="button" class="px-2.5 py-1 rounded-lg hover:bg-white/5 hover:text-[#F5FFFA] cursor-pointer transition-colors focus:outline-none" (click)="openStudio()">Federation Studio</button>
        </nav>
      </div>

      <!-- Right: System Status & Clock -->
      <div class="flex items-center space-x-4 text-xs text-[#8C94A8]">
        <div class="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#14161C] border border-white/10">
          <span class="w-2 h-2 rounded-full bg-[#3EB991] animate-pulse"></span>
          <span class="text-[#F5FFFA] font-mono">Native Fed v22</span>
        </div>

        <div class="flex items-center space-x-1.5 text-[#F5FFFA] font-mono">
          <mat-icon class="text-sm text-[#20B2AA]">schedule</mat-icon>
          <span>{{ currentTime() }}</span>
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
