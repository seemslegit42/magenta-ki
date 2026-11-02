import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';
import { RecycleBinService } from '../../services/recycle-bin.service';

@Component({
  selector: 'app-dock',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  template: `
    @if (windowManager.dockVisible()) {
      <nav aria-label="Application Dock" class="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 max-w-[calc(100vw-1.5rem)] bg-[#14161C]/90 backdrop-blur-2xl border border-[rgba(245,255,250,0.18)] p-1.5 sm:p-2 rounded-2xl shadow-2xl flex items-center space-x-2 sm:space-x-3 z-50 overflow-x-auto scrollbar-none">
        <!-- App Launcher Button -->
        <button
          type="button"
          class="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-[#222530] to-[#161820] hover:from-[#2A2E3D] hover:to-[#1A1C24] border border-[#3EB991]/30 hover:border-[#3EB991] flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#3EB991]/10 focus:outline-none shrink-0 cursor-pointer"
          (click)="openAppLauncher()"
          title="Application Matrix & Launcher"
        >
          <app-tabler-icon name="apps" size="18" class="text-[#3EB991] drop-shadow-[0_0_8px_rgba(62,185,145,0.4)]" />
          <span class="hidden sm:block absolute -top-8 px-2 py-1 rounded bg-[#08090C]/90 backdrop-blur-md text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow border border-white/10">Applications</span>
        </button>

        <!-- App Store Button -->
        <button
          type="button"
          class="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-[#222530] to-[#161820] hover:from-[#2A2E3D] hover:to-[#1A1C24] border border-[#20B2AA]/30 hover:border-[#20B2AA] flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#20B2AA]/10 focus:outline-none shrink-0 cursor-pointer"
          (click)="openAppStore()"
          title="App Store & Catalog"
        >
          <app-tabler-icon name="store" size="18" class="text-[#20B2AA] drop-shadow-[0_0_8px_rgba(32,178,170,0.4)]" />
          <span class="hidden sm:block absolute -top-8 px-2 py-1 rounded bg-[#08090C]/90 backdrop-blur-md text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow border border-white/10">App Store</span>
        </button>

        <!-- Native Federation Studio Button -->
        <button
          type="button"
          class="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-[#222530] to-[#161820] hover:from-[#2A2E3D] hover:to-[#1A1C24] border border-[#E0218A]/30 hover:border-[#E0218A] flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#E0218A]/10 focus:outline-none shrink-0 cursor-pointer"
          (click)="openStudio()"
          title="Native Federation v4 Studio & DevTools"
        >
          <app-tabler-icon name="network" size="18" class="text-[#E0218A] drop-shadow-[0_0_8px_rgba(224,33,138,0.4)]" />
          <span class="hidden sm:block absolute -top-8 px-2 py-1 rounded bg-[#08090C]/90 backdrop-blur-md text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow border border-white/10">Federation Studio</span>
        </button>

        <div class="w-px h-6 sm:h-8 bg-white/10 mx-0.5 shrink-0"></div>

        <!-- Active Process Icons -->
        @for (proc of windowManager.processes(); track proc.pid) {
          <button
            type="button"
            class="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1A1C23] hover:bg-[#22252F] border flex flex-col items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md shrink-0 cursor-pointer"
            [class.border-[#E0218A]]="proc.isOpen && !proc.isMinimized"
            [class.border-white/10]="!proc.isOpen || proc.isMinimized"
            (click)="toggleProcess(proc.pid)"
            [title]="proc.title"
          >
            <app-tabler-icon [name]="getTablerIconName(proc.icon)" size="18" class="text-[#dfb7ff]" />
            @if (proc.isOpen) {
              <span class="absolute bottom-1 w-1.5 h-1.5 rounded-full" [class.bg-[#3EB991]]="!proc.isMinimized" [class.bg-[#8C94A8]]="proc.isMinimized"></span>
            }
            <span class="hidden sm:block absolute -top-8 px-2 py-1 rounded bg-[#08090C] text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow">{{ proc.title }}</span>
          </button>
        }

        <!-- Recycle Bin Button -->
        <button
          type="button"
          class="relative group w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-[#222530] to-[#161820] hover:from-[#2A2E3D] hover:to-[#1A1C24] border border-[#FF4D6D]/30 hover:border-[#FF4D6D] flex items-center justify-center text-[#F5FFFA] transition-all hover:scale-105 active:scale-95 shadow-lg shadow-[#FF4D6D]/10 focus:outline-none shrink-0 cursor-pointer"
          (click)="openRecycleBin()"
          title="Recycle Bin">
          <app-tabler-icon name="trash" size="18" class="text-[#FF4D6D] drop-shadow-[0_0_8px_rgba(255,77,109,0.4)]" />
          @if (!recycleBin.isEmpty()) {
            <span class="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#FF4D6D] text-[9px] font-bold text-white flex items-center justify-center border border-[#14161C] shadow-sm">
              {{ recycleBin.itemCount() > 99 ? '99+' : recycleBin.itemCount() }}
            </span>
          }
          <span class="hidden sm:block absolute -top-8 px-2 py-1 rounded bg-[#08090C]/90 backdrop-blur-md text-[10px] font-mono text-[#F5FFFA] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow border border-white/10">Recycle Bin</span>
        </button>

        <!-- Hide Dock Trigger (Quick Minimize) -->
        <button
          type="button"
          class="w-7 h-7 rounded-lg hover:bg-white/10 text-[#8C94A8] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer ml-1"
          (click)="windowManager.toggleDock()"
          title="Minimize Dock">
          <app-tabler-icon name="arrow-down" size="14" />
        </button>
      </nav>
    } @else {
      <!-- Collapsed Dock Summon Pill -->
      <button
        type="button"
        class="absolute bottom-1 left-1/2 -translate-x-1/2 z-50 px-3 py-1 rounded-full bg-[#14161C]/90 backdrop-blur-md border border-white/15 text-[#8C94A8] hover:text-[#3EB991] text-[10px] font-mono flex items-center space-x-1 shadow-lg transition-all cursor-pointer"
        (click)="windowManager.toggleDock()"
        title="Show Application Dock">
        <app-tabler-icon name="apps" size="12" />
        <span>Show Dock</span>
      </button>
    }
  `
})
export class DockComponent {
  readonly windowManager = inject(WindowManagerService);
  readonly recycleBin = inject(RecycleBinService);

  getTablerIconName(icon: string): string {
    if (icon === 'terminal') return 'terminal';
    if (icon === 'settings') return 'settings';
    if (icon === 'security' || icon === 'shield') return 'shield';
    if (icon === 'chat' || icon === 'message') return 'message';
    if (icon === 'storefront') return 'store';
    if (icon === 'hub') return 'network';
    if (icon === 'delete' || icon === 'trash' || icon === 'delete_outline') return 'trash';
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

  openRecycleBin() {
    this.windowManager.openApp({
      id: 'recycle-bin',
      name: 'Recycle Bin',
      title: 'Recycle Bin',
      icon: 'delete',
      entryComponent: 'RecycleBinComponent',
      category: 'system'
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
