import { Component, signal, inject, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TablerIconComponent } from '../common/tabler-icon.component';
import { WindowManagerService } from '../../services/window-manager.service';
import { SearchService } from '../../services/search.service';

@Component({
  selector: 'app-statusbar',
  standalone: true,
  imports: [CommonModule, TablerIconComponent],
  template: `
    <header class="h-12 bg-[#08090C]/95 backdrop-blur-2xl border-b border-[rgba(245,255,250,0.18)] px-3 sm:px-4 flex items-center justify-between select-none z-50 shadow-lg gap-3">
      <!-- Zone 1: OS Branding Wordmark -->
      <div class="flex items-center space-x-3 shrink-0">
        <button
          type="button"
          class="flex items-center space-x-2 focus:outline-none cursor-pointer group"
          (click)="openLauncher()"
          title="Open Application Matrix">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6A0DAD] to-[#E0218A] flex items-center justify-center text-white shadow-lg shadow-[#E0218A]/30 ring-1 ring-white/20 group-hover:scale-105 transition-transform">
            <app-tabler-icon name="hexagon" size="16" class="drop-shadow-[0_0_4px_rgba(255,255,255,0.6)]" />
          </div>
          <span class="font-display font-bold text-xs sm:text-sm text-[#F5FFFA] tracking-[0.2em] whitespace-nowrap">
            ΛΞV <span class="text-[#E0218A] drop-shadow-[0_0_6px_rgba(224,33,138,0.5)]">OS</span>
          </span>
        </button>
      </div>

      <!-- Zone 2: Navigation Links (Clean Single-Line Text) -->
      <nav aria-label="System Menu" class="hidden md:flex items-center space-x-1 text-xs text-[#8C94A8]">
        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[#F5FFFA] hover:text-[#3EB991] cursor-pointer transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0"
          (click)="openLauncher()">
          <app-tabler-icon name="apps" size="15" class="text-[#3EB991]" />
          <span>Applications</span>
        </button>

        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[#F5FFFA] hover:text-[#20B2AA] cursor-pointer transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0"
          (click)="openStudio()">
          <app-tabler-icon name="network" size="15" class="text-[#20B2AA]" />
          <span>Federation Studio</span>
        </button>

        <button
          type="button"
          class="px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[#F5FFFA] hover:text-[#dfb7ff] cursor-pointer transition-all flex items-center space-x-1.5 whitespace-nowrap shrink-0"
          (click)="openStore()">
          <app-tabler-icon name="store" size="15" class="text-[#dfb7ff]" />
          <span>App Store</span>
        </button>
      </nav>

      <!-- Zone 3: Search Trigger & System Clock / Mobile Switcher -->
      <div class="flex items-center space-x-2 shrink-0">
        <!-- Quick Search Palette Trigger -->
        <button
          type="button"
          class="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#8C94A8] hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer"
          (click)="openSearch()"
          title="Search or Run Command (Cmd+Space)">
          <app-tabler-icon name="apps" size="14" class="text-[#3EB991]" />
          <span class="hidden sm:inline-block font-mono text-[11px]">Cmd+Space</span>
        </button>

        <!-- Active Processes Pill -->
        @if (windowManager.activeProcesses().length > 0) {
          <div class="hidden sm:flex items-center space-x-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#1A1C23] border border-white/10 text-[#20B2AA]">
            <span class="w-1.5 h-1.5 rounded-full bg-[#20B2AA] animate-pulse"></span>
            <span>{{ windowManager.activeProcesses().length }} proc</span>
          </div>
        }

        <!-- Clock Display -->
        <div class="flex items-center space-x-1.5 text-[#F5FFFA] font-mono text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
          <app-tabler-icon name="clock" size="14" class="text-[#20B2AA]" />
          <span class="font-semibold">{{ currentTime() }}</span>
        </div>

        <!-- Mobile Menu Toggle Button -->
        <button
          type="button"
          class="md:hidden w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#F5FFFA] transition-colors cursor-pointer"
          (click)="toggleMobileMenu()"
          title="Toggle Navigation Menu">
          <app-tabler-icon [name]="mobileMenuOpen() ? 'terminal' : 'apps'" size="16" />
        </button>
      </div>
    </header>

    <!-- Mobile Dropdown Navigation Drawer -->
    @if (mobileMenuOpen()) {
      <div class="md:hidden fixed top-12 left-0 right-0 z-50 bg-[#14161C]/98 backdrop-blur-2xl border-b border-white/10 p-3 shadow-2xl flex flex-col space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
        <button
          type="button"
          class="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium cursor-pointer"
          (click)="openLauncher(); closeMobileMenu()">
          <app-tabler-icon name="apps" size="18" class="text-[#3EB991]" />
          <span>Applications Matrix</span>
        </button>

        <button
          type="button"
          class="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium cursor-pointer"
          (click)="openStudio(); closeMobileMenu()">
          <app-tabler-icon name="network" size="18" class="text-[#20B2AA]" />
          <span>Native Federation v4 Studio</span>
        </button>

        <button
          type="button"
          class="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium cursor-pointer"
          (click)="openStore(); closeMobileMenu()">
          <app-tabler-icon name="store" size="18" class="text-[#dfb7ff]" />
          <span>App Store & Marketplace</span>
        </button>

        <button
          type="button"
          class="w-full flex items-center space-x-3 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-medium cursor-pointer"
          (click)="openSearch(); closeMobileMenu()">
          <app-tabler-icon name="terminal" size="18" class="text-[#E0218A]" />
          <span>Command Palette & Search</span>
        </button>
      </div>
    }
  `
})
export class StatusbarComponent {
  readonly windowManager = inject(WindowManagerService);
  readonly searchService = inject(SearchService);
  readonly currentTime = signal<string>('');
  readonly mobileMenuOpen = signal<boolean>(false);

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

  toggleMobileMenu() {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.mobileMenuOpen.set(false);
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

  openSearch() {
    this.searchService.toggle();
  }
}

