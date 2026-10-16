import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { WindowManagerService } from '../../services/window-manager.service';

@Component({
  selector: 'app-dock',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <nav aria-label="Application Dock" class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#14161C]/85 backdrop-blur-2xl border border-[rgba(245,255,250,0.18)] p-2 rounded-2xl shadow-2xl flex items-center space-x-3 z-50">
      <!-- App Launcher Button -->
      <button
        type="button"
        class="relative group w-12 h-12 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] border border-white/10 flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-110 shadow-md focus:outline-none"
        (click)="openAppLauncher()"
        title="Application Matrix & Launcher"
      >
        <mat-icon class="text-xl text-[#3EB991]">apps</mat-icon>
        <span class="absolute -top-8 px-2 py-1 rounded bg-[#08090C] text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">Applications</span>
      </button>

      <!-- App Store Button -->
      <button
        type="button"
        class="relative group w-12 h-12 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] border border-white/10 flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-110 shadow-md focus:outline-none"
        (click)="openAppStore()"
        title="App Store & Catalog"
      >
        <mat-icon class="text-xl text-[#20B2AA]">storefront</mat-icon>
        <span class="absolute -top-8 px-2 py-1 rounded bg-[#08090C] text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">App Store</span>
      </button>

      <!-- Native Federation Studio Button -->
      <button
        type="button"
        class="relative group w-12 h-12 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] border border-white/10 flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-110 shadow-md focus:outline-none"
        (click)="openStudio()"
        title="Native Federation Studio"
      >
        <mat-icon class="text-xl text-[#E0218A]">hub</mat-icon>
        <span class="absolute -top-8 px-2 py-1 rounded bg-[#08090C] text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">Federation Studio</span>
      </button>

      <div class="w-px h-8 bg-white/10 mx-1"></div>

      <!-- Active Process Icons -->
      @for (proc of windowManager.processes(); track proc.pid) {
        <button
          class="relative group w-12 h-12 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] border flex flex-col items-center justify-center transition-all hover:scale-110 shadow-md"
          [class.border-[#E0218A]]="proc.isOpen"
          [class.border-white/10]="!proc.isOpen"
          (click)="toggleProcess(proc.pid)"
          [title]="proc.title"
        >
          <mat-icon class="text-xl text-[#dfb7ff]">{{ proc.icon }}</mat-icon>
          @if (proc.isOpen) {
            <span class="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#E0218A]"></span>
          }
          <span class="absolute -top-8 px-2 py-1 rounded bg-[#08090C] text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">{{ proc.title }}</span>
        </button>
      }
    </nav>
  `
})
export class DockComponent {
  readonly windowManager = inject(WindowManagerService);

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
